import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath, URL} from 'node:url';
import {transformSync} from 'esbuild';
const root = fileURLToPath(new URL('..', import.meta.url));
const source = fs.readFileSync(`${root}/src/autoPause.ts`, 'utf8');
const code = transformSync(
    `${source.slice(source.indexOf('const PauseOnSteamGameModule ='))}\nglobalThis.Module = PauseOnSteamGameModule;`,
    {loader: 'ts'}
).code;
let enabled = false,
    windows = [],
    updates = 0,
    nextId = 1;
const timers = new Map(),
    signals = new Map(),
    env = new Map();
const settings = {
    get_boolean: () => enabled,
    connect: (_, cb) => {
        const id = nextId++;
        signals.set(id, cb);
        return id;
    },
    disconnect: id => signals.delete(id),
};
class Base {
    constructor(s) {
        this.settings = s;
    }

    update() {
        updates++;
    }
}
const context = {
    GObject: {registerClass: c => c},
    AutoPauseModule: Base,
    TextDecoder,
    global: {display: {list_all_windows: () => windows}},
    GLib: {
        PRIORITY_DEFAULT: 0,
        SOURCE_CONTINUE: true,
        timeout_add_seconds: (_, seconds, cb) => {
            assert.equal(seconds, 3);
            const id = nextId++;
            timers.set(id, cb);
            return id;
        },
        source_remove: id => timers.delete(id),
        file_get_contents: path => {
            if (!env.has(path))
                throw Error('denied or gone');
            return [true, new TextEncoder().encode(env.get(path))];
        },
    },
};
vm.runInNewContext(code, context);
const mod = new context.Module(settings);
const win = (name, pid = 0) => ({
    get_wm_class: () => name,
    get_wm_class_instance: () => null,
    get_gtk_application_id: () => null,
    get_pid: () => pid,
});
const tick = () => [...timers.values()].forEach(cb => cb());
const configure = value => {
    enabled = value;
    [...signals.values()].forEach(cb => cb());
};
mod.enable();
assert.equal(timers.size, 0);
assert.equal(mod.shouldAutoPause(), false);
configure(true);
assert.equal(timers.size, 1);
windows = [win('Steam', 1)];
env.set('/proc/1/environ', 'SteamAppId=0\0');
tick();
assert.equal(mod.shouldAutoPause(), false);
windows.push(win('steam_app_570'));
tick();
assert.equal(mod.shouldAutoPause(), true);
const count = updates;
tick();
assert.equal(updates, count);
windows = [win('NativeGame', 2)];
env.set('/proc/2/environ', 'SteamAppId=123\0');
tick();
assert.equal(mod.shouldAutoPause(), true);
env.set('/proc/2/environ', 'SteamGameId=987654321\0');
tick();
assert.equal(mod.shouldAutoPause(), true);
env.set('/proc/2/environ', 'NotSteamAppId=123\0SteamAppId=0\0');
tick();
assert.equal(mod.shouldAutoPause(), false);
windows = [win('steam_app_570'), win('steam_app_730')];
tick();
windows.shift();
tick();
assert.equal(mod.shouldAutoPause(), true);
windows = [];
tick();
assert.equal(mod.shouldAutoPause(), false);
windows = [win('steam_app_570')];
tick();
configure(false);
assert.equal(mod.shouldAutoPause(), false);
assert.equal(timers.size, 0);
configure(true);
assert.equal(mod.shouldAutoPause(), true);
mod.disable();
assert.equal(timers.size, 0);
assert.equal(signals.size, 0);
assert.equal(mod.shouldAutoPause(), false);
console.log(
    'PASS: disabled polling, Steam client exclusion, Proton/native games, exact IDs, multiple games, resume, stable-state deduplication, setting changes, cleanup'
);

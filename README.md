# Hanabi Custom

Live video wallpaper for **GNOME Shell 50 and 51 on Wayland**, based on
[Hanabi by Jeff Shee and contributors](https://github.com/jeffshee/gnome-ext-hanabi).
This fork adds monitor selection and automatic pausing for Steam games.

## Features

- Play video on one selected monitor or all monitors.
- Keep the normal GNOME wallpaper on unselected monitors, including in the overview and lock screen.
- Pause for detected Steam games, even when minimized or on another workspace.
- Retain Hanabi's video fitting, audio controls, wallpaper rotation, and other auto-pause options.

The extension is named **Hanabi Custom** and uses ID
`hanabi-extension@hsantos92.github.io`. Its settings and renderer identity are
separate from official Hanabi, so official extension updates cannot overwrite it.
Other GNOME extensions can continue updating normally.

## Install

The current custom version is on `master`. Older GNOME releases and X11 are not
supported by this version; consult upstream for legacy versions.

Build tools: Node.js, npm, Make, Meson, Ninja, gettext, and GLib tools.
Playback requires GJS, GTK 4, and GStreamer with the GTK 4 video sink and codecs
for your videos. `GstPlay` is preferred; the GTK media backend is a fallback.

```bash
git clone -b master https://github.com/hsantos92/gnome-ext-hanabi.git
cd gnome-ext-hanabi
make install
```

Log out and back in, then enable **Hanabi Custom** in the Extensions app. Open its
preferences and select a video under **General → Video Path**.

### Switching from official Hanabi

Disable **Hanabi Extension** before enabling **Hanabi Custom**. Run only one copy.
To copy your old settings after installation, first close preferences, then run:

```bash
dconf dump /io/github/jeffshee/hanabi-extension/ > hanabi-settings-backup.ini
dconf load /io/github/hsantos92/hanabi-extension/ < hanabi-settings-backup.ini
```

Keep the backup file. The custom settings live at
`/io/github/hsantos92/hanabi-extension/`.

## Settings

### Monitor selection

Choose **General → Wallpaper Monitor**. **All Monitors** is the default.
Changes apply automatically and restart playback.

Selection follows the connector, such as `DP-1` or `HDMI-1`. Disconnecting it
stops live wallpaper until reconnection. Moving a display to another port may
require selecting it again. Mirrored displays share a desktop and cannot show
different wallpapers.

### Steam auto-pause

Enable **Auto Pause → Pause on Steam Game**. The extension checks game windows
across all workspaces every three seconds. It resumes after the last detected
game window closes, unless another pause condition or a manual pause remains.
Opening the Steam library alone does not pause playback.

Detection uses Proton's `steam_app_<id>` window identity and Steam app IDs in
window processes. Games without a window or these identifiers may not be detected.
**Pause on Maximize or Fullscreen → Any Monitor** is a broader fallback, but also
pauses for ordinary maximized applications on your other monitors.

### Performance and video backends

- **Enable Graphics Offload** can reduce rendering overhead. In a short test on
  an RTX 4090 with the same 720p video, renderer CPU use fell from 24.0% to 10.2%
  of one logical CPU. Results depend on the system and video; this is not a
  general benchmark. Disable it if rendering becomes unreliable.
- Graphics offload is separate from hardware video decoding. NVIDIA decoding
  was verified with offload both on and off.
- Keep **Force GtkMediaFile** off to allow the preferred GStreamer playback path.
- Turn **Show on Lock Screen** off to stop playback while locked.
- Lower-resolution or lower-frame-rate videos can reduce playback work.

Restart Hanabi after changing startup-only backend settings, including graphics
offload and **Prefer clappersink**. Video path, monitor, and auto-pause settings
apply without a restart.

The default sink is `gtk4paintablesink`. **Prefer clappersink** is optional and
requires a native Clapper GStreamer plugin. On the tested Arch/NVIDIA setup,
both the packaged plugin and a current source build crashed in Clapper's OpenGL
uploader. Keep it disabled on affected systems. See the
[Clapper investigation](docs/clapper-investigation.md) for versions and findings.

A Clapper application wrapper using `--video-sink gtk4paintablesink` avoids
`clappersink`; it does not repair that plugin or affect Hanabi's backend choice.

## Updates

Custom updates come from this repository. GNOME's official Hanabi updates do
not update this fork. To update an existing checkout without overwriting local
commits:

```bash
git pull --ff-only
make install
```

Log out and back in afterward. If Git reports diverging branches, review and
merge the changes before installing. Upstream fixes must also be deliberately
merged into this fork.

## Troubleshooting

- **No video:** verify the video path and availability of `gtk4paintablesink`
  with `gst-inspect-1.0 gtk4paintablesink`. Install the appropriate codecs and
  GTK media backend for your distribution.
- **High CPU:** confirm hardware decoding rather than assuming a settings toggle
  enables it. On NVIDIA, `gst-inspect-1.0 nvh264dec` checks plugin availability;
  `nvidia-smi pmon -s um` can show decoder activity for the renderer process.
- **Blur My Shell transparency:** if application blur applies to all windows,
  add `io.github.hsantos92.HanabiRenderer` to its application blacklist.
- **Logs:** run `make log` from the checkout to follow GNOME Shell messages.

## Development

Run these checks from the repository root before pushing:

```bash
npm ci
npm run typecheck
npm run lint
node tests/steam-auto-pause.mjs
npm run build
```

Use the full `npm run lint` command so tests and tooling are checked as well as
`src/`. See [lint tooling](tools/README.md) for setup and
[development commands](docs/dev.md) for build and release details.
[Wallpaper scripting](docs/scripting.md) uses this fork's settings namespace.

GitHub Actions checks TypeScript and lint, then packages the extension ZIP.
The workflow supports pushes and pull requests to `master`.

## Credits and license

Original Hanabi code and translations are by Jeff Shee and contributors.
This fork retains the upstream translation domain and copyright notices.
Licensed under [GPL-3.0-or-later](LICENSE).

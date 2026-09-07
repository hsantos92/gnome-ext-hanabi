# Lint tooling

This directory contains the lint runner and GNOME ESLint configuration used by
Hanabi Custom. The tooling is based on
[gnome-shell-extensions](https://gitlab.gnome.org/GNOME/gnome-shell-extensions/).

## Setup

From the repository root:

```bash
npm ci
npm ci --prefix tools
```

Root dependencies provide TypeScript and the build tools; `tools/node_modules`
provides the lint runner and GNOME rules. Both directories have lockfiles.
`tools/run-eslint.sh` installs its own dependencies automatically if missing,
but explicit installation matches CI.

## Run checks

```bash
npm run lint
```

This checks the whole repository, including `tests/steam-auto-pause.mjs`.
Limiting lint to `src/` is insufficient for CI.

To apply automatic formatting fixes, then verify:

```bash
npm run lint -- --fix
npm run lint
```

Some errors need manual edits. After modifying the Steam regression test, also
run it with `node tests/steam-auto-pause.mjs` from the repository root.

Rules are defined in [`eslint.config.js`](../eslint.config.js).

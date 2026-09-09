# Vite+ without Oxc bin wrappers

Reproduction for [vite-plus#1557](https://github.com/voidzero-dev/vite-plus/issues/1557).

Requires Node.js 24.11+ and pnpm 12.3.4.

## Reproduce

```sh
node scripts/install.mjs
```

This reinstalls dependencies and removes Vite+'s `oxlint` / `oxfmt` bin entries, wrapper files, and `node_modules/.bin` shims. The underlying tools remain installed so `vp` still works.

1. Open this folder in VS Code or IntelliJ / WebStorm with the Oxc plugin enabled.
2. Use automatic binary discovery; editor configs are included. Clear any custom binary/config paths.
3. Open `src/example.js`: Oxc should report `no-console` from `vite.config.ts`.
4. Format the file with Oxc: expect single quotes and no semicolon.

If either check fails, inspect the Oxc logs for the selected binary or startup errors. The intended replacement commands are `vp lint --lsp` and `vp fmt --lsp`.

## CLI control

```sh
pnpm exec vp lint src/example.js
pnpm exec vp fmt --check src/example.js
```

Both should report errors for the intentionally invalid sample, confirming `vp` still reads the config. Only CLI behavior has been verified; editor checks are manual.

## Restore wrappers

```sh
node scripts/install.mjs --baseline
```

Restart the editor and repeat the checks. If formatting changed the sample, restore it with `git restore src/example.js` first.

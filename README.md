# Vite+ without Oxc bin wrappers

Reproduction for [vite-plus#1557](https://github.com/voidzero-dev/vite-plus/issues/1557).

## Steps to reproduce

1. Run `node scripts/install.mjs` with Node.js 24.11+ and pnpm 12.3.4 installed.
2. Open this folder in VS Code or IntelliJ / WebStorm with the Oxc plugin enabled and automatic binary discovery selected.
3. Open `src/example.js` and format it with Oxc.

## Expected behavior

Oxc automatically uses Vite+ without the `oxlint` / `oxfmt` wrappers:

- Reports `no-console` from `vite.config.ts`.
- Formats using single quotes and no semicolon.

## Actual behavior

Based on source inspection; not yet verified in an IDE:

- VS Code still searches for `oxlint` / `oxfmt` and appends only `--lsp`, without a Vite+ subcommand.
- IntelliJ / WebStorm still resolves `vite-plus/bin/oxlint` and `vite-plus/bin/oxfmt`, which the script removes.

Neither implementation automatically switches to `vp lint --lsp` / `vp fmt --lsp`.

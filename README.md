# Vite+ without Oxc bin wrappers

Reproduction for [vite-plus#1557](https://github.com/voidzero-dev/vite-plus/issues/1557).

## Expected behavior

With Vite+'s `oxlint` and `oxfmt` wrappers removed, the Oxc extension in VS Code and IntelliJ / WebStorm should:

- Automatically detect and use Vite+.
- Report `no-console` in `src/example.js` according to `vite.config.ts`.
- Format the file using single quotes and no semicolon according to `vite.config.ts`.

# Vite+ without Oxc bin wrappers

Reproduction for [vite-plus#1557](https://github.com/voidzero-dev/vite-plus/issues/1557): can editor extensions use `vp lint --lsp` / `vp fmt --lsp` after the `oxlint` and `oxfmt` wrappers are removed?

This project pins **vite-plus 0.3.1** and uses only `vite.config.ts` for lint and format configuration. It does not install VS Code, IntelliJ, or editor E2E tooling.

## Setup

Use Node.js 24.11+ and pnpm 12.3.4. From this directory:

```sh
node scripts/install.mjs
# Or, with pnpm already available:
pnpm run repro
```

The script recreates **this project's `node_modules`** using the committed lockfile, then removes:

- `oxlint` / `oxfmt` from the installed `vite-plus/package.json` `bin` map.
- The installed `vite-plus/bin/oxlint` and `vite-plus/bin/oxfmt` files.
- `node_modules/.bin/oxlint` and `oxfmt`, including `.cmd`, `.ps1`, and `.exe` variants.

The actual `oxlint` / `oxfmt` dependencies are intentionally retained: Vite+ needs them to run its commands. This simulates removing the **published wrappers**, not removing the underlying tools. Other transitive binary entries are left intact, so editor fallbacks remain observable.

The workspace config disables pnpm's global virtual store and uses copied package files to avoid modifying packages shared with other projects. Running a plain `pnpm install` afterward can restore shims; rerun the reproduction script if you do so.

## CLI control

```sh
pnpm exec vp lint src/example.js
pnpm exec vp fmt --check src/example.js
```

Both commands should exit nonzero: the sample intentionally triggers `no-console` and formatting errors. This verifies that `vp` still works and reads `vite.config.ts` without wrappers.

To inspect formatting without changing the file (POSIX shell):

```sh
pnpm exec vp fmt --stdin-filepath src/example.js < src/example.js
```

The result should contain single quotes and no semicolon:

```js
console.log('Vite+ configuration must be loaded')
```

The intended editor commands are `vp lint --lsp` and `vp fmt --lsp`. These are long-running LSP servers, so simply launching them in a terminal is not an editor integration test.

## VS Code

1. Open **this folder alone** in a trusted window with the Oxc extension (`oxc.oxc-vscode`) enabled. Record its version.
2. Use the committed `.vscode/settings.json`. Remove any inherited custom `oxc.path.oxlint`, `oxc.path.oxfmt`, or explicit config-path overrides. Leave binary discovery automatic.
3. Open `src/example.js`. Check whether Oxc reports the configured `no-console` error.
4. Run **Format Document With… → Oxc**. Check for single quotes and no semicolon.
5. Inspect Oxc's lint/format channels under **View → Output**, recording the selected binary path and any startup/config errors.

Do not treat the absence of a startup error as success: the extension may fall back to a standalone/global/bundled Oxc binary that ignores `vite.config.ts`. Correct lint and format behavior, plus the chosen binary path, are the useful evidence.

The settings deliberately do not point `oxc.path.*` at `vp`: an extension that only appends `--lsp` would invoke `vp --lsp`, without the required `lint` / `fmt` subcommand.

## IntelliJ / WebStorm

1. Open this folder with a JavaScript-capable JetBrains IDE and the Oxc plugin enabled. Record both versions.
2. Select an installed Node.js interpreter in the IDE. The committed `.idea/OxcSettings.xml` and `.idea/OxfmtSettings.xml` request `AUTOMATIC` discovery. Confirm both tools are set to automatic in the Oxc settings; clear any custom executable/config overrides.
3. Open `src/example.js` and check for the configured `no-console` error.
4. Invoke the Oxc formatter through the plugin's formatting integration. If needed, enable its format-on-save setting and save the sample. Check for single quotes and no semicolon; the IDE's built-in formatter is not evidence of Oxc working.
5. Record Oxc notifications and process-start errors from the IDE log (**Help → Show Log in Finder/Explorer**).

The XML setting names were checked against the plugin source; they have not been validated by launching an IDE. UI labels and formatting actions may vary by plugin version.

## Baseline / reset

Close the editor first, then run:

```sh
node scripts/install.mjs --baseline
# Equivalent:
pnpm run baseline
```

This reinstalls the original package, including both wrappers and their bin entries. Reopen the editor and repeat the same checks. Fully restarting matters: an already-running language server can keep working after its wrapper is deleted.

Before comparing formatting again, restore `src/example.js` to its original double-quoted, semicolon-terminated form. After committing/cloning the repository, `git restore src/example.js` does this.

Run `node scripts/install.mjs` again to return to the missing-wrapper state.

## What to report

| Check | Baseline | Without wrappers |
| --- | --- | --- |
| `vp lint` reports `no-console` | Expected | Expected |
| `vp fmt --stdin-filepath` uses single quotes, no semicolon | Expected | Expected |
| Editor reports `no-console` | Record | Record |
| Editor's Oxc formatter uses the Vite+ settings | Record | Record |
| Selected binary path / startup error | Record | Record |

Record the OS, Node.js version, editor/plugin versions, and logs. Editor outcomes are intentionally left for manual verification; this repository does not claim an IDE E2E result.

## Source context

- [VS Code binary lookup](https://github.com/oxc-project/oxc-vscode/blob/2bd681477b14e377c5ddcd8ffbf676dc6b21d50a/client/findBinary.ts#L92) searches the `oxlint` / `oxfmt` shims.
- [VS Code LSP invocation](https://github.com/oxc-project/oxc-vscode/blob/2bd681477b14e377c5ddcd8ffbf676dc6b21d50a/client/tools/lsp_helper.ts#L62) appends `--lsp` without a Vite+ subcommand.
- [IntelliJ Vite+ lookup](https://github.com/oxc-project/oxc-intellij-plugin/blob/17ccfa1ead254c56b680f435a517fd319ab44bc2/src/main/kotlin/com/github/oxc/project/oxcintellijplugin/viteplus/VitePlusPackage.kt#L38) resolves `vite-plus/bin/oxlint` and `vite-plus/bin/oxfmt`.

These are pinned source snapshots, not claims about all future extension versions.

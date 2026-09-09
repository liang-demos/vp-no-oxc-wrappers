import { execSync } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

process.chdir(fileURLToPath(new URL('..', import.meta.url)))

// Reinstall to restore any wrappers removed by a previous run.
rmSync('node_modules', { recursive: true, force: true })
execSync('pnpm install --frozen-lockfile', { stdio: 'inherit' })

if (!process.argv.includes('--baseline')) {
  const path = 'node_modules/vite-plus/package.json'
  const pkg = JSON.parse(readFileSync(path, 'utf8'))

  for (const name of ['oxlint', 'oxfmt']) {
    delete pkg.bin[name]
    rmSync(`node_modules/vite-plus/bin/${name}`)
    for (const suffix of ['', '.cmd', '.ps1', '.exe']) {
      rmSync(`node_modules/.bin/${name}${suffix}`, { force: true })
    }
  }

  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
}

console.log('Done. Restart the editor before testing.')

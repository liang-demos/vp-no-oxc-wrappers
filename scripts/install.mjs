import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)
assert(
  args.length === 0 || (args.length === 1 && args[0] === '--baseline'),
  'Usage: node scripts/install.mjs [--baseline]',
)

// Recreate only this reproduction's dependencies; the shared pnpm store stays unchanged.
rmSync(join(root, 'node_modules'), { recursive: true, force: true })
const installArgs = ['install', '--frozen-lockfile']
const pnpm = process.env.npm_execpath ?? 'pnpm'
const result = /\.[cm]?js$/.test(pnpm)
  ? spawnSync(process.execPath, [pnpm, ...installArgs], { cwd: root, stdio: 'inherit' })
  : spawnSync(pnpm, installArgs, {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32' && (pnpm === 'pnpm' || pnpm.endsWith('.cmd')),
    })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

const nodeModules = realpathSync(join(root, 'node_modules'))
const vitePlus = realpathSync(join(nodeModules, 'vite-plus'))
const packagePath = join(vitePlus, 'package.json')
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
const tools = ['oxlint', 'oxfmt']

// Refuse to edit an external/global installation if pnpm settings were overridden.
const packageRelativePath = relative(nodeModules, vitePlus)
assert(packageRelativePath.startsWith(`.pnpm${sep}`), 'Expected a project-local pnpm installation')
assert.equal(pkg.version, '0.3.1', 'This reproduction targets vite-plus@0.3.1')
for (const tool of tools) {
  assert.equal(pkg.bin[tool], `./bin/${tool}`)
  assert(existsSync(join(vitePlus, 'bin', tool)), `Missing baseline wrapper: ${tool}`)
}

if (args[0] === '--baseline') {
  console.log('\nBaseline restored: Vite+ oxlint/oxfmt wrappers are installed.')
} else {
  for (const tool of tools) {
    delete pkg.bin[tool]
    rmSync(join(vitePlus, 'bin', tool))
    // Package managers create different shims on Unix and Windows.
    for (const suffix of ['', '.cmd', '.ps1', '.exe']) {
      rmSync(join(nodeModules, '.bin', `${tool}${suffix}`), { force: true })
    }
  }
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log(
    '\nReproduction ready: Vite+ oxlint/oxfmt bin entries, wrapper files, and top-level shims removed.',
  )
}

assert(existsSync(join(vitePlus, 'bin', 'vp')), 'The vp entry point must remain installed')
console.log('The underlying oxlint/oxfmt dependencies remain available to vp.')
console.log('Fully restart the editor before switching between baseline and reproduction.')

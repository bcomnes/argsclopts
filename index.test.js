import test from 'node:test'
import assert from 'node:assert'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { formatHelpText, readPkg, header, footer } from './index.js'

/**
 * @typedef {import('./index.js').ArgscloptsParseArgsOptionsConfig} ArgscloptsParseArgsOptionsConfig
 */

test('Header and footer accept explicitly undefined optional values', async () => {
  const pkgPath = join(import.meta.dirname, 'package.json')
  const pkg = await readPkg(pkgPath)

  assert.equal(await header({
    pkgPath,
    name: undefined,
    headerFn: undefined,
    exampleFn: undefined
  }), `Usage: ${pkg.name} [options]\n\n    Example: ${pkg.name}\n`)

  assert.equal(await footer({
    pkgPath,
    name: undefined,
    version: undefined,
    footerFn: undefined
  }), `${pkg.name} (v${pkg.version})`)

  assert.equal(await header({
    pkgPath: undefined,
    name: 'example'
  }), 'Usage: example [options]\n\n    Example: example\n')

  assert.equal(await footer({
    pkgPath: undefined,
    name: 'example',
    version: '1.0.0'
  }), 'example (v1.0.0)')
})

test('Help text string is generated', async (_) => {
  // @ts-ignore
  const pkgPath = join(import.meta.dirname, 'package.json')
  /** @type {ArgscloptsParseArgsOptionsConfig} */
  const options = {
    foo: {
      type: 'boolean',
      short: 'f',
      help: 'A foo flag thats a boolean'
    },
    bar: {
      type: 'string',
      help: 'A bar flag thats a string'
    }
  }
  const args = ['-f', '--bar', 'b']
  const helpText = await formatHelpText({
    options,
    pkgPath
  })

  const {
    values,
    positionals
  } = parseArgs({ args, options })

  assert.deepEqual(values, { foo: true, bar: 'b' }, 'Args parse right')
  assert.deepEqual(positionals, [], 'Args parse right')

  const pkg = await readPkg(pkgPath)

  const expect = `Usage: argsclopts [options]

    Example: argsclopts

    --foo, -f             A foo flag thats a boolean
    --bar                 A bar flag thats a string

argsclopts (v${pkg.version})`

  assert.equal(helpText, expect, 'help text is generated correctly.')
})

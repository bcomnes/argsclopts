/** @import { ArgscloptsParseArgsOptionsConfig } from './index.js' */

import test from 'node:test'
import assert from 'node:assert'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { formatHelpText, printHelpText, usage, readPkg, header, footer } from './index.js'

for (const length of [21, 22, 23, 24]) {
  test(`Usage separates and aligns descriptions for ${length}-character labels`, () => {
    const label = '--' + 'x'.repeat(length - 2)
    const expected = length < 23
      ? `    ${label}${' '.repeat(23 - length)}Description\n`
      : `    ${label}\n${' '.repeat(27)}Description\n`

    assert.equal(usage({
      [label.slice(2)]: { type: 'boolean', help: 'Description' }
    }), expected)
    assert.equal(usage({
      example: { type: 'string', helpLabel: label, help: 'Description' }
    }), expected)
  })
}

test('Usage includes short aliases when measuring label width', () => {
  assert.equal(usage({
    'continue-on-error': { type: 'boolean', short: 'c', help: 'Continue' },
    abcdefghijklmnopqr: { type: 'boolean', short: 'a', help: 'Next' }
  }), `    --continue-on-error, -c\n${' '.repeat(27)}Continue\n    --abcdefghijklmnopqr, -a\n${' '.repeat(27)}Next\n`)
})

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

    --foo, -f              A foo flag thats a boolean
    --bar                  A bar flag thats a string

argsclopts (v${pkg.version})`

  assert.equal(helpText, expect, 'help text is generated correctly.')
})

test('Usage without format or with an empty format preserves corrected spacing and text', () => {
  /** @type {ArgscloptsParseArgsOptionsConfig} */
  const options = {
    short: { type: 'boolean', short: 's', help: 'alpha  beta\nnext\r\n\nlast' },
    touching: { type: 'string', helpLabel: 'x'.repeat(22), help: 'one space' },
    boundary: { type: 'string', helpLabel: 'y'.repeat(23), help: 'own line' },
    long: { type: 'string', helpLabel: 'z'.repeat(24), help: 'long label' }
  }
  const expected = [
    '    --short, -s' + ' '.repeat(12) + 'alpha  beta\nnext\r\n\nlast',
    '    ' + 'x'.repeat(22) + ' one space',
    '    ' + 'y'.repeat(23),
    ' '.repeat(27) + 'own line',
    '    ' + 'z'.repeat(24),
    ' '.repeat(27) + 'long label',
    ''
  ].join('\n')

  assert.equal(usage(options), expected)
  assert.equal(usage(options, {}), expected)
})

test('Wrapping counts the full line width and accepts exact fits', () => {
  for (const { lineWidth, lines } of [
    { lineWidth: 36, lines: ['alpha', 'beta'] },
    { lineWidth: 37, lines: ['alpha beta'] },
    { lineWidth: 38, lines: ['alpha beta'] }
  ]) {
    const actual = usage({ x: { type: 'string', help: 'alpha beta' } }, { lineWidth })
    const expected = '    --x' + ' '.repeat(20) + lines.join('\n' + ' '.repeat(27)) + '\n'
    assert.equal(actual, expected, `lineWidth=${lineWidth}`)
    for (const line of actual.trimEnd().split('\n')) {
      assert.ok(line.length <= lineWidth)
    }
  }

  assert.equal(
    usage({ x: { type: 'string', help: 'a b' } }, { lineWidth: 28 }),
    '    --x' + ' '.repeat(20) + 'a\n' + ' '.repeat(27) + 'b\n'
  )
})

test('Active layout keeps a gap and moves labels at or beyond the description column', () => {
  for (const descriptionColumn of [16, 27]) {
    const before = 'a'.repeat(descriptionColumn - 5)
    const at = 'b'.repeat(descriptionColumn - 4)
    const after = 'c'.repeat(descriptionColumn - 3)
    const actual = usage({
      before: { type: 'string', helpLabel: before, help: 'one' },
      at: { type: 'string', helpLabel: at, help: 'two' },
      after: { type: 'string', helpLabel: after, help: 'three' },
      run: { type: 'boolean', short: 'r', help: 'four' }
    }, { descriptionColumn, lineWidth: descriptionColumn + 10 })

    assert.equal(actual, [
      '    ' + before + ' one',
      '    ' + at,
      ' '.repeat(descriptionColumn) + 'two',
      '    ' + after,
      ' '.repeat(descriptionColumn) + 'three',
      '    --run, -r' + ' '.repeat(descriptionColumn - 13) + 'four',
      ''
    ].join('\n'))
  }
})

test('A custom column alone aligns explicit lines without wrapping or collapsing whitespace', () => {
  assert.equal(usage({
    x: { type: 'string', helpLabel: 'VALUE', short: 'x', help: 'alpha  beta gamma delta\r\nnext\n\nlast' }
  }, { descriptionColumn: 12 }), [
    '    VALUE   alpha  beta gamma delta',
    ' '.repeat(12) + 'next',
    '',
    ' '.repeat(12) + 'last',
    ''
  ].join('\n'))
})

test('Wrapping separates whitespace-delimited words but never splits oversized words', () => {
  assert.equal(usage({
    x: { type: 'string', help: '  one\t two   abcdefghijk\tend  ' }
  }, { descriptionColumn: 12, lineWidth: 19 }), [
    '    --x     one two',
    ' '.repeat(12) + 'abcdefghijk',
    ' '.repeat(12) + 'end',
    ''
  ].join('\n'))
})

test('Wrapping preserves explicit LF and CRLF lines, blank lines, and empty descriptions', () => {
  for (const newline of ['\n', '\r\n']) {
    assert.equal(usage({
      x: { type: 'string', help: ['one two', 'three', '', '', 'four five', ''].join(newline) },
      empty: { type: 'string', help: '' }
    }, { descriptionColumn: 16, lineWidth: 24 }), [
      '    --x         one two',
      ' '.repeat(16) + 'three',
      '',
      '',
      ' '.repeat(16) + 'four',
      ' '.repeat(16) + 'five',
      '',
      '    --empty     ',
      ''
    ].join('\n'))
  }

  assert.equal(usage({}, { lineWidth: 40 }), '')
})

test('Default suffixes participate in wrapping and retain legacy truthy-default behavior', () => {
  assert.equal(usage({
    x: { type: 'string', help: 'pick', default: 'blue' },
    yes: { type: 'boolean', help: 'yes', default: true },
    no: { type: 'boolean', help: 'no', default: false },
    empty: { type: 'string', help: 'empty', default: '' }
  }, { descriptionColumn: 16, lineWidth: 31 }), [
    '    --x         pick (default:',
    ' '.repeat(16) + '"blue")',
    '    --yes       yes (default:',
    ' '.repeat(16) + 'true)',
    '    --no        no',
    '    --empty     empty',
    ''
  ].join('\n'))
})

test('Invalid dimensions throw RangeError, including for an empty option list', () => {
  for (const descriptionColumn of [4, 0, -1, 5.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => usage({}, { descriptionColumn }), RangeError, `descriptionColumn=${descriptionColumn}`)
  }
  for (const lineWidth of [27, 26, 0, -1, 27.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => usage({}, { lineWidth }), RangeError, `lineWidth=${lineWidth}`)
  }
  assert.throws(() => usage({}, { descriptionColumn: 30, lineWidth: 30 }), RangeError)
  assert.throws(() => usage({}, { descriptionColumn: 30, lineWidth: 29 }), RangeError)
  assert.equal(usage({ x: { type: 'string', help: 'a b' } }, {
    descriptionColumn: 5,
    lineWidth: 6
  }), '    --x\n     a\n     b\n')
})

test('formatHelpText forwards format while retaining the full header and footer', async () => {
  const helpText = await formatHelpText({
    name: 'example',
    version: '1.2.3',
    options: { x: { type: 'string', help: 'alpha beta gamma' } },
    format: { descriptionColumn: 12, lineWidth: 22 }
  })

  assert.equal(helpText, [
    'Usage: example [options]',
    '',
    '    Example: example',
    '',
    '    --x     alpha beta',
    ' '.repeat(12) + 'gamma',
    '',
    'example (v1.2.3)'
  ].join('\n'))
})

test('printHelpText forwards format and prints the full help text once', async t => {
  const log = t.mock.method(console, 'log', () => {})

  await printHelpText({
    name: 'example',
    version: '1.2.3',
    options: { x: { type: 'string', help: 'alpha beta gamma' } },
    format: { lineWidth: 37 }
  })

  assert.equal(log.mock.callCount(), 1)
  const [call] = log.mock.calls
  assert.ok(call)
  assert.deepEqual(call.arguments, [[
    'Usage: example [options]',
    '',
    '    Example: example',
    '',
    '    --x' + ' '.repeat(20) + 'alpha beta',
    ' '.repeat(27) + 'gamma',
    '',
    'example (v1.2.3)'
  ].join('\n')])
})

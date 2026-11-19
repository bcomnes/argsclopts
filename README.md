# argsclopts
[![latest version](https://img.shields.io/npm/v/argsclopts.svg)](https://www.npmjs.com/package/argsclopts)
[![Actions Status](https://github.com/bcomnes/argsclopts/workflows/tests/badge.svg)](https://github.com/bcomnes/argsclopts/actions)

[![downloads](https://img.shields.io/npm/dm/argsclopts.svg)](https://npmtrends.com/argsclopts)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![Socket Badge](https://socket.dev/api/badge/npm/package/argsclopts)](https://socket.dev/npm/package/argsclopts)

[cliclopts](https://github.com/finnp/cliclopts) but for [Node.js parseArgs](https://nodejs.org/api/util.html#utilparseargsconfig). A library that formats standard usage strings using the `node:util` `parseArgs` `options` object shape with an additional `help` field added to it.

```
npm install argsclopts
```

## Usage

``` js
import { printHelpText } from 'argsclopts'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

/**
 * @typedef {import('argsclopts').ArgscloptsParseArgsOptionsConfig} ArgscloptsParseArgsOptionsConfig
 */

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

await printHelpText({
  options,
  pkgPath
})
/*

Usage: argsclopts [options]

    Example: argsclopts

    --foo, -f              A foo flag thats a boolean
    --bar                  A bar flag thats a string

argsclopts (v1.0.0)

 */

const args = ['-f', '--bar', 'b']
const { values } = parseArgs({ args, options })
console.log(values)
// { foo: true, bar: 'b' }
```

## API

### `import { formatHelpText, printHelpText, usage, header, footer } from 'argsclopts'`

You can import `formatHelpText`, `printHelpText`, `usage`, `header`, `footer` from `argsclopts`.
s
### `helpText = formatHelpText({ options, [format], [pkgPath], [name], [version], [footerFn], [headerFn], [exampleFn]})`

Generate the `helptText` string. Requires passing in an `options` object that you provide to [`parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig), with one additional field per flag: `help`. You should also provide `pkgPath` (a resolved path the `package.json`) so that a bin name and version can be resolved. Otherwise, pass in a `name` and `version` to override any resolved data from `pkgPath`. If both  `name` and `version` are provided, a `pkgPath` is required. The `headerFn`, and `exampleFn` can be used to override the header text and the `footerFn` can be used to override the footer text.

An example `options` object might look like this:

```js
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
```


### `void printHelpText({ options, [format], [pkgPath], [name], [version], [footerFn], [headerFn], [exampleFn]})`

Exactly the same as `formatHelpText` except it uses `console.log` to print the text for you. Returns nothing.

### `usageText = usage(options, [format])`

Generate just the usage string with a given `options` object.

#### Description layout and wrapping

Description layout controls where option descriptions start, and word wrapping breaks long descriptions into readable lines that fit a chosen output width.
Continuation lines align with the description column, keeping multiline explanations visually separate from option labels.
These settings affect only the option list, not headers, examples, or footers.

Pass `format` as the second argument to `usage()`, or as the `format` property of `formatHelpText()` and `printHelpText()`.
Omitting `format`, or passing `{}`, preserves the existing output without word wrapping.

| Setting | Default | Meaning |
| --- | --- | --- |
| `lineWidth` | Unset | Total line width including indentation; setting it enables word wrapping. |
| `descriptionColumn` | `27` | Zero-based column where descriptions and their continuation lines start. |

`descriptionColumn` must be a safe integer greater than the four-space label indentation.
`lineWidth`, when supplied, must be a safe integer greater than `descriptionColumn`.
Invalid dimensions throw a `RangeError`.
With formatting enabled, labels that reach the description column are placed on their own line.
Providing only `descriptionColumn` changes alignment without enabling word wrapping.

```js
const options = {
  watch: {
    type: 'boolean',
    short: 'w',
    help: 'Watch source files and rebuild the project whenever a file changes.'
  }
}
const format = { lineWidth: 60, descriptionColumn: 24 }

console.log(usage(options, format))
//     --watch, -w         Watch source files and rebuild the
//                        project whenever a file changes.

await printHelpText({ options, name: 'example', version: '1.0.0', format })
```

Explicit line breaks and blank lines are preserved, and nonempty continuation lines are aligned with the description column.
Word wrapping normalizes whitespace within each line and includes the displayed default-value suffix.
Words longer than the available width, including long URLs, are left intact and may exceed `lineWidth`; labels are not split either.
Widths use JavaScript string lengths, not terminal display-cell measurements.

### `headerText = header({ [pkgPath], [name], [headerFn], [exampleFn] })`

Generate the headerText only. Pass in either a `pkgPath` string path to the `package.json` of the bin you are printing for, or a `name`. The `headerFn` and `exampleFn` allow you to override the header text that is generated. Each function receilves an object with a `name` key.

### `footerText = footer({ [pkgPath], [name], [version], [footerFn] })`

Generate the footerText only. Pass in either a `pkgPath` string path to the `package.json` of the bin you are printing for, or a `name` and/or `version`. The `footerFn` lets you override the footer text template and receives an object with a `name` and `version` key.

## License

MIT

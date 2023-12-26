# argsclopts
[![latest version](https://img.shields.io/npm/v/argsclopts.svg)](https://www.npmjs.com/package/argsclopts)
[![Actions Status](https://github.com/bcomnes/argsclopts/workflows/tests/badge.svg)](https://github.com/bcomnes/argsclopts/actions)
[![Coverage Status](https://coveralls.io/repos/github/bcomnes/argsclopts/badge.svg?branch=master)](https://coveralls.io/github/bcomnes/argsclopts?branch=master)
[![downloads](https://img.shields.io/npm/dm/argsclopts.svg)](https://npmtrends.com/argsclopts)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![Socket Badge](https://socket.dev/api/badge/npm/package/argsclopts)](https://socket.dev/npm/package/argsclopts)

[cliclopts](https://github.com/finnp/cliclopts) but for [Node.js parseArgs](https://nodejs.org/api/util.html#utilparseargsconfig). A library that formats standard usage strings using the `node:util` `parseArgs` `options` object shape with an additional `help` field added to it.

```
npm install argsclopts
```

## Usage

``` js
import { formatHelpText, printHelpText } from 'argsclopts'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

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

    --foo, -f             A foo flag thats a boolean
    --bar                 A bar flag thats a string

argsclopts (v1.0.0)

 */

const args = ['-f', '--bar', 'b']
const { values } = parseArgs({ args, options })
// { foo: true, bar: 'b' }
```

## License

MIT

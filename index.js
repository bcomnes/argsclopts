import { readFile } from 'node:fs/promises'

/**
 * @typedef {import('node:util').ParseArgsConfig} ParseArgsConfig
 * @typedef {Exclude<ParseArgsConfig['options'], undefined>} ParseArgsOptionsConfig
 * @typedef {ParseArgsOptionsConfig[string]} ParseArgsOptionConfig
 *
 * @typedef {Object} ArgscloptsOptions
 * @property {string} [help] - At least one argument with a help string is required.
 * @property {string} [helpLabel] - Override the help label
 * Extends ParseArgsOptionConfig with additional properties 'help' and 'helpLabel'.
 *
 * // Define an extended version of ParseArgsOptionsConfig
 * @typedef {Record<string, ArgscloptsOptions & ParseArgsOptionConfig>} ArgscloptsParseArgsOptionsConfig
 */

/**
 * @typedef {Object} UsageFormatOptions
 * @property {number | undefined} [lineWidth] - Total line width, including indentation. Omit to disable word wrapping.
 * @property {number | undefined} [descriptionColumn] - Zero-based description column. Defaults to 27.
 */

const width = 23
const indent = '    '

/**
 * @param {ArgscloptsParseArgsOptionsConfig} options - Options matching the config.options shape in util.parseArgs
 * @param {UsageFormatOptions} [format] - Optional description layout and wrapping settings.
 * @returns {string} The formatted option list.
 */
export function usage (options, format = {}) {
  const descriptionColumn = format.descriptionColumn ?? indent.length + width
  if (!Number.isSafeInteger(descriptionColumn) || descriptionColumn <= indent.length) {
    throw new RangeError('descriptionColumn must be an integer greater than the label indentation (4)')
  }
  if (format.lineWidth !== undefined &&
    (!Number.isSafeInteger(format.lineWidth) || format.lineWidth <= descriptionColumn)) {
    throw new RangeError('lineWidth must be an integer greater than descriptionColumn')
  }
  const customLayout = format.lineWidth !== undefined || format.descriptionColumn !== undefined
  let output = ''

  Object.entries(options)
    .forEach(([name, opt]) => {
      output += indent

      let helpLabel = opt.helpLabel

      if (!helpLabel) {
        helpLabel = '--' + name
        if (opt.short) helpLabel += ', -' + opt.short
      }

      output += helpLabel

      let offset = 0
      if (indent.length + helpLabel.length >= descriptionColumn) {
        output += '\n' + indent
      } else {
        offset = helpLabel.length
      }

      output += ' '.repeat(descriptionColumn - indent.length - offset)
      let description = String(opt.help)
      if (opt.default) {
        description += ' (default: ' + JSON.stringify(opt.default) + ')'
      }
      output += customLayout
        ? formatDescription(description, format.lineWidth === undefined ? undefined : format.lineWidth - descriptionColumn, descriptionColumn)
        : description
      output += '\n'
    })

  return output
}

/**
 * Preserve explicit line breaks while wrapping words and aligning continuation lines.
 * Words longer than the available width are left intact.
 *
 * @param {string} description - The complete description, including any default value.
 * @param {number | undefined} availableWidth - Available description width, or undefined to disable wrapping.
 * @param {number} column - Description indentation for continuation lines.
 * @returns {string} The formatted description.
 */
function formatDescription (description, availableWidth, column) {
  const lines = description.split(/\r?\n/u).flatMap(line => {
    if (availableWidth === undefined) return [line]
    const wrapped = []
    let current = ''
    for (const word of line.match(/\S+/gu) ?? []) {
      if (current && current.length + 1 + word.length > availableWidth) {
        wrapped.push(current)
        current = word
      } else {
        current += `${current ? ' ' : ''}${word}`
      }
    }
    wrapped.push(current)
    return wrapped
  })
  return lines.map((line, index) => index > 0 && line ? ' '.repeat(column) + line : line).join('\n')
}

/**
 * Read a package.json at a path
 * @param  {string} pkgPath The path to the package json file
 * @return {Promise<{
 *         name: string
 *         version: string
 * }>}         The package.json contents parsed into an object
 */
export async function readPkg (pkgPath) {
  return JSON.parse(await readFile(pkgPath, 'utf8'))
}

/**
 * A function used for formatting with given inputs
 *
 * @callback FormatterFunction
 * @param {Object} arg - The argument object for the header function.
 * @param {string} [arg.name] - The name of the package or command line
 * @param {string} [arg.version] - The version of the package
 * @returns {string} The result string from the header function.
 */

/**
 * Generates a header string based on the provided parameters.
 *
 * @param {Object} params - The parameters object.
 * @param {string | undefined} [params.pkgPath] - The path to the package file. Used to determine the package name if 'name' is not provided.
 * @param {string | undefined} [params.name] - The name to be used in the header. If not provided, it's extracted from the package file at 'pkgPath'.
 * @param {FormatterFunction | undefined} [params.headerFn] - A function that returns the usage string.
 * @param {FormatterFunction | undefined} [params.exampleFn] - A function that returns an example string.
 * @returns {Promise<string>} - A promise that resolves to the constructed header string.
 * @throws {Error} If a name cannot be determined.
 *
 * @example
 * header({ pkgPath: './package.json', name: 'myApp' })
 *   .then(console.log); // Logs the header string for 'myApp'.
 */
export async function header ({
  pkgPath,
  name,
  headerFn = ({ name }) => `Usage: ${name} [options]\n`,
  exampleFn = ({ name }) => indent + `Example: ${name}\n`
}) {
  let pkg
  if (!name && pkgPath) {
    pkg = await readPkg(pkgPath)
  }

  const pkgName = name ?? pkg?.name

  if (!pkgName) throw new Error('A name cannot be determined')

  const header = [headerFn({ name: pkgName }), exampleFn({ name: pkgName })].join('\n')

  return header
}

/**
 * Generates a footer string based on the provided parameters.
 *
 * @param {Object} params - The parameters object.
 * @param {string | undefined} [params.pkgPath] - The path to the package file. Used to determine the package name if 'name' is not provided.
 * @param {string | undefined} [params.name] - The name to be used in the header. If not provided, it's extracted from the package file at 'pkgPath'.
 * @param {string | undefined} [params.version] - The version to be used in the footer. If not provided, it's extracted from the package file at 'pkgPath'.
 * @param {FormatterFunction | undefined} [params.footerFn] - A function that returns the footer string.
 * @returns {Promise<string>} - A promise that resolves to the constructed footer string.
 * @throws {Error} If a name cannot be determined.
 *
 *
 */
export async function footer ({
  pkgPath,
  name,
  version,
  footerFn = ({ name, version }) => `${name} (v${version})`
}) {
  let pkg
  if ((!name || !version) && pkgPath) {
    pkg = await readPkg(pkgPath)
  }

  const pkgName = name ?? pkg?.name
  if (!pkgName) throw new Error('A name cannot be determined')

  const pkgVersion = version ?? pkg?.version
  if (!pkgVersion) throw new Error('A name cannot be determined')

  return footerFn({ name: pkgName, version: pkgVersion })
}

/**
 * Generate the full help text string
 *
 * @param {Object} params
 * @param {UsageFormatOptions | undefined} [params.format] - Option description layout and wrapping settings.
 * @param {ArgscloptsParseArgsOptionsConfig} params.options - Options matching the config.options shape in util.parseArgs
 * @param {string} [params.pkgPath] - The path to a package.json.
 * @param {string} [params.name] - The bin name
 * @param {string} [params.version] - The bin version
 * @param {FormatterFunction} [params.headerFn] - A function that returns the usage string.
 * @param {FormatterFunction} [params.exampleFn] - A function that returns an example string.
 * @param {FormatterFunction} [params.footerFn] - A function that returns the footer string.
 * @returns {Promise<string>} - A promise that resolves to the constructed footer string.
 * @throws {Error} If a name cannot be determined.
 *
 *
 */
export async function formatHelpText ({
  options,
  format,
  pkgPath,
  name,
  version,
  footerFn,
  headerFn,
  exampleFn
}) {
  const helpText = [
    await header({ pkgPath, name, headerFn, exampleFn }),
    usage(options, format),
    await footer({ pkgPath, name, version, footerFn })
  ]

  return helpText.join('\n')
}

/**
 * Generate and print the full help text string
 *
 * @param {Object} params
 * @param {UsageFormatOptions | undefined} [params.format] - Option description layout and wrapping settings.
 * @param {ArgscloptsParseArgsOptionsConfig} params.options - Options matching the config.options shape in util.parseArgs
 * @param {string} [params.pkgPath] - The path to a package.json.
 * @param {string} [params.name] - The bin name
 * @param {string} [params.version] - The bin version
 * @param {FormatterFunction} [params.headerFn] - A function that returns the usage string.
 * @param {FormatterFunction} [params.exampleFn] - A function that returns an example string.
 * @param {FormatterFunction} [params.footerFn] - A function that returns the footer string.
 * @throws {Error} If a name cannot be determined.
 *
 *
 */
export async function printHelpText ({
  options,
  format,
  pkgPath,
  name,
  version,
  footerFn,
  headerFn,
  exampleFn
}) {
  const helpText = [
    await header({ pkgPath, name, headerFn, exampleFn }),
    usage(options, format),
    await footer({ pkgPath, name, version, footerFn })
  ]

  console.log(helpText.join('\n'))
}

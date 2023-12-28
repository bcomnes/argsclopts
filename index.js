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

const width = 23
const indent = '    '

/**
 * @param {ArgscloptsParseArgsOptionsConfig} options - Options matching the config.options shape in util.parseArgs
 * @returns {string} - Description of what the return value represents
 */
export function usage (options) {
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
      if (helpLabel.length > width) {
        output += '\n' + indent
      } else {
        offset = helpLabel.length
      }

      output += Array(width - offset).join(' ')
      output += opt.help
      if (opt.default) {
        output += ' (default: ' + JSON.stringify(opt.default) + ')'
      }
      output += '\n'
    })

  return output
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
 * @param {string} [params.pkgPath] - The path to the package file. Used to determine the package name if 'name' is not provided.
 * @param {string} [params.name] - The name to be used in the header. If not provided, it's extracted from the package file at 'pkgPath'.
 * @param {FormatterFunction} [params.headerFn] - A function that returns the usage string.
 * @param {FormatterFunction} [params.exampleFn] - A function that returns an example string.
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
 * @param {string} [params.pkgPath] - The path to the package file. Used to determine the package name if 'name' is not provided.
 * @param {string} [params.name] - The name to be used in the header. If not provided, it's extracted from the package file at 'pkgPath'.
 * @param {string} [params.version] - The version to be used in the footer. If not provided, it's extracted from the package file at 'pkgPath'.
 * @param {FormatterFunction} [params.footerFn] - A function that returns the footer string.
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
  pkgPath,
  name,
  version,
  footerFn,
  headerFn,
  exampleFn
}) {
  const helpText = [
    await header({ pkgPath, name, headerFn, exampleFn }),
    usage(options),
    await footer({ pkgPath, name, version, footerFn })
  ]

  return helpText.join('\n')
}

/**
 * Generate and print the full help text string
 *
 * @param {Object} params
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
  pkgPath,
  name,
  version,
  footerFn,
  headerFn,
  exampleFn
}) {
  const helpText = [
    await header({ pkgPath, name, headerFn, exampleFn }),
    usage(options),
    await footer({ pkgPath, name, version, footerFn })
  ]

  console.log(helpText.join('\n'))
}

import { spawn } from 'child_process'

// Default server arguments
const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 5000
const DEFAULT_MAX_RETRIES = 3

// Strings that Lektor outputs when certain things happen
const LEKTOR_OUTPUT_SERVER_RUNNING = '* Running on http://'
const LEKTOR_OUTPUT_PORT_IN_USE = 'OSError: [Errno 98] Address already in use'

class LektorServerProcess {
  constructor ({ workDir, host, port, outputPath, noPrune, verbose, maxRetries }) {
    this.workDir = workDir
    this.host = host || DEFAULT_HOST
    this.port = port || DEFAULT_PORT
    this.outputPath = outputPath
    this.noPrune = Boolean(noPrune)
    this.verbose = Boolean(verbose)
    this.maxRetries = maxRetries !== undefined ? maxRetries : DEFAULT_MAX_RETRIES;

    this.process = null
    this._retries = 0
  }

  _getArgs () {
    const args = [
      'server',
      '--host', this.host,
      '--port', this.port,
    ];
    if (this.outputPath) args.push(...['--output-path', this.outputPath])
    if (this.noPrune) args.push('--no-prune')
    if (this.verbose) args.push('--verbose')
    return args
  }

  _getOptions () {
    const options = {
      windowsHide: true
    }
    if (this.workDir) options.cwd = this.workDir
    return options
  }

  start () {
    return new Promise((resolve, reject) => {
      this.process = spawn(
        'lektor',
        this._getArgs(),
        this._getOptions()
      )
      this.process.on('exit', reject)
      this.process.stderr.on('data', data => {
        let output = String(data)
        if (output.includes(LEKTOR_OUTPUT_SERVER_RUNNING)) {
          resolve()
        }
        else if (output.includes(LEKTOR_OUTPUT_PORT_IN_USE)) {
          // TODO: Retry on different port
        }
      })
    })
  }
}

export default class Lektor {
  constructor (sourceDirectory, buildDirectory) {
    this.sourceDirectory = sourceDirectory
    this.buildDirectory = buildDirectory
  }

  server () {
  }
}

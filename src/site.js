import axios from 'axios'
import { Client, enterPassiveModeIPv4 } from 'basic-ftp'
import path from 'path'
import { remote } from 'electron'

export default class Site {
  constructor ({ id, domain, config }) {
    let host = domain
    try {
      host = new URL(domain).hostname
    } catch (err) {
      host = domain
    }

    this.id = id
    this.domain = host
    this.config = config
  }

  loadRemoteConfig () {
    return new Promise((resolve, reject) => {
      return axios({
        method: 'get',
        // TODO: Parse domain
        url: `http://${this.domain}/manage.json`
      }).then(response => {
        // TODO: Validate configuration
        this.config = response.data
        resolve()
      }).catch(_ => {
        reject(new Error('This site is not configured for Lektor Manager.'))
      })
    })
  }

  testConnection ({ username, password }) {
    return new Promise((resolve, reject) => {
      this._getFTPClient(username, password).then(client => {
        client.close()
        resolve()
      }).catch(reject)
    })
  }

  async validate ({ username, password }) {
    return this.loadRemoteConfig().then(() => {
      return this.testConnection({ username, password })
    })
  }

  async _getFTPClient (username, password) {
    const client = new Client(10000)
    console.log(enterPassiveModeIPv4)
    // client.prepareTransfer = enterPassiveModeIPv4
    try {
      await client.access({
        host: this.domain,
        user: username,
        password: password
      })
      console.log(await client.features())
    } catch (err) {
      console.error(err)
    }
    client.trackProgress(info => {
      console.log(info)
    })
    return client
  }

  async downloadFiles ({ username, password }) {
    const client = await this._getFTPClient(username, password)
    client.ftp.verbose = true
    await client.downloadToDir(this.getLocalSourceDir(), this.getRemoteSourceDir())
    // await client.downloadToDir(this.getLocalTargetDir(), this.getRemoteTargetDir())
    client.close()
  }

  async uploadFiles ({ username, password }) {
    const client = await this._getFTPClient(username, password)
    await client.uploadFromDir(this.getLocalSourceDir(), this.getRemoteSourceDir())
    await client.uploadFromDir(this.getLocalTargetDir(), this.getRemoteTargetDir())
    client.close()
  }

  getLocalDir () {
    // TODO: Maybe move this outside of this class.
    return path.join(
      remote.getGlobal('app').getPath('userData'),
      'sites',
      this.domain
    )
  }

  getLocalSourceDir () {
    return path.join(this.getLocalDir(), 'source')
  }

  getLocalTargetDir () {
    return path.join(this.getLocalDir(), 'target')
  }

  getRemoteSourceDir () {
    return path.join('/', this.config.project.source)
  }

  getRemoteTargetDir () {
    return path.join('/', this.config.project.target)
  }

  getHost () {
    if (this.config.connection.host !== undefined) {
      return this.config.connection.host
    }
    return this.domain
  }
}

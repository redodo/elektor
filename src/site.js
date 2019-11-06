import axios from 'axios'
import path from 'path'
import { remote } from 'electron'
import FTPWrapper from '@/ftp-wrapper'

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

  async testConnection ({ username, password }) {
    const client = this._getFTPClient(username, password)
    await client.connect()
    // TODO: Keep connection alive, the next step is usually syncing a remote
    //       directory with a local directory.
    // client.disconnect()
  }

  async validate ({ username, password }) {
    await this.loadRemoteConfig()
    await this.testConnection({ username, password })
  }

  _getFTPClient (username, password) {
    if (this.client === undefined) {
      this.client = new FTPWrapper({
        host: this.domain,
        user: username,
        password: password
      })
    }
    return this.client
  }

  async downloadFiles ({ username, password }) {
    const client = this._getFTPClient(username, password)
    await client.downloadDir(this.getLocalSourceDir(), this.getRemoteSourceDir())
    await client.downloadDir(this.getLocalTargetDir(), this.getRemoteTargetDir())
    client.disconnect()
  }

  async uploadFiles ({ username, password }) {
    const client = this._getFTPClient(username, password)
    await client.uploadDir(this.getLocalSourceDir(), this.getRemoteSourceDir())
    await client.uploadDir(this.getLocalTargetDir(), this.getRemoteTargetDir())
    client.disconnect()
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
    return this.config.project.source
  }

  getRemoteTargetDir () {
    return this.config.project.target
  }

  getHost () {
    if (this.config.connection.host !== undefined) {
      return this.config.connection.host
    }
    return this.domain
  }
}

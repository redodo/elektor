import axios from 'axios'
import FTP from 'ftps'
import path from 'path'
import { remote } from 'electron'

export default class Site {
  constructor ({ id, domain, config }) {
    this.id = id
    this.domain = domain
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
        reject(new Error('This site is not configured for Lektor Manage.'))
      })
    })
  }

  testConnection ({ username, password }) {
    return new Promise((resolve, reject) => {
      const connection = this._getConnection(username, password)
      connection.ls().exec((_, response) => {
        if (response.error === null) resolve()
        else reject(new Error('Username or password is incorrect.'))
      })
    })
  }

  async validate ({ username, password }) {
    return this.loadRemoteConfig().then(() => {
      return this.testConnection({ username, password })
    })
  }

  _getConnection (username, password) {
    return new FTP({
      host: this.getHost(),
      username: username,
      password: password
    })
  }

  downloadFiles ({ username, password }) {
    return new Promise((resolve, reject) => {
      // TODO: keep current connection saved
      const connection = this._getConnection(username, password)
      connection.mirror({
        upload: false,
        remoteDir: this.getRemoteSourceDir(),
        localDir: this.getLocalSourceDir(),
        options: '-n'
      }).mirror({
        upload: false,
        remoteDir: this.getRemoteTargetDir(),
        localDir: this.getLocalTargetDir(),
        options: '-n'
      }).exec((_, response) => {
        if (response.error === null) resolve()
        else reject(new Error(response.error))
      })
    })
  }

  uploadFiles ({ username, password }) {
    return new Promise((resolve, reject) => {
      // TODO: keep current connection saved
      const connection = this._getConnection(username, password)
      connection.mirror({
        upload: true,
        localDir: this.getLocalSourceDir(),
        remoteDir: this.getRemoteSourceDir(),
        options: '-n'
      }).mirror({
        upload: true,
        localDir: this.getLocalTargetDir(),
        remoteDir: this.getRemoteTargetDir(),
        options: '-n'
      }).exec((_, response) => {
        console.log(response)
        if (response.error === null) resolve()
        else reject(new Error(response.error))
      })
    })
  }

  getLocalDir () {
    // TODO: Maybe move this outside of this class.
    return path.join(
      remote.getGlobal('app').getPath('userData'),
      'sites',
      this.getHost()
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

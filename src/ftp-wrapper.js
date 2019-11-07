import fs from 'fs'
import path from 'path'
import Client from 'ftp'

export default class FTPWrapper {
  constructor (config) {
    this.config = config
    this.client = new Client()
    this.connected = false
    this._supportsMTDM = undefined
  }

  connect () {
    return new Promise((resolve, reject) => {
      this.client.on('ready', () => {
        this.connected = true
        resolve()
      })
      this.client.on('error', reject)
      this.client.on('close', () => { this.connected = false })
      this.client.on('end', () => { this.connected = false })
      this.client.connect(this.config)
    })
  }

  async requireConnection () {
    if (!this.connected) {
      console.log('Reconnecting...')
      await this.connect()
    }
  }

  disconnect () {
    this.client.end()
    this.connected = false
  }

  list (remotePath = '.') {
    return new Promise(async (resolve, reject) => {
      await this.requireConnection()
      this.client.list(remotePath, (err, list) => {
        if (err) reject(err)
        else resolve(list)
      })
    })
  }

  pwd () {
    return new Promise(async (resolve, reject) => {
      await this.requireConnection()
      this.client.pwd((err, currentDir) => {
        if (err) reject(err)
        else resolve(currentDir)
      })
    })
  }

  cwd (remotePath) {
    return new Promise(async (resolve, reject) => {
      await this.requireConnection()
      this.client.cwd(remotePath, (err, currentDir) => {
        if (err) reject(err)
        resolve(currentDir)
      })
    })
  }

  cdup () {
    return new Promise(async (resolve, reject) => {
      await this.requireConnection()
      this.client.cdup(err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  get (remotePath) {
    return new Promise(async (resolve, reject) => {
      await this.requireConnection()
      this.client.get(remotePath, (err, stream) => {
        if (err) reject(err)
        else resolve(stream)
      })
    })
  }

  mkdir (remotePath, recursive = true) {
    return new Promise(async (resolve, reject) => {
      await this.requireConnection()
      this.client.mkdir(remotePath, recursive, err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  lastMod (remotePath) {
    return new Promise(async (resolve, reject) => {
      await this.requireConnection()
      this.client.lastMod(remotePath, (err, date) => {
        if (err) reject(err)
        else resolve(date)
      })
    })
  }

  async tryGetLastMod (remotePath) {
    if (this._supportsMTDM !== false) {
      try {
        let date = await this.lastMod(remotePath)
        this._supportsMTDM = true
        return date
      } catch (err) {
        // TODO: Catch only MTDM-not-supported errors
        //
        // This version will not execute subsequent MTDM requests if the first
        // request fails, even if MTDM is supported by the server.
        if (this._supportsMTDM === undefined) this._supportsMTDM = false
      }
    }
    return null
  }

  downloadFile (localPath, remotePath) {
    return new Promise(async (resolve, reject) => {
      await this.requireConnection()
      let remoteLastMod = await this.tryGetLastMod(remotePath)
      this.get(remotePath).then(stream => {
        stream.once('close', () => {
          if (remoteLastMod) fs.utimesSync(localPath, remoteLastMod, remoteLastMod)
          resolve()
        })
        stream.pipe(fs.createWriteStream(localPath))
      }).catch(reject)
    })
  }

  async downloadDir (localDir, remoteDir, onlyNewer = true) {
    await this.requireConnection()
    let initialDir = await this.pwd()
    await this.cwd(remoteDir)
    await this._downloadListTo(localDir, onlyNewer)
    await this.cwd(initialDir)
  }

  async _downloadListTo (localDir, onlyNewer) {
    await this.requireConnection()
    // Make sure the local directory exists
    fs.mkdirSync(localDir, { recursive: true })
    for (let item of await this.list()) {
      let localPath = path.join(localDir, item.name)
      if (item.type === 'd') {
        // Enter the directory
        await this.cwd(item.name)
        await this._downloadListTo(localPath, onlyNewer)
        await this.cdup()
      } else {
        if (onlyNewer) {
          // Check if the remote file has been modified after the local modification date.
          try {
            let stats = fs.statSync(localPath)
            if (stats.mtimeMs >= Date.parse(item.date)) {
              // File can be skipped
              continue
            }
          } catch (err) {
            // File does not exist
            // TODO: Catch only EONENT errors
          }
        }
        // Download file
        console.log(`Downloading ${localPath}`)
        await this.downloadFile(localPath, item.name)
      }
    }
  }

  uploadFile (localPath, remotePath) {
    return new Promise(async (resolve, reject) => {
      await this.requireConnection()
      this.client.put(localPath, remotePath, err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async uploadDir (localDir, remoteDir, onlyNewer = true) {
    await this.requireConnection()
    let initialDir = await this.pwd()
    await this.mkdir(remoteDir, true)
    await this.cwd(remoteDir)
    await this._uploadDirFrom(localDir, onlyNewer)
    await this.cwd(initialDir)
  }

  async _uploadDirFrom (localDir, onlyNewer) {
    await this.requireConnection()
    // Make sure the remote directory exists
    for (let item of fs.readdirSync(localDir, { withFileTypes: true })) {
      let localPath = path.join(localDir, item.name)
      if (item.isDirectory()) {
        // Create the directory remotely if it doesn't exist
        await this.mkdir(item.name)
        // Enter the directory
        await this.cwd(item.name)
        await this._uploadDirFrom(localPath, onlyNewer)
        await this.cdup()
      } else if (item.isFile()) {
        if (onlyNewer) {
          try {
            let remoteDate = await this.tryGetLastMod(item.name)
            let localDate = fs.statSync(localPath).mtime
            if (remoteDate >= localDate) {
              // File can be skipped
              continue
            }
            console.log('remot', remoteDate)
            console.log('local', localDate)
          } catch (err) {
            console.log(err)
            // File does not exist
            // TODO: Catch only EONENT errors
          }
        }
        // Upload the file
        console.log(`Uploading ${localPath}`)
        await this.uploadFile(localPath, item.name)
      }
    }
  }
}

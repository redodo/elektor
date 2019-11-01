import { remote } from 'electron'
import path from 'path'
import FTP from 'ftps'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    sites: [],
    config: {
      path: remote.getGlobal('app').getPath('userData')
    }
  },
  mutations: {
    addSite (state, site) {
      state.sites.push(site)
    }
  },
  actions: {
    addSite ({ commit, state, dispatch }, { host, username, password }) {
      return new Promise((resolve, reject) => {
        let connection = new FTP({ host, username, password })
        let site = {
          host,
          username,
          password,
          progress: 0,
          localPath: path.join(state.config.path, 'sites', host)
        }
        connection.ls().exec((_, response) => {
          if (response.error === null) {
            commit('addSite', site)
            resolve(response, site)
            dispatch('downloadSite', site)
          } else {
            reject(response, site)
          }
        })
      })
    },
    downloadSite ({ dispatch }, site) {
      return dispatch('_syncSite', { site, upload: false })
    },
    uploadSite ({ dispatch }, site) {
      return dispatch('_syncSite', { site, upload: true })
    },
    _syncSite ({ state }, { site, upload = false }) {
      site.progress = 0
      return new Promise((resolve, reject) => {
        let connection = new FTP({
          host: site.host,
          username: site.username,
          password: site.password
        })
        connection.mirror({
          localDir: site.localPath,
          parallel: true,
          options: '-n', // Sync only newer files
          upload: upload
        }).exec((_, response) => {
          if (response.error === null) {
            site.progress = 1
            resolve(response, site)
          } else {
            reject(response, site)
          }
        })
      })
    }
  },
  modules: {
  }
})

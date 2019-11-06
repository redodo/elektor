import Vue from 'vue'
import Vuex from 'vuex'
import Site from '@/site'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    sites: [],
    credentials: {}
  },
  getters: {
    getSite: (state) => (id) => state.sites.find(site => site.id === id),
    getCredentials: (state) => (id) => state.credentials[id],
    siteCount: (state) => state.sites.length
  },
  mutations: {
    addSite (state, site) {
      state.sites.push(site)
    },
    setCredentials (state, { id, username, password }) {
      state.credentials[id] = { username, password }
    }
  },
  actions: {
    addSite ({ commit, state }, { domain, username, password }) {
      return new Promise((resolve, reject) => {
        const site = new Site({ domain })
        console.log('validating...')
        return site.validate({ username, password }).then(() => {
          console.log('validation passed')
          site.id = state.sites.length + 1
          commit('addSite', site)
          commit('setCredentials', { id: site.id, username, password })
          resolve(site)
        }).catch(reject)
      })
    }
  }
})

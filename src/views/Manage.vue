<template>
  <div v-if="site" class="h-full flex flex-col">
    <div class="toolbar px-1 flex-grow-0 flex-shrink-0 border-b bg-gray-200 border-gray-400 flex flex-row">

      <StandardButton class="url-bar__back px-4 my-1" @click.native="goBack">◀</StandardButton>
      <StandardButton class="url-bar__forward px-4 my-1" @click.native="goForward">▶</StandardButton>

      <URLBar
        :domain="site.domain"
        :path.sync="inputPath"
        @submit="goToPath(inputPath)"
        @reset="resetInputPath"
        class="flex-grow-1 m-1 w-full"
      />

      <StandardButton class="px-4 my-1" @click.native="uploadFiles">Upload files</StandardButton>
    </div>
    <iframe ref="iframe" class="user-select-auto border-0 w-full h-full flex-grow-1" :src="currentURL"></iframe>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { spawn } from 'child_process'
import { shell } from 'electron'
// import SiteSwitcher from '@/components/SiteSwitcher.vue'
import StandardButton from '@/components/StandardButton.vue'
import URLBar from '@/components/URLBar.vue'

export default {
  name: 'Manage',
  data () {
    return {
      isServerUp: false,
      isSyncing: false,
      process: null,
      output: '',
      error: '',

      // TODO: Grab the host and port from the Lektor output
      rootURL: 'http://localhost:5000/',
      currentURL: '',
      inputPath: '',

      switcherVisible: false,
      inputFocused: false,
      downloaded: false
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      let siteCount = vm.siteCount
      if (siteCount === 0) next({ name: 'add' })
    })
  },
  mounted () {
    if (!this.site) return

    // TODO: 'will-navigate' is not an iframe event, change this to something else
    this.$refs.iframe.addEventListener('will-navigate', event => {
      // Open external links outside Lektor Manager
      if (!event.url.startsWith(this.rootUrl)) {
        shell.openExternal(event.url)
        // Reset the URL
        // TODO: Find a way to keep the current URL without refreshing the page.
        this.$refs.iframe.src = this.$refs.iframe.src
      } else {
        // Update the url bar
        let url = new URL(event.url)
        this.currentUrl = url.pathname.slice(1)
        if (url.search) this.currentUrl += decodeURI(url.search)
        if (url.hash) this.currentUrl += url.hash
      }
    })

    this.$refs.iframe.addEventListener('load', event => {
      this.resetInputPath()
      // Update title
      document.title = this.$refs.iframe.contentWindow.document.title + ' - Lektor Manager'
    })

    this.initSite()
  },
  beforeDestroy () {
    this.stopServer()
  },
  watch: {
    isServerUp (value) {
      if (value) this.goToPath('/')
    },
    site () {
      this.switcherVisible = false
      this.currentUrl = ''
      this.initSite()
    }
  },
  computed: {
    ...mapGetters(['getSite', 'getCredentials', 'siteCount']),
    id () {
      return Number.parseInt(this.$route.params.id)
    },
    site () {
      return this.getSite(this.id)
    },
    credentials () {
      return this.getCredentials(this.id)
    }
  },
  methods: {
    goBack () {
      console.log(this.$refs.iframe.contentWindow)
      this.$refs.iframe.contentWindow.history.back()
    },
    goForward () {
      this.$refs.iframe.contentWindow.history.forward()
    },
    goToPath (path) {
      this.goToURL(this.rootURL + path)
    },
    goToURL (url) {
      this.currentURL = url
    },
    getPath () {
      let url = new URL(this.$refs.iframe.contentWindow.location.href)
      let path = url.pathname.slice(1)
      if (url.search) path += decodeURI(url.search)
      if (url.hash) path += url.hash
      return path
    },
    resetInputPath () {
      this.inputPath = this.getPath()
    },
    initSite () {
      if (!this.downloaded) this.downloadFiles(false).then(this.restartServer)
    },
    submitUrl (url) {
      this.openUrl(url)
      this.$refs.input.blur()
    },
    startServer () {
      return new Promise((resolve, reject) => {
        this.process = spawn(
          'lektor',
          ['server', '-O', this.site.getLocalTargetDir()],
          {
            cwd: this.site.getLocalSourceDir(),
            windowsHide: true
          }
        )
        this.process.on('exit', this.onServerStop)
        window.addEventListener('beforeunload', () => {
          this.stopServer()
        })
        this.process.stderr.on('data', data => {
          if (String(data).includes('* Running on http://')) {
            this.isServerUp = true
            resolve()
          }
        })
      })
    },
    stopServer () {
      return new Promise((resolve, reject) => {
        if (this.process) {
          this.process.on('close', resolve)
          this.process.kill('SIGINT')
        } else {
          resolve()
        }
      })
    },
    restartServer () {
      return this.stopServer().then(() => {
        this.startServer()
      })
    },
    onServerStop () {
      this.isServerUp = false
    },
    downloadFiles () {
      return new Promise((resolve, reject) => {
        this.isSyncing = true
        this.site.downloadFiles(this.credentials).then(() => {
          this.isSyncing = false
          this.downloaded = true
          resolve()
        }).catch(reject)
      })
    },
    uploadFiles () {
      return new Promise((resolve, reject) => {
        this.isSyncing = true
        this.site.uploadFiles(this.credentials).then(() => {
          this.isSyncing = false
          resolve()
        })
      })
    }
  },
  components: {
    // SiteSwitcher,
    StandardButton,
    URLBar
  }
}
</script>

<template>
  <div v-if="site" class="h-full flex flex-col">
    <div class="toolbar flex-grow-0 flex-shrink-0 border-b border-gray-400 flex flex-row">

      <form @submit.prevent="openUrl(currentUrl)" class="url-bar m-1 shadow bg-white pl-3 rounded border border-gray-400 flex flex-grow-1 w-full items-center" :class="{ 'url-bar--focused': inputFocused }">
        <div class="url-bar__progress rounded rounded-r-none" :style="{ width: progressWidth }" :class="[ progress >= 100 ? 'bg-white' : 'bg-green-200' ]"></div>
        <div class="url-bar__back h-full relative px-4 flex items-center border rounded" @click="goBack">◀</div>
        <div class="url-bar__forward h-full relative px-4 flex items-center border rounded" @click="goForward">▶</div>
        <span class="url-bar__status mr-1 py-1 flex-shrink-0 w-24 text-right relative" :class="{ 'text-green-700': this.status }">{{ this.status || 'Viewing' }}</span>
        <span class="url-bar__site relative flex-shrink-0 h-full flex items-center font-bold">
          <div class="url-bar__site-label flex items-center h-full" @click="switcherVisible = !switcherVisible">{{ site.domain }}</div>
          <div class="url-bar__site-switcher">
            <SiteSwitcher v-if="switcherVisible" :currentSite="this.site" />
          </div>
        </span>
        <span class="relative" :class="[ inputFocused ? 'text-black' : 'text-gray-700' ]">/</span>
        <input class="url-bar__input p-0 relative text-gray-700 border-0 shadow-none flex-grow-1 w-full h-full" v-model="currentUrl" @focus="inputFocused = true" @blur="inputFocused = false">
      </form>

      <div class="flex-grow-0 flex-shrink-0 flex flex-row">
        <button @click="uploadFiles">Upload files</button>
      </div>
    </div>
    <iframe ref="webview" class="user-select-auto border-0 w-full h-full flex-grow-1" :src="webviewUrl"></iframe>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { spawn } from 'child_process'
import { shell } from 'electron'
import SiteSwitcher from '@/components/SiteSwitcher.vue'

export default {
  name: 'Manage',
  data () {
    return {
      isServerUp: false,
      isSyncing: false,
      process: null,
      output: '',
      error: '',
      webviewUrl: 'about:blank',
      rootUrl: 'http://localhost:5000',
      currentUrl: '',
      switcherVisible: false,
      inputFocused: false,
      status: '',
      progress: 0,
      progressIntervalFn: null,
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
    if (this.site) {
      console.log(this.site)
      this.$refs.webview.addEventListener('dom-ready', event => {
        // Fix selection cursor visibility
        // Remove this once https://github.com/electron/electron/issues/14474 is fixed
        this.$refs.webview.blur()
        this.$refs.webview.focus()

        // Update document title
        document.title = this.$refs.webview.getTitle() + ' - Lektor Manager'
      })
      this.$refs.webview.addEventListener('will-navigate', event => {
        // Open external links outside Lektor Manager
        if (!event.url.startsWith(this.rootUrl)) {
          shell.openExternal(event.url)
          // Reset the URL
          // TODO: Find a way to keep the current URL without refreshing the page.
          this.$refs.webview.src = this.$refs.webview.src
        } else {
          // Update the url bar
          let url = new URL(event.url)
          this.currentUrl = url.pathname.slice(1)
          if (url.search) this.currentUrl += decodeURI(url.search)
          if (url.hash) this.currentUrl += url.hash
        }
      })

      this.$refs.webview.addEventListener('load', event => {
        // Update the url bar
        let url = new URL(this.$refs.webview.contentWindow.location.href)
        this.currentUrl = url.pathname.slice(1)
        if (url.search) this.currentUrl += decodeURI(url.search)
        if (url.hash) this.currentUrl += url.hash
        // Update title
        document.title = this.$refs.webview.contentWindow.document.title + ' - Lektor Manager'
      })

      this.initSite()
    }
  },
  beforeDestroy () {
    this.stopServer()
  },
  watch: {
    isServerUp (value) {
      if (value) this.openUrl('/')
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
    },
    progressWidth () {
      let width = Math.round(this.progress, 0.1)
      return `${width}%`
    }
  },
  methods: {
    goBack () {
      console.log(this.$refs.webview.contentWindow)
      this.$refs.webview.contentWindow.history.back()
    },
    goForward () {
      this.$refs.webview.contentWindow.history.forward()
    },
    initSite () {
      let serverFn = this.isServerUp ? this.restartServer : this.startServer
      if (!this.downloaded) {
        this.progress = 0
        this.increaseProgress(80)
        this.downloadFiles(false).then(() => {
          this.progress = 80
          this.increaseProgress(95)
          serverFn(false).then(() => {
            this.progress = 100
          })
        })
      } else {
        serverFn()
      }
    },
    openUrl (url) {
      this.$refs.webview.src = new URL('http://localhost:5000/' + url).toString()
    },
    startServer (withProgress = true) {
      return new Promise((resolve, reject) => {
        this.status = 'Starting'
        if (withProgress) {
          this.progress = 0
          this.increaseProgress(95)
        }
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
            this.status = ''
            if (withProgress) this.progress = 100
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
    restartServer (withProgress = true) {
      return this.stopServer().then(() => {
        this.startServer(withProgress)
      })
    },
    onServerStop () {
      this.isServerUp = false
    },
    increaseProgress (max = 100, step = 0.1, interval = 5) {
      if (this.progressIntervalFn !== null) clearInterval(this.progressIntervalFn)
      this.progressIntervalFn = setInterval(() => {
        this.progress += step
        if (this.progress >= max) clearInterval(this.progressIntervalFn)
      }, interval)
    },
    downloadFiles (withProgress = true) {
      return new Promise((resolve, reject) => {
        this.status = 'Downloading'
        this.isSyncing = true
        if (withProgress) {
          this.progress = 0
          this.increaseProgress(95)
        }
        this.site.downloadFiles(this.credentials).then(() => {
          this.isSyncing = false
          this.status = ''
          if (withProgress) this.progress = 100
          this.downloaded = true
          resolve()
        }).catch(reject)
      })
    },
    uploadFiles (withProgress = true) {
      return new Promise((resolve, reject) => {
        this.status = 'Uploading'
        this.isSyncing = true
        if (withProgress) {
          this.progress = 0
          this.increaseProgress(95)
        }
        this.site.uploadFiles(this.credentials).then(() => {
          this.isSyncing = false
          this.status = ''
          if (withProgress) this.progress = 100
          resolve()
        })
      })
    }
  },
  components: {
    SiteSwitcher
  }
}
</script>
<style lang="scss">
.toolbar {
  background: #eee;
}
.url-bar {
  position: relative;

  &--focused {
    border-color: #06c;
  }
  &__status {
    transition: color .1s;
  }
  &__progress {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    min-width: 0.5rem;
    transition: width 0.2s, background 0.2s;
  }
  &__input {
    outline: 0;
    background: transparent;
    &:focus {
      color: black;
    }
  }
  &__site {
    position: relative;

    &-label {
      cursor: pointer;
      &:hover {
        background: #eee;
      }
    }

    &-switcher {
      position: absolute;
      top: calc(100% - 0.25rem);
      left: -0.25rem;
      width: auto;
      min-width: calc(100% + 0.5rem);
    }
  }
}
</style>

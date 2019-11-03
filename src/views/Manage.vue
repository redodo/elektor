<template>
  <ViewContainer>
    <div v-if="site" class="flex flex-grow-0 flex-shrink-0">
      <div class="w-1/3">
        <div class="text-2xl font-bold">{{ site.domain }}</div>

        <p class="text-monospace">
          {{ this.site.getLocalSourceDir() }}<br>
          {{ this.site.getLocalTargetDir() }}
        </p>

        <div v-if="isSyncing" class="text-green-800 bg-green-200">Syncing files...</div>

        <div v-if="isServerUp" class="text-green-800 bg-green-200">Server up</div>
        <div v-else class="text-red-800 bg-red-200">Server down</div>

        <button v-if="!isServerUp" @click="startServer">Start server</button>
        <button v-if="isServerUp" @click="stopServer">Stop server</button>

        <button @click="downloadFiles">Download files</button>
        <button @click="uploadFiles">Upload files</button>
      </div>
      <div class="w-2/3 font-mono whitespace-pre-wrap">{{ this.output }}</div>
    </div>
    <webview ref="webview" class="user-select-auto border-0 w-full h-full flex-grow-1" :src="webviewUrl"></webview>
  </ViewContainer>
</template>

<script>
import { mapGetters } from 'vuex'
import { spawn } from 'child_process'

import ViewContainer from '@/components/ui/ViewContainer.vue'

export default {
  name: 'Manage',
  beforeRouteEnter (to, from, next) {
    next(vm => {
      let siteCount = vm.siteCount
      if (siteCount === 0) next({ name: 'add' })
    })
  },
  beforeDestroy () {
    this.stopServer()
    this.$refs.webview.removeEventListener('dom-ready')
  },
  mounted () {
    this.$refs.webview.addEventListener('dom-ready', event => {
      // Remove this once https://github.com/electron/electron/issues/14474 is fixed
      this.$refs.webview.blur()
      this.$refs.webview.focus()
    })
  },
  data () {
    return {
      isServerUp: false,
      isSyncing: false,
      process: null,
      output: '',
      error: '',
      webviewUrl: 'about:blank'
    }
  },
  watch: {
    isServerUp (value) {
      if (value) {
        this.webviewUrl = 'http://localhost:5000'
      }
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
    startServer () {
      this.process = spawn(
        'lektor',
        ['server', '-O', this.site.getLocalTargetDir()],
        {
          cwd: this.site.getLocalSourceDir(),
          windowsHide: true
        }
      )
      this.process.on('exit', this.onServerStop)
      // TODO: Figure out a better way to detect if the server is up when starting.
      setTimeout(() => { this.isServerUp = true }, 1000)
      window.addEventListener('beforeunload', () => {
        this.stopServer()
      })
    },
    stopServer () {
      if (this.process) this.process.kill('SIGINT')
    },
    onServerStop () {
      this.isServerUp = false
    },
    downloadFiles () {
      this.isSyncing = true
      this.site.downloadFiles(this.credentials).then(() => {
        this.isSyncing = false
      })
    },
    uploadFiles () {
      this.isSyncing = true
      this.site.uploadFiles(this.credentials).then(() => {
        this.isSyncing = false
      })
    }
  },
  components: {
    ViewContainer
  }
}
</script>

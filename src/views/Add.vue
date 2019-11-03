<template>
  <ViewContainer>
    <ViewContent>
      <form @submit.prevent="save" ref="form" class="flex flex-col h-full p-2 mx-auto max-w-xl">
        <h1 class="font-bold text-2xl mb-2 text-gray-600">Manage your Lektor site</h1>
        <label>
          Domain
          <input class="mb-2" type="text" placeholder="getlektor.com" v-model="domain" />
        </label>
        <label>
          Username
          <input class="mb-2" type="text" placeholder="admin" v-model="username" />
        </label>
        <label>
          Password
          <input class="mb-2" type="password" placeholder="••••••••••" v-model="password" />
        </label>
        <span v-if="error" class="py-1 px-2 border border-red-300 bg-red-200">{{ error }}</span>
      </form>
    </ViewContent>
    <ActionBar>
      <button class="px-4 py-2 float-right" @click="save">
        <template v-if="isConnecting">Connecting...</template>
        <template v-else>Next step</template>
      </button>
    </ActionBar>
  </ViewContainer>
</template>

<script>
import { mapActions } from 'vuex'
import ViewContainer from '@/components/ui/ViewContainer.vue'
import ViewContent from '@/components/ui/ViewContent.vue'
import ActionBar from '@/components/ui/ActionBar.vue'

export default {
  name: 'Add',
  data () {
    return {
      domain: '',
      username: '',
      password: '',
      error: null,
      isConnecting: false
    }
  },
  computed: {
    valid () {
      return this.domain !== ''
    }
  },
  methods: {
    ...mapActions(['addSite']),
    save () {
      this.error = null
      this.isConnecting = true
      this.addSite({
        domain: this.domain,
        username: this.username,
        password: this.password
      }).then(site => {
        this.$router.push({ name: 'manage', params: { id: site.id } })
        this.isConnecting = false
      }).catch(error => {
        this.error = error
        this.isConnecting = false
      })
    }
  },
  components: {
    ViewContainer,
    ViewContent,
    ActionBar
  }
}
</script>

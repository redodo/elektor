<template>
  <div class="site-add" :class="{ success: isConnectionSuccessful === true, failure: isConnectionSuccessful === false }">
    <form @submit.prevent="testConnection">
      <label>Host:</label>
      <input type="text" v-model="site.host" autofocus>
      <label>Username:</label>
      <input type="text" v-model="site.username">
      <label>Password:</label>
      <input type="password" v-model="site.password">
      <button :disabled="isConnecting">
        <template v-if="isConnecting">Connecting...</template>
        <template v-else>Add site</template>
      </button>
    </form>
    <router-link to="/" tag="button">Cancel</router-link>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'site-add',
  data () {
    return {
      site: {
        host: '',
        username: '',
        password: ''
      },
      isConnecting: false,
      isConnectionSuccessful: null
    }
  },
  methods: {
    ...mapActions(['addSite', 'increaseProgress']),
    testConnection () {
      this.isConnecting = true
      this.isConnectionSuccessful = null

      this.addSite({
        host: this.site.host,
        username: this.site.username,
        password: this.site.password
      }).then((response, site) => {
        this.isConnecting = false
        this.isConnectionSuccessful = true
        this.$router.push({ name: 'site-list' })
      }).catch((response, site) => {
        this.isConnecting = false
        this.isConnectionSuccessful = false
      })
    }
  }
}
</script>

<style lang="scss">
.success {
  background: green;
}
.failure {
  background: red;
}
</style>

<template>
  <div class="site-list">
    <SiteListItem v-for="site in sites" :key="site.host" :site=site />
    <router-link to="/add" tag="button">Add new site</router-link>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import SiteListItem from '@/components/SiteListItem.vue'

export default {
  name: 'site-list',
  computed: {
    ...mapState(['sites'])
  },
  components: {
    SiteListItem
  }
}
</script>

<template>
  <ViewContainer>
    <ViewContent>
      <SiteListItem v-for="site in sites" :key="site.host" :site=site />
    </ViewContent>
    <ActionBar>
      <router-link to="/add" tag="button">Add new site</router-link>
    </ActionBar>
  </ViewContainer>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import SiteListItem from '@/components/SiteListItem.vue'

import ViewContainer from '@/components/ui/ViewContainer.vue'
import ViewContent from '@/components/ui/ViewContent.vue'
import ActionBar from '@/components/ui/ActionBar.vue'

export default {
  name: 'site-list',
  beforeRouteEnter (to, from, next) {
    next(vm => {
      let siteCount = vm.siteCount
      if (siteCount === 0) {
        next('/add')
      } else if (siteCount === 1) {
        next('/site/1')
      }
    })
  },
  computed: {
    ...mapState(['sites']),
    ...mapGetters(['siteCount'])
  },
  components: {
    SiteListItem,
    ViewContainer,
    ViewContent,
    ActionBar
  }
}
</script>

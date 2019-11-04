<template>
  <div class="site-switcher flex flex-col rounded shadow border border-gray-400">
    <router-link
      v-for="site in selectableSites"
      :key="`site-switcher-item__${site.domain}`"
      :to="{ 'name': 'manage', 'params': { 'id': site.id } }"
      class="site-switcher__item border-b border-gray-200"
    >{{ site.domain }}</router-link>
    <router-link :to="{ 'name': 'add' }" class="site-switcher__item font-normal text-center text-sm">Add another site</router-link>
  </div>
</template>
<script>
import { mapState } from 'vuex'

export default {
  name: 'SiteSwitcher',
  props: {
    currentSite: Object
  },
  computed: {
    ...mapState(['sites']),
    selectableSites () {
      return this.sites.filter(site => site !== this.currentSite)
    }
  }
}
</script>
<style lang="scss">
.site-switcher {
  overflow: hidden;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.2);
  background: white;

  &__item {
    padding: 0.25rem;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      background: yellow;
    }
  }
}
</style>

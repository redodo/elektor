<template>
  <router-link tag="div" :to="`/site/${site.id}`" class="site">
    <div class="site__progress" :style="style" :class="{ 'site__progress--done': !isSyncing }"></div>
    <div class="site__label">
      <span class="flex-grow">{{ site.host }}</span>
      <button class="flex-shrink-0 upload-button" @click.stop="uploadSite(site)" :disabled="isSyncing">
        <i class="fas fa-arrow-up"></i>
      </button>
    </div>
  </router-link>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'SiteListItem',
  props: {
    site: Object
  },
  computed: {
    style () {
      let progress = Math.round(this.site.progress * 100)
      return {
        width: `${progress}%`
      }
    },
    isSyncing () {
      return this.site.progress < 1
    }
  },
  methods: {
    ...mapActions(['downloadSite', 'uploadSite'])
  }
}
</script>

<style lang="scss">
.site {
  padding: 1rem;
  margin-bottom: 0.25rem;
  font-family: Cousine, 'Courier New', Courier, monospace;
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background: rgba(white, 0.2);
  }
  &:active {
    box-shadow: 0 0 0 0.25rem orange;
  }

  &__progress {
    position: absolute;
    min-width: 0.25rem;
    z-index: 0;
    top: 0;
    left: 0;
    bottom: 0;
    background: lime;
    transition: width 0.2s, background 1s;

    &--done {
      background: transparent;
    }
  }

  &__label {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: baseline;
  }

  .upload-button {
    width: auto;
    margin: 0;
    padding: 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid rgba(black, 0.1);
    background: rgba(black, 0.1);
    color: white;
    cursor: pointer;

    &:hover {
      background: rgba(black, 0.2);
    }
    &:active {
      outline: 0;
      box-shadow: 0 0 0 2px orange;
    }
    &:disabled {
      background: transparent;
      box-shadow: 0 0 0 2px orange;
    }
  }
}
.flex-grow {
  flex: 1;
}
.flex-shrink-0 {
  flex-shrink: 0;
}
</style>

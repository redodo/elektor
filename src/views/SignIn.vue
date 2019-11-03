<template>
  <ViewContainer>
    <ViewContent>
      <form @submit.prevent="commit" class="flex flex-col h-full p-4 mx-auto justify-center max-w-xl">
        <h2 class="font-bold text-2xl px-8 mb-2">Sign into</h2>
        <h1 class="font-bold text-4xl px-8 mb-4">{{ site.domain }}</h1>
        <input class="mb-4 px-8 py-4 w-full mw-32 text-2xl" type="text" placeholder="Enter address" v-model="domain" />
        <button class="p-4 bg-gray-200 hover:bg-gray-400">Log in</button>
      </form>
    </ViewContent>
  </ViewContainer>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import ViewContainer from '@/components/ui/ViewContainer.vue'
import ViewContent from '@/components/ui/ViewContent.vue'

export default {
  name: 'SignIn',
  data () {
    return {
      domain: '',
      error: null
    }
  },
  computed: {
    site () {
      return this.getSiteById(Number.parseInt(this.$route.params.id))
    },
    valid () {
      return true
    },
    ...mapGetters(['getSiteById'])
  },
  methods: {
    ...mapActions(['addNewSite']),
    commit () {
      this.addNewSite(this.domain).then(site => {
        this.$router.push({ name: 'sign-in', params: { id: site.id } })
      }).catch(error => {
        this.error = error
      })
    }
  },
  components: {
    ViewContainer,
    ViewContent
  }
}
</script>

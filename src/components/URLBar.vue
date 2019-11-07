<template>
  <form
    class="urlbar flex items-center rounded  pl-3"
    :class="{ 'urlbar--focused': focused }"
    @submit.prevent="submit"
  >
    <div class="urlbar__status text-sm flex-shrink-0 mr-1">(local copy)</div>
    <div class="urlbar__domain flex-shrink-0">{{ domain }}</div>
    <div class="urlbar__path flex items-center">
      <span class="flex-shrink-0">/</span>
      <input
        ref="input"
        class="urlbar__input flex-grow-1 py-2"
        :value="path"
        @input="$emit('update:path', $event.target.value)"
        @focus="focused = true"
        @blur="focused = false"
        @keyup.esc="reset"
      >
    </div>
  </form>
</template>
<script>
export default {
  name: 'URLBar',
  props: {
    domain: String,
    path: String
  },
  data () {
    return {
      focused: false
    }
  },
  methods: {
    submit () {
      this.$emit('submit')
      this.$refs.input.blur()
    },
    reset () {
      this.$emit('reset')
      this.$refs.input.blur()
    }
  }
}
</script>
<style lang="scss">
@import '@/styles/colors.scss';

.urlbar {
  border: 2px solid $gray-400;
  background: white;

  &__status {
    color: $lektor-300;
  }
  &__domain {
    color: black;
    font-weight: bolder;
  }
  &__path {
    flex-grow: 1;
    color: $gray-600;
  }
  &__input {
    flex-grow: 1;
    outline: 0;
    background: transparent;
  }

  &--focused {
    border-color: $lektor-600;
  }
  &--focused &__path {
    color: black;
  }
}
</style>

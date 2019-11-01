<template>
  <div id="app" class="bg-red-400">
    <router-view/>
  </div>
</template>

<style lang="scss">
html, body {
  margin: 0;
  height: 100%;
  color: white;
  background: #333;
}

#app, input {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  padding: 0.25rem;
  user-select: none;
}

button, input, label {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 1rem;
}

button {
  padding: 1rem;
  font-size: 1rem;
}
input {
  padding: 0.5rem;
  font-size: 1rem;
  font-family: Cousine, 'Courier New', Courier, monospace;
}
label {
  font-weight: bolder;
  margin-bottom: 0.25rem;
}
.unused-stuff {
  width: 200px;
  height: 3000px;
  background: red;
}
</style>

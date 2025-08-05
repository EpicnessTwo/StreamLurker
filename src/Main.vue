<template>
  <Suspense>
    <component :is="componentToShow" />
  </Suspense>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Setup from './Setup.vue'
import App from './App.vue'
import { getConfig } from './composables/useConfig.js'

const componentToShow = ref(null)

onMounted(async () => {
  config = await getConfig('config')

  if (config) console.log(config)

  if (config && config.finished) {
    componentToShow.value = App
  } else {
    // For development, we can bypass setup if needed
    // Uncomment line below to skip setup for demo
    componentToShow.value = App
    // componentToShow.value = Setup
  }
})
</script>

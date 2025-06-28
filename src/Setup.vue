<template>
  <div class="background min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4 py-8">
    <div class="w-full max-w-3xl bg-slate-800/70 backdrop-blur-3xl backdrop-opacity-50 rounded-2xl px-8 py-16 shadow-xl">
      <h2 class="text-2xl font-semibold mb-6 text-center">StreamLurker Setup</h2>

      <ProgressBar :step="currentStep" :total="steps.length" class="mb-12" />

      <transition name="fade" mode="out-in">
        <component :is="steps[currentStep - 1].component"
                   :key="currentStep"
                   @next="nextStep"
                   @back="prevStep"
                   @finish="completeSetup"
                   v-model="formData" />
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import ProgressBar from './Components/ProgressBar.vue'
import StepAuth from './Components/Setup/StepAuth.vue'
import StepChannels from './Components/Setup/StepChannels.vue'
import StepSettings from './Components/Setup/StepSettings.vue'
import { getConfig, setConfig } from './composables/useConfig.js'

const currentStep = ref(1)

const formData = ref({
  finished: false,
  twitch_token: '',
  channels: [],
  settings: {
    autoOpen: false,
    notifications: false,
    predictive: false,
    startup: false
  }
})

// Load initial config if available
onMounted(async () => {
  const initialConfig = await getConfig('config')
  if (initialConfig) {
    formData.value.finished = initialConfig.finished || false
    formData.value.twitch_token = initialConfig.twitch_token || ''
    formData.value.channels = initialConfig.channels || []
    formData.value.settings = {
      autoOpen: initialConfig.settings?.autoOpen || false,
      notifications: initialConfig.settings?.notifications || false,
      predictive: initialConfig.settings?.predictive || false,
      startup: initialConfig.settings?.startup || false
    }
  } else {
    setConfig('config', formData.value)
  }
})

// Listen for changes to formData and push back to config
watch(formData, (newData) => {
  console.log('Form data changed:', newData)
  setConfig('config', newData)
}, { deep: true })

const steps = [
  { name: 'Authenticate', component: StepAuth },
  { name: 'Channels', component: StepChannels },
  { name: 'Settings', component: StepSettings }
]

function nextStep() {
  if (currentStep.value < steps.length) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

function completeSetup() {
  formData.value.finished = true
  setConfig('config', formData.value)

  // Reload the app or redirect to main view
  window.location.reload()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

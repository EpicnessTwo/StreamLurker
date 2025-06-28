<template>
  <div class="relative inline-block">
    <button @click="open = !open" class="px-3 py-2 bg-slate-700 rounded hover:bg-slate-600">
      Settings
    </button>

    <div
        v-if="open"
        class="fixed right-0 top-0 w-full h-full z-100 bg-slate-800/70 backdrop-blur-3xl backdrop-opacity-90 px-8 py-16"
    >
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-bold">App Settings</h2>
        <button @click="open = false" class="text-red-400 hover:text-red-200">✖</button>
      </div>

      <div class="space-y-4">
        <label v-for="(label, key) in settingLabels" :key="key" class="flex justify-between items-center bg-slate-700 px-4 py-2 rounded">
          <span>{{ label }}</span>
          <input type="checkbox" v-model="modelValue.settings[key]" class="form-checkbox h-5 w-5 text-blue-500" />
        </label>

        <button
            @click="save"
            class="w-full mt-2 bg-green-600 hover:bg-green-500 text-white py-1 rounded"
        >
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const open = ref(false)
const props = defineProps({
  modelValue: Object
})
const emit = defineEmits(["update:settings"])

const settingLabels = {
  autoOpen: 'Automatically open streams when they go live',
  notifications: 'Enable system notifications',
  predictive: 'Predictive Go Live [Alpha]',
  startup: 'Open StreamLurker at startup'
}
function save() {
  console.log('Saving settings:', props.modelValue.settings)
  emit('update:settings', props.modelValue.settings)
  open.value = false
}
</script>

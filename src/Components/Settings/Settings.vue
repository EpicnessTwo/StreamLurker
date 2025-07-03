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
      <div class="grid grid-cols-2 gap-2 mt-4">
        <button
            @click="openRepo"
            class="bg-blue-600 hover:bg-blue-500 text-white py-1 rounded"
        >
          Open Repo
        </button>

        <button
            @click="reportBug"
            class="bg-yellow-600 hover:bg-yellow-500 text-white py-1 rounded"
        >
          Report a Bug
        </button>

        <button
            @click="testNotification"
            class="bg-purple-600 hover:bg-purple-500 text-white py-1 rounded"
        >
          Test Notification
        </button>

        <button
            @click="resetSettings"
            class="bg-red-600 hover:bg-red-500 text-white py-1 rounded"
        >
          Reset All Settings
        </button>
      </div>
    </div>
    <div
        v-if="confirmReset"
        class="fixed inset-0 z-200 bg-black/70 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="bg-slate-800 p-6 rounded-xl w-[90%] max-w-sm shadow-lg space-y-4">
        <h3 class="text-lg font-bold text-red-400">Confirm Reset</h3>
        <p class="text-slate-300">Are you sure you want to reset all settings? This cannot be undone.</p>
        <p class="text-sm text-slate-400">This will reset the application back to default, removing all of your settings, channels, and authentication.</p>
        <div class="flex justify-end space-x-2">
          <button @click="confirmReset = false" class="px-4 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white">
            Cancel
          </button>
          <button @click="resetSettingsConfirmed" class="px-4 py-1 rounded bg-red-600 hover:bg-red-500 text-white">
            Yes, Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { autostart } from '../../composables/useAutostart'
import { openUrl } from "@tauri-apps/plugin-opener";
import { notify } from '../../composables/useNotification'
import { setConfig } from '../../composables/useConfig'

const open = ref(false)
const confirmReset = ref(false)
const props = defineProps({
  modelValue: Object
})
const emit = defineEmits(["update:settings"])

const settingLabels = {
  autoOpen: 'Automatically open streams when they go live',
  notifications: 'Enable system notifications',
  sounds: 'Enable notification sounds',
  predictive: 'Predictive Go Live (Requires notifications)',
  startup: 'Open StreamLurker at startup'
}

async function save() {
  console.log('Saving settings:', props.modelValue.settings)

  await autostart(props.modelValue.settings.startup)

  emit('update:settings', props.modelValue.settings)
  open.value = false
}

async function openRepo() {
  await openUrl('https://github.com/EpicnessTwo/StreamLurker')
}

async function reportBug() {
  await openUrl('https://github.com/EpicnessTwo/StreamLurker/issues')
}

async function testNotification() {
  await notify(
      'Test Notification',
      'This is a test notification!',
      null,
      props.modelValue.settings.sounds ? 'predict' : null
  )
}

async function resetSettings() {
  confirmReset.value = true
}

async function resetSettingsConfirmed() {
  setConfig('config', [])
  window.location.reload()
}
</script>

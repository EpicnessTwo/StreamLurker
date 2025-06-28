<template>
  <div class="relative inline-block">
    <button @click="open = !open" class="px-3 py-2 bg-slate-700 rounded hover:bg-slate-600">
      Settings
    </button>

    <div
        v-if="open"
        class="absolute right-0 mt-2 w-64 bg-slate-800 text-white rounded-lg shadow-lg p-4 z-10"
    >
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-bold">App Settings</h2>
        <button @click="open = false" class="text-red-400 hover:text-red-200">✖</button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block mb-1 text-sm text-gray-300">Update Interval (ms)</label>
          <input
              type="number"
              v-model="localSettings.refreshInterval"
              class="w-full bg-slate-700 text-white px-2 py-1 rounded"
          />
        </div>

        <div>
          <label class="block mb-1 text-sm text-gray-300">Twitch Token</label>
          <input
              type="text"
              v-model="localSettings.twitchToken"
              class="w-full bg-slate-700 text-white px-2 py-1 rounded"
          />
        </div>

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
const localSettings = ref({
  refreshInterval: 10000,
  twitchToken: ''
})

// Emit updated settings back to parent
const emit = defineEmits(['update:settings'])

function save() {
  emit('update:settings', localSettings.value)
  open.value = false
}
</script>

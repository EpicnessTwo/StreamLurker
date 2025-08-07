<template>
  <div
      class="fixed right-0 top-0 w-full h-full z-100 bg-slate-800/70 backdrop-blur-3xl backdrop-opacity-90 px-8 py-16"
  >
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-lg font-bold">{{ channelName }} - Channel Settings</h2>
      <button @click="$emit('close')" class="text-red-400 hover:text-red-200">✖</button>
    </div>

    <div class="space-y-6">
      <div class="bg-slate-700 p-4 rounded-lg">
        <h3 class="text-md font-semibold mb-4">Notification Sounds</h3>
        <div class="space-y-4">
          <!-- Live Sound -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">Live Notification Sound</label>
            <div class="flex gap-2">
              <input
                  v-model="sounds.live"
                  type="text"
                  placeholder="Select a sound file..."
                  class="flex-1 px-3 py-2 bg-slate-600 rounded text-white placeholder-gray-400"
                  readonly
              />
              <button
                  @click="selectSoundFile('live')"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
              >
                Browse
              </button>
              <button
                  @click="previewSound('live')"
                  class="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white"
                  title="Preview sound"
              >
                ▶️
              </button>
              <button
                  v-if="sounds.live"
                  @click="clearSoundFile('live')"
                  class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Offline Sound -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">Offline Notification Sound</label>
            <div class="flex gap-2">
              <input
                  v-model="sounds.offline"
                  type="text"
                  placeholder="Select a sound file..."
                  class="flex-1 px-3 py-2 bg-slate-600 rounded text-white placeholder-gray-400"
                  readonly
              />
              <button
                  @click="selectSoundFile('offline')"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
              >
                Browse
              </button>
              <button
                  @click="previewSound('offline')"
                  class="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white"
                  title="Preview sound"
              >
                ▶️
              </button>
              <button
                  v-if="sounds.offline"
                  @click="clearSoundFile('offline')"
                  class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Predictive Sound -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">Predictive Go Live Sound</label>
            <div class="flex gap-2">
              <input
                  v-model="sounds.predict"
                  type="text"
                  placeholder="Select a sound file..."
                  class="flex-1 px-3 py-2 bg-slate-600 rounded text-white placeholder-gray-400"
                  readonly
              />
              <button
                  @click="selectSoundFile('predict')"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
              >
                Browse
              </button>
              <button
                  @click="previewSound('predict')"
                  class="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white"
                  title="Preview sound"
              >
                ▶️
              </button>
              <button
                  v-if="sounds.predict"
                  @click="clearSoundFile('predict')"
                  class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div class="text-xs text-gray-400 mt-4">
          <p>Supported formats: MP3, WAV, OGG</p>
          <p>If no custom sound is set, the default notification sounds will be used.</p>
        </div>
      </div>

      <div class="flex gap-2">
        <button
            @click="save"
            class="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded"
        >
          Save Settings
        </button>
        <button
            @click="$emit('close')"
            class="px-6 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { notify } from '../../composables/useNotification.js'

const props = defineProps({
  channelName: String,
  modelValue: Object
})

const emit = defineEmits(['close', 'save'])

const sounds = ref({
  live: '',
  offline: '',
  predict: ''
})

async function selectSoundFile(type) {
  try {
    const result = await open({
      title: `Select ${type} notification sound`,
      multiple: false,
      filters: [{
        name: 'Audio Files',
        extensions: ['mp3', 'wav', 'ogg']
      }]
    })
    
    if (result) {
      sounds.value[type] = result
    }
  } catch (error) {
    console.error('Failed to select file:', error)
  }
}

function clearSoundFile(type) {
  sounds.value[type] = ''
}

async function previewSound(type) {
  let soundToPlay = null
  
  // Use custom sound if available, otherwise use default
  if (sounds.value[type]) {
    soundToPlay = sounds.value[type]
  } else {
    // Map to default sounds
    switch (type) {
      case 'live':
        soundToPlay = 'up'
        break
      case 'offline':
        soundToPlay = 'down'
        break
      case 'predict':
        soundToPlay = 'predict'
        break
    }
  }
  
  if (soundToPlay) {
    await notify(
      `${type.charAt(0).toUpperCase() + type.slice(1)} Preview`,
      `Playing ${type} notification sound`,
      null,
      soundToPlay
    )
  }
}

function save() {
  const channelSettings = {
    sounds: { ...sounds.value }
  }
  emit('save', channelSettings)
}

onMounted(() => {
  // Load existing channel settings
  if (props.modelValue?.sounds) {
    sounds.value = { ...props.modelValue.sounds }
  }
})
</script>
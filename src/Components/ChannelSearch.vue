<template>
  <div>
    <input
        type="text"
        v-model="channelName"
        @input="onSearch"
        @keyup.enter="selectChannel(channelName)"
        placeholder="Enter Twitch channel"
        class="w-full bg-slate-700 text-white px-3 py-2 rounded mb-2"
    />

    <ul
        v-if="searchResults.length"
        class="bg-slate-700 rounded text-sm max-h-40 overflow-auto"
    >
      <li
          v-for="channel in searchResults"
          :key="channel.id"
          @click="selectChannel(channel.display_name)"
          class="px-2 py-1 cursor-pointer hover:bg-slate-600"
      >
        {{ channel.display_name }} <span v-if="channel.is_live">(Live)</span>
      </li>
    </ul>

    <p v-if="error" class="text-red-400 text-sm mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, watch, onMounted, onBeforeUnmount } from 'vue'
import { getConfig } from '../composables/useConfig'
import { useTwitchChannel } from '../composables/useTwitchChannel'

const emit = defineEmits(['update:modelValue', 'addChannel'])

const globalSettings = inject('globalSettings') as any

const channelName = ref()

// We'll assign these once we have config
const searchResults = ref<any[]>([])
const error = ref<string | null>(null)
let searchChannel: ((name: string) => void) | null = null

let debounceTimer: number | undefined

onMounted(async () => {
  const config = await getConfig('config')

  const twitch = useTwitchChannel(globalSettings.twitchClientId, config.twitch_token)

  // ⚠️ Important: Point to the actual refs, not copy values
  searchResults.value = []
  error.value = null

  watch(twitch.searchResults, (val) => {
    searchResults.value = val
  })

  watch(twitch.error, (val) => {
    error.value = val
  })

  searchChannel = twitch.searchChannel
})

function onSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    if (channelName.value.trim().length > 2 && searchChannel) {
      searchChannel(channelName.value.trim())
    }
  }, 300)
}

function selectChannel(name: string) {
  if (!name) return
  channelName.value = null
  searchResults.value = [] // Hide list after selection
  emit('addChannel', name)
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

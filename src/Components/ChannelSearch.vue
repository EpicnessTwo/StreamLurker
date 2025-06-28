<template>
  <div>
    <input
        type="text"
        v-model="channelName"
        @input="onSearch"
        placeholder="Enter Twitch channel"
        class="w-full bg-slate-700 text-white px-2 py-1 rounded mb-2"
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
import { ref, inject, watch, onBeforeUnmount } from 'vue'
import { getConfig } from '../composables/useConfig'
import { useTwitchChannel } from '../composables/useTwitchChannel'

const props = defineProps<{
  modelValue: string
}>()
const emit = defineEmits(['update:modelValue'])

const globalSettings = inject('globalSettings')
const config = await getConfig('config')

const channelName = ref(props.modelValue)
watch(() => props.modelValue, (val) => {
  if (val !== channelName.value) channelName.value = val
})
watch(channelName, (val) => {
  emit('update:modelValue', val)
})

const { searchChannel, searchResults, error } = useTwitchChannel(
    globalSettings.twitchClientId,
    config.twitch_token
)

let debounceTimer: number | undefined

function onSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    if (channelName.value.trim().length > 2) {
      searchChannel(channelName.value.trim())
    }
  }, 300)
}

function selectChannel(name: string) {
  channelName.value = name
  searchResults.value = [] // Hide list after selection
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

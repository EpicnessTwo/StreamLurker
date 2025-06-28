<template>
  <div
      class="flex items-center p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition relative group cursor-pointer"
      @click="goToChannel"
  >
    <!-- Channel Icon -->
    <img
        :src="icon"
        alt="Channel Icon"
        class="w-12 h-12 rounded-full object-cover mr-4"
        :class="{ 'grayscale': !isLive }"
    />

    <!-- Info Section -->
    <div class="flex-1">
      <div class="flex items-center gap-2">
        <h2 class="text-white font-semibold text-lg">{{ channelName }}</h2>
        <span
            v-if="isLive"
            class="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase"
        >
          Live
        </span>
      </div>
      <p class="text-sm text-gray-300">{{ nowPlaying }}</p>
      <p class="text-xs text-gray-400" v-if="isLive">{{ viewerCount }} watching</p>
    </div>

    <!-- Settings Icon -->
    <button
        class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        @click.stop="$emit('settings')"
    >
      <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-400 hover:text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
      >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v1m0 14v1m8-8h1M4 12H3m15.364-6.364l.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { openUrl } from '@tauri-apps/plugin-opener';

const props = defineProps({
  icon: String,
  channelName: String,
  nowPlaying: String,
  isLive: Boolean,
  viewerCount: Number
})

const emit = defineEmits(['settings'])

function goToChannel() {
  if (props.channelName) {
    openUrl(`https://twitch.tv/${props.channelName}`)
  }
}
</script>

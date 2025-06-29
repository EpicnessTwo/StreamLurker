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
        <h2 class="text-white font-semibold text-lg w-full">
          {{ channelName }}
          <Checkmark
              v-if="type !== ''"
              :class="{
                  'text-green-500': type === 'affiliate',
                  'text-purple-500': type === 'partner',
                }"
              :title="type === 'affiliate' ? 'Twitch Affiliate' : type === 'partner' ? 'Twitch Partner' : ''"
          />
        </h2>
      </div>
      <p class="text-sm text-gray-300">{{ title }}</p>
      <p class="text-xs text-gray-400">{{ game }}</p>
      <p class="text-xs text-gray-400" v-if="isLive">{{ viewerCount }} watching</p>
    </div>

    <!-- Settings Icon and Dropdown -->
    <div class="absolute top-2 right-2 group/settings">
      <button
          class="opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="toggleMenu"
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

      <div
          v-if="menuOpen"
          class="absolute right-0 mt-2 w-32 bg-gray-800 rounded-md shadow-lg z-50"
          @click.stop
      >
        <button
            class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700"
            @click="$emit('delete')"
        >
          Delete Channel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { openUrl } from '@tauri-apps/plugin-opener';
import Checkmark from "./Checkmark.vue";

const props = defineProps({
  type: String,
  icon: String,
  channelName: String,
  title: String,
  game: String,
  isLive: Boolean,
  viewerCount: Number
})

const emit = defineEmits(['settings', 'delete'])

const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function goToChannel() {
  if (props.channelName) {
    openUrl(`https://twitch.tv/${props.channelName}`)
  }
}

onMounted(() => {
  document.addEventListener('click', () => (menuOpen.value = false))
})
</script>

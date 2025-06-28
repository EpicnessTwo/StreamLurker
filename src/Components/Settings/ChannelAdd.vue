<template>
  <div class="relative inline-block">
    <button @click="open = !open" class="px-3 py-2 bg-indigo-700 rounded hover:bg-indigo-600">
      Add Channel
    </button>

    <div
        v-if="open"
        class="absolute right-0 mt-2 w-64 bg-slate-800 text-white rounded-lg shadow-lg p-4 z-10"
    >
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-bold">Add Channel</h2>
        <button @click="open = false" class="text-red-400 hover:text-red-200">✖</button>
      </div>

      <input
          type="text"
          v-model="channelName"
          placeholder="Enter Twitch channel"
          class="w-full bg-slate-700 text-white px-2 py-1 rounded mb-2"
      />
      <button
          @click="addChannel"
          class="w-full bg-blue-600 hover:bg-blue-500 text-white py-1 rounded"
      >
        Add
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
const channelName = ref('')
const emit = defineEmits(['add'])

function addChannel() {
  if (channelName.value.trim()) {
    emit('add', channelName.value.trim())
    channelName.value = ''
    open.value = false
  }
}
</script>

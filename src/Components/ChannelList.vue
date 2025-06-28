<template>
  <div class="space-y-8">
    <!-- Live Channels Section -->
    <div v-if="liveChannels.length">
      <h2 class="text-xl font-bold mb-4">Live Channels</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <Channel
            v-for="(channel, index) in liveChannels"
            :key="`live-${index}`"
            :icon="channel.icon"
            :channel-name="channel.channelName"
            :now-playing="channel.nowPlaying"
            :is-live="channel.isLive"
            :viewer-count="channel.viewerCount"
            @settings="handleSettings(channel)"
        />
      </div>
    </div>

    <!-- Offline Channels Section -->
    <div v-if="offlineChannels.length">
      <h2 class="text-xl font-bold mb-4">Offline Channels</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Channel
            v-for="(channel, index) in offlineChannels"
            :key="`offline-${index}`"
            :icon="channel.icon"
            :channel-name="channel.channelName"
            :now-playing="channel.nowPlaying"
            :is-live="channel.isLive"
            :viewer-count="channel.viewerCount"
            @settings="handleSettings(channel)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Channel from './Channel.vue'

const props = defineProps({
  channels: {
    type: Array,
    required: true
  }
})

// Separate live and offline channels
const channelArray = computed(() => Object.values(props.channels))

const liveChannels = computed(() =>
    channelArray.value.filter((c) => c.isLive)
)
const offlineChannels = computed(() =>
    channelArray.value.filter((c) => !c.isLive)
)

function handleSettings(channel) {
  console.log(`Settings clicked for ${channel.channelName}`)
}
</script>

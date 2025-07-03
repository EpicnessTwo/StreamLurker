<template>
  <div class="space-y-8 mb-10">
    <!-- Live Channels Section -->
    <div v-if="liveChannels.length">
      <h2 class="text-xl font-bold mb-4">Live Channels</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <Channel
            v-for="(channel, index) in liveChannels"
            :key="`live-${index}`"
            :type="channel.type"
            :icon="channel.icon"
            :channel-name="channel.channelName"
            :title="channel.title"
            :game="channel.game"
            :is-live="channel.isLive"
            :viewer-count="channel.viewerCount"
            @settings="handleSettings(channel)"
            @delete="handleDelete(channel.channelName)"
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
            :type="channel.type"
            :icon="channel.icon"
            :channel-name="channel.channelName"
            :is-live="channel.isLive"
            :viewer-count="channel.viewerCount"
            @settings="handleSettings(channel)"
            @delete="handleDelete(channel.channelName)"
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
    type: Object,
    required: true
  }
})

const emit = defineEmits(['delete'])

const channelList = computed(() => Object.values(props.channels))

const liveChannels = computed(() =>
    channelList.value
        .filter((c) => c.isLive)
        .sort((a, b) => a.channelName.localeCompare(b.channelName))
)

const offlineChannels = computed(() =>
    channelList.value
        .filter((c) => !c.isLive)
        .sort((a, b) => a.channelName.localeCompare(b.channelName))
)

function handleSettings(channel) {
  console.log(`Settings clicked for ${channel.channelName}`)
}

function handleDelete(name) {
  emit('delete', name)
}
</script>

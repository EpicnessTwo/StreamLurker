<template>
  <div class="background min-h-screen bg-slate-900 text-white flex flex-col px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">StreamLurker</h1>
      <div class="flex gap-2">
        <ChannelAdd @add="handleAddChannel" />
        <Settings @update:settings="handleSettingsUpdate" />
      </div>
    </div>

    <ChannelList :channels="channels" />
    <SyncIndicator :syncing="syncing" />
  </div>
</template>

<script setup lang="ts">
import { useTwitchChannel } from './composables/useTwitchChannel'
import { getConfig, setConfig } from './composables/useConfig'
import {inject, onMounted, ref} from 'vue'
import ChannelList from './Components/ChannelList.vue'
import ChannelAdd from "./Components/Settings/ChannelAdd.vue";
import Settings from "./Components/Settings/Settings.vue";
import SyncIndicator from "./Components/SyncIndicator.vue";

interface ChannelInfo {
  icon: string | null
  isLive: boolean
  isMature: boolean
  channelName: string
  nowPlaying: string | null
  viewerCount: number
}

const channels = ref<Record<string, ChannelInfo>>({})
const syncing = ref(false)
let twitch: ReturnType<typeof useTwitchChannel>
let config: any = {}
const globalSettings = inject('globalSettings')

async function checkAllChannels() {
  if (!config?.channels || !twitch) return
  syncing.value = true;

  for (const channel of config.channels) {
    if (!channels.value[channel]) {
      channels.value[channel] = {
        icon: null,
        isLive: false,
        isMature: false,
        channelName: channel,
        nowPlaying: null,
        viewerCount: 0
      }
    }

    try {
      const info = await twitch.checkChannel(channel)
      if (info) {
        channels.value[channel] = {
          ...info,
          channelName: channel
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch channel info for ${channel}:`, e)
    }
  }

  syncing.value = false;
}

function handleAddChannel(newChannel: string) {
  if (!config.channels.includes(newChannel)) {
    config.channels.push(newChannel)

    setConfig('config', config)

    checkAllChannels()
  }
}

function handleSettingsUpdate(newSettings: any) {

}

onMounted(async () => {
  config = await getConfig('config')
  const twitchToken = config.twitch_token

  twitch = useTwitchChannel(globalSettings.twitchClientId, twitchToken)

  await checkAllChannels()

  // 🔁 Optionally refresh every 60 seconds
  setInterval(checkAllChannels, 10000)
})
</script>

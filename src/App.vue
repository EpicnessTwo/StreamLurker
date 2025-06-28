<template>
  <div class="background min-h-screen bg-slate-900 text-white flex flex-col px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">StreamLurker</h1>
      <div class="flex gap-2">
        <button @click="notify('Test Notification', 'This is a test notification!')" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded">
          Test Notification
        </button>
        <ChannelAdd @add="handleAddChannel" />
        <Settings v-model="config" @update:settings="handleSettingsUpdate" />
      </div>
    </div>

    <ChannelList :channels="channels" />
    <SyncIndicator :syncing="syncing" />
  </div>
</template>

<script setup lang="ts">
import { useTwitchChannel } from './composables/useTwitchChannel'
import { getConfig, setConfig } from './composables/useConfig'
import { notify } from './composables/useNotification'
import { inject, onMounted, ref } from 'vue'
import ChannelList from './Components/ChannelList.vue'
import ChannelAdd from './Components/Settings/ChannelAdd.vue'
import Settings from './Components/Settings/Settings.vue'
import SyncIndicator from './Components/SyncIndicator.vue'
import {openUrl} from "@tauri-apps/plugin-opener";

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
  syncing.value = true

  const channelNames = Object.keys(config.channels)

  for (const channel of channelNames) {
    try {
      const info = await twitch.checkChannel(channel)
      if (info) {
        // Notification Checks
        if (config.settings?.notifications && info.isLive !== channels.value[channel]?.isLive) {
          if (info.isLive) {
            await notify(
                `${info.channelName} is now live!`,
                `Now playing: ${info.nowPlaying || 'Unknown'}`,
                info.icon
            )

            if (config.settings?.autoOpen) {
              await openUrl(`https://www.twitch.tv/${info.channelName}`)
            }
          } else {
            await notify(
                `${info.channelName} is no longer live.`,
                'Stream has ended.',
                info.icon
            )
          }

        }

        channels.value[channel] = info
      }
    } catch (e) {
      console.warn(`Failed to fetch channel info for ${channel}:`, e)
    }
  }

  config.channels = channels.value
  config = await setConfig('config', config)

  syncing.value = false
}

async function handleAddChannel(newChannel: string) {
  console.log('Adding new channel:', newChannel)
  const name = newChannel.toLowerCase()
  if (!config.channels[name]) {
    config.channels[name] = {
      channelName: newChannel,
      isLive: false,
    }
    config = await setConfig('config', config)
    await checkAllChannels()
  }
}

async function handleSettingsUpdate(newSettings: any) {
  console.log('Settings updated:', newSettings)
  config.settings = newSettings
  config = await setConfig('config', config)
  await checkAllChannels()
}

onMounted(async () => {
  config = await getConfig('config')
  config.channels = config.channels || []

  channels.value = config.channels

  const twitchToken = config.twitch_token
  twitch = useTwitchChannel(globalSettings.twitchClientId, twitchToken)

  await checkAllChannels()

  setInterval(checkAllChannels, 10000)
})
</script>


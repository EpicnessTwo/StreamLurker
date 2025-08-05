<template>
  <div class="background min-h-screen bg-slate-900 text-white flex flex-col px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">StreamLurker</h1>
      <div class="flex gap-2">
        <button 
          @click="toggleNotificationPanel"
          class="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          title="Show notifications"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </button>
        <ChannelAdd @add="handleAddChannel" />
        <Settings v-model="config" @update:settings="handleSettingsUpdate" />
      </div>
    </div>
    <div v-if="reauthenticate" class="fixed right-0 top-0 w-full h-full z-100 bg-slate-800/70 backdrop-blur-3xl backdrop-opacity-90 px-8 py-16 items-center justify-center flex">
      <StepAuth
        v-model="config"
        @update:modelValue="updateAuthentication"
        ></StepAuth>
    </div>

    <ChannelList :channels="channels" @delete="handleDeleteChannel"/>
    <SyncIndicator :syncing="syncing" />
    
    <!-- Notification Panel -->
    <NotificationPanel 
      :isOpen="showNotificationPanel" 
      @close="showNotificationPanel = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { useTwitchChannel } from './composables/useTwitchChannel'
import { getConfig, setConfig } from './composables/useConfig'
import { notify } from './composables/useNotification'
import { useNotificationStore } from './composables/useNotificationStore.js'
import { inject, onMounted, ref, computed } from 'vue'
import ChannelList from './Components/ChannelList.vue'
import ChannelAdd from './Components/Settings/ChannelAdd.vue'
import Settings from './Components/Settings/Settings.vue'
import SyncIndicator from './Components/SyncIndicator.vue'
import NotificationPanel from './Components/NotificationPanel.vue'
import { openUrl } from "@tauri-apps/plugin-opener";
import StepAuth from "./Components/Setup/StepAuth.vue";

interface ChannelInfo {
  type: string | null
  icon: string | null
  isLive: boolean
  isMature: boolean
  channelName: string
  title: string | null
  game: string | null
  viewerCount: number
}

const channels = ref<Record<string, ChannelInfo>>({})
const syncing = ref(false)
const reauthenticate = ref(false)
const showNotificationPanel = ref(false)
let twitch: ReturnType<typeof useTwitchChannel>
let config: any = {}
const globalSettings = inject('globalSettings')

// Notification store for unread count
const { getUnreadCount } = useNotificationStore()
const unreadCount = computed(() => getUnreadCount())

function toggleNotificationPanel() {
  showNotificationPanel.value = !showNotificationPanel.value
}

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
                `Now playing: ${info.game || 'Unknown'}`,
                info.icon,
                config.settings?.sounds ? 'up' : null
            )

            if (config.settings?.autoOpen) {
              await openUrl(`https://www.twitch.tv/${info.channelName}`)
            }
          } else {
            await notify(
                `${info.channelName} is no longer live.`,
                'Stream has ended.',
                info.icon,
                config.settings?.sounds ? 'down' : null
            )
          }

        } else if (config.settings?.predictive && !info.isLive) {
          if (
              (info.title !== channels.value[channel]?.title) ||
              (info.game !== channels.value[channel]?.game)
          ) {
            console.log(`Predictive notification for ${channel}:`, info)
            await notify(
                `${info.channelName} might be going live soon!`,
                `${info.title || 'Unknown'}\n\n${info.game || 'Unknown'}`,
                info.icon,
                config.settings?.sounds ? 'predict' : null
            )
          }
        }

        channels.value[channel] = info
      }

      if (twitch.error.value) await authCheck()
    } catch (e) {
      console.warn(`Failed to fetch channel info for ${channel}:`, e)

      await authCheck()
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

function handleDeleteChannel(channelName: string) {
  console.log('Deleting channel:', channelName)
  delete channels.value[channelName.toLowerCase()]
  delete config.channels[channelName.toLowerCase()]
  setConfig('config', config)
}


async function handleSettingsUpdate(newSettings: any) {
  console.log('Settings updated:', newSettings)
  config.settings = newSettings
  config = await setConfig('config', config)
  await checkAllChannels()
}

async function authCheck() {
  console.log('Checking Twitch authentication status...')
  twitch.check().then((response) => {
    if (response) return;

    if (twitch.error.value === 'Authentication failed') {
      reauthenticate.value = true
      console.warn('Reauthentication required')
    } else {
      console.error('Error checking channel:', twitch.error)
    }
  })
}

function updateAuthentication(newConfig: any) {
  console.log('Updating authentication with new config:', newConfig)
  setConfig('config', newConfig).then(() => {
    window.location.reload()
  })
}

onMounted(async () => {
  config = await getConfig('config') || {
    channels: {},
    settings: {
      notifications: true,
      sounds: false,
      autoOpen: false,
      predictive: false
    },
    finished: false
  }
  config.channels = config.channels || {}

  channels.value = config.channels

  // Mock Twitch token for demo
  const twitchToken = config.twitch_token || 'demo_token'
  // Don't actually initialize Twitch API in demo mode
  // twitch = useTwitchChannel(globalSettings.twitchClientId, twitchToken)

  // Add some demo notifications after a delay to show the panel functionality
  setTimeout(() => {
    notify('Ninja is now live!', 'Now playing: Fortnite', null, 'up');
  }, 2000);
  
  setTimeout(() => {
    notify('Shroud might be going live soon!', 'Valorant stream starting soon', null, 'predict');
  }, 4000);
  
  setTimeout(() => {
    notify('xQc is no longer live.', 'Stream has ended.', null, 'down');
  }, 6000);

  // Don't run the actual channel checking in demo mode
  // await checkAllChannels()
  // setInterval(checkAllChannels, 30000)
})
</script>


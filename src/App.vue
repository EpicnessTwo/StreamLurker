<template>
  <div class="background min-h-screen bg-slate-900 text-white flex flex-col px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">StreamLurker</h1>
      <div class="flex gap-2">
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

    <ChannelList :channels="channels" @delete="handleDeleteChannel" @channel-settings="handleChannelSettings"/>
    <SyncIndicator :syncing="syncing" />

    <!-- Channel Settings Modal -->
    <ChannelSettings 
        v-if="channelSettingsOpen"
        :channel-name="selectedChannel?.channelName"
        :model-value="getChannelSettings(selectedChannel?.channelName)"
        @close="closeChannelSettings"
        @save="saveChannelSettings"
    />
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
import ChannelSettings from './Components/Settings/ChannelSettings.vue'
import SyncIndicator from './Components/SyncIndicator.vue'
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
const channelSettingsOpen = ref(false)
const selectedChannel = ref(null)
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
          // Get channel-specific sound configuration
          const channelConfig = config.channels[channel] || {}
          const channelSounds = channelConfig.sounds || {}
          
          if (info.isLive) {
            // Use custom live sound if available, otherwise default
            const soundToPlay = config.settings?.sounds ? 
              (channelSounds.live || 'up') : null
              
            await notify(
                `${info.channelName} is now live!`,
                `Now playing: ${info.game || 'Unknown'}`,
                info.icon,
                soundToPlay
            )

            if (config.settings?.autoOpen) {
              await openUrl(`https://www.twitch.tv/${info.channelName}`)
            }
          } else {
            // Use custom offline sound if available, otherwise default
            const soundToPlay = config.settings?.sounds ? 
              (channelSounds.offline || 'down') : null
              
            await notify(
                `${info.channelName} is no longer live.`,
                'Stream has ended.',
                info.icon,
                soundToPlay
            )
          }

        } else if (config.settings?.predictive && !info.isLive) {
          if (
              (info.title !== channels.value[channel]?.title) ||
              (info.game !== channels.value[channel]?.game)
          ) {
            console.log(`Predictive notification for ${channel}:`, info)
            
            // Get channel-specific sound configuration
            const channelConfig = config.channels[channel] || {}
            const channelSounds = channelConfig.sounds || {}
            
            // Use custom predictive sound if available, otherwise default
            const soundToPlay = config.settings?.sounds ? 
              (channelSounds.predict || 'predict') : null
              
            await notify(
                `${info.channelName} might be going live soon!`,
                `${info.title || 'Unknown'}\n\n${info.game || 'Unknown'}`,
                info.icon,
                soundToPlay
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

function handleChannelSettings(channel: any) {
  console.log('Opening channel settings for:', channel.channelName)
  selectedChannel.value = channel
  channelSettingsOpen.value = true
}

function closeChannelSettings() {
  channelSettingsOpen.value = false
  selectedChannel.value = null
}

async function saveChannelSettings(channelSettings: any) {
  if (!selectedChannel.value) return
  
  const channelName = selectedChannel.value.channelName.toLowerCase()
  console.log('Saving channel settings for:', channelName, channelSettings)
  
  // Ensure the channel config exists
  if (!config.channels[channelName]) {
    config.channels[channelName] = {
      channelName: selectedChannel.value.channelName,
      isLive: false,
    }
  }
  
  // Save the channel-specific settings
  config.channels[channelName] = {
    ...config.channels[channelName],
    ...channelSettings
  }
  
  config = await setConfig('config', config)
  closeChannelSettings()
}

function getChannelSettings(channelName: string) {
  if (!channelName) return {}
  const channelConfig = config.channels?.[channelName.toLowerCase()]
  return channelConfig || {}
}

onMounted(async () => {
  config = await getConfig('config')
  config.channels = config.channels || []

  channels.value = config.channels

  const twitchToken = config.twitch_token
  twitch = useTwitchChannel(globalSettings.twitchClientId, twitchToken)

  await checkAllChannels()

  setInterval(checkAllChannels, 30000)
})
</script>


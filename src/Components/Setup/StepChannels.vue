<template>
  <div class="space-y-4">
    <p class="text-lg text-center">Enter channels you want to monitor</p>
    <ChannelSearch class="w-full rounded" @add-channel="addChannel"/>
    <div class="flex justify-between items-center">
<!--      <button class="bg-purple-600 px-4 py-2 rounded text-white" @click="fetchFollowedChannels">Fetch my Followed Channels</button>-->
    </div>

    <ul class="space-y-2 mt-4">
      <li
          v-for="channel in Object.values(modelValue.channels)"
          :key="channel.name"
          class="flex justify-between items-center bg-slate-700 p-2 rounded"
      >
        <span>{{ channel.channelName }}</span>
        <button @click="removeChannel(channel.channelName)" class="text-red-400">Remove</button>
      </li>
    </ul>

    <div class="flex justify-between mt-6">
      <button class="text-slate-300" @click="$emit('back')">Back</button>
      <button class="bg-green-600 px-4 py-2 rounded text-white" @click="$emit('next')">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useTwitchChannel } from "../../composables/useTwitchChannel.js";
import ChannelSearch from "../ChannelSearch.vue";

const props = defineProps({
  modelValue: Object
})

const emit = defineEmits(["update:modelValue", "next", "back"])
const newChannel = ref("")
const globalSettings = inject("globalSettings")

function addChannel(name) {
  if (!name) return

  const updatedChannels = {
    ...props.modelValue.channels,
    [name.toLowerCase()]: {
      channelName: name,
      is_live: false
    }
  }

  emit("update:modelValue", {
    ...props.modelValue,
    channels: updatedChannels
  })

  newChannel.value = ""
}


function removeChannel(name) {
  const updatedChannels = { ...props.modelValue.channels }
  delete updatedChannels[name.toLowerCase()]

  emit("update:modelValue", {
    ...props.modelValue,
    channels: updatedChannels
  })
}


function fetchFollowedChannels() {
  const { getFollowedChannelsOfAuthenticatedUser } = useTwitchChannel(
      globalSettings.twitchClientId,
      props.modelValue.twitch_token
  )

  getFollowedChannelsOfAuthenticatedUser()
      .then(followed => {
        const current = props.modelValue.channels || {}
        const updated = { ...current }

        for (const c of followed) {
          const name = c.display_name.toLowerCase()
          if (!updated[name]) {
            updated[name] = {
              name: c.display_name,
              is_live: c.is_live
            }
          }
        }

        emit("update:modelValue", {
          ...props.modelValue,
          channels: updated
        })
      })
      .catch(err => {
        console.error("Error fetching followed channels:", err)
      })
}

</script>
<script setup>
import { inject } from 'vue'
import { openUrl } from '@tauri-apps/plugin-opener';
import { start, cancel, onUrl, onInvalidUrl } from '@fabianlars/tauri-plugin-oauth';

const props = defineProps({
  modelValue: Object
})

const emit = defineEmits(["update:modelValue", "next", "back"])

const globalSettings = inject('globalSettings');

function getAccessTokenFromUrl(url) {
  const hash = new URL(url).hash;
  const params = new URLSearchParams(hash.substring(1));
  return params.get('access_token');
}

async function startTwitchAuthFlow() {

  try {
    const port = await start(
        {
          ports: [8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009]
        }
    );
    console.log(`OAuth server started on port ${port}`);

    // Set up listeners for OAuth results
    await onUrl((url) => {
      console.log('Received OAuth URL:', url);

      const accessToken = getAccessTokenFromUrl(url);

      if (accessToken) {
        console.log('Access Token:', accessToken);
        // Save the access token to your config or state
        props.modelValue.twitch_token = accessToken;
        // Emit an event or call a method to update the parent component
        emit('update:modelValue', props.modelValue);
        emit('next'); // Move to the next step after successful authentication
      } else {
        console.error('No access token found in URL');
      }

    });

    await onInvalidUrl((url) => {
      console.error('Invalid OAuth URL:', url);
      // Handle invalid URL case
    });

    let authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${globalSettings.twitchClientId}&response_type=token&redirect_uri=http://localhost:${port}/auth/callback&scope=user:read:follows&force_verify=true`;

    // Open the Twitch authentication URL
    await openUrl(authUrl);

  } catch (error) {
    console.error('Error starting OAuth server:', error);
  }
}

</script>
<template>
  <div class="flex flex-col items-center space-y-6">
    <p class="text-center text-lg">Authenticate with Twitch to get started.</p>
    <button class="bg-purple-500 hover:bg-purple-700 px-6 py-2 rounded-xl text-white font-semibold"
            @click="startTwitchAuthFlow">
      Authenticate with Twitch
    </button>
  </div>
</template>
// composables/useTwitchChannel.js
import { ref } from 'vue'

export function useTwitchChannel(clientId, accessToken) {
    const loading = ref(false)
    const error = ref(null)

    const searchResults = ref([])
    const channelInfo = ref(null)

    const headers = {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
    }

    const searchChannel = async (query) => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}`, {
                headers
            })
            const data = await res.json()
            searchResults.value = data.data || []
        } catch (e) {
            error.value = 'Failed to search Twitch channel'
            console.error(e)
        } finally {
            loading.value = false
        }
    }

    const checkChannel = async (channelName) => {
        loading.value = true
        error.value = null
        try {
            // Step 1: Get user ID from login name
            const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
                headers
            })
            const userData = await userRes.json()
            const user = userData.data[0]
            if (!user) throw new Error('User not found')

            // Step 2: Get stream info
            const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, {
                headers
            })
            const streamData = await streamRes.json()
            const stream = streamData.data[0]

            // Compose channel info
            channelInfo.value = {
                icon: user.profile_image_url,
                name: user.display_name,
                nowPlaying: stream ? stream.title : 'Offline',
                viewerCount: stream ? stream.viewer_count : 0,
                isLive: !!stream,
                isMature: stream ? stream.is_mature : false
            }

            return channelInfo.value
        } catch (e) {
            error.value = 'Failed to fetch Twitch channel data'
            console.error(e)
            channelInfo.value = null
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        searchResults,
        channelInfo,
        searchChannel,
        checkChannel
    }
}

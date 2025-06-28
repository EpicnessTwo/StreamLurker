import { ref } from 'vue'

export function useTwitchChannel(clientId, accessToken) {
    const loading = ref(false)
    const error = ref(null)

    const searchResults = ref([])
    const channelInfo = ref(null)
    const authenticatedUser = ref(null)
    const followedChannels = ref([])

    const headers = {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
    }

    const check = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch('https://api.twitch.tv/helix/users', {
                headers
            })

            if (!res.ok) {
                throw new Error(`Authentication failed: ${res.status} ${res.statusText}`)
            }

            const data = await res.json()
            const user = data.data?.[0]

            if (!user) {
                throw new Error('Invalid token or user not found')
            }

            // Optionally store this info right away
            authenticatedUser.value = {
                id: user.id,
                login: user.login,
                displayName: user.display_name,
                profileImage: user.profile_image_url,
                description: user.description
            }

            return true
        } catch (e) {
            error.value = 'Authentication failed'
            // console.error(e)
            // throw e // re-throw to ensure calling code can catch it
        } finally {
            loading.value = false
        }
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
            // console.error(e)
        } finally {
            loading.value = false
        }
    }

    const checkChannel = async (channelName) => {
        loading.value = true
        error.value = null
        try {
            const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
                headers
            })
            const userData = await userRes.json()
            const user = userData.data[0]
            if (!user) throw new Error('User not found')

            const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, {
                headers
            })
            const streamData = await streamRes.json()
            const stream = streamData.data[0]

            channelInfo.value = {
                icon: user.profile_image_url,
                channelName: user.display_name,
                nowPlaying: stream ? stream.title : 'Offline',
                viewerCount: stream ? stream.viewer_count : 0,
                isLive: !!stream,
                isMature: stream ? stream.is_mature : false
            }

            return channelInfo.value
        } catch (e) {
            error.value = 'Failed to fetch Twitch channel data'
            // console.error(e)
            channelInfo.value = null
        } finally {
            loading.value = false
        }
    }

    const getFollowedChannelsOfAuthenticatedUser = async () => {
        loading.value = true
        error.value = null
        followedChannels.value = []
        authenticatedUser.value = null

        try {
            // Step 1: Get user info from token
            const userRes = await fetch('https://api.twitch.tv/helix/users', {
                headers
            })
            const userData = await userRes.json()
            const user = userData.data?.[0]
            if (!user) throw new Error('User not found')

            authenticatedUser.value = {
                id: user.id,
                login: user.login,
                displayName: user.display_name,
                profileImage: user.profile_image_url,
                description: user.description
            }

            // Step 2: Get followed channels
            const followsRes = await fetch(`https://api.twitch.tv/helix/channels/followed?user_id=${user.id}&first=100`, {
                headers
            })
            const followsData = await followsRes.json()

            followedChannels.value = followsData.data.map(channel => ({
                name: channel.broadcaster_name,
            }))

            return followedChannels.value
        } catch (e) {
            error.value = 'Failed to fetch followed channels'
            // console.error(e)
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        searchResults,
        channelInfo,
        authenticatedUser,
        followedChannels,
        check,
        searchChannel,
        checkChannel,
        getFollowedChannelsOfAuthenticatedUser
    }
}

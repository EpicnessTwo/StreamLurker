import { app, BrowserWindow, ipcMain } from 'electron';
import axios from 'axios';
import open from 'open';
import { existsSync, writeFile } from 'fs';

let win;
let config = {
    "clientId": null,
    "clientSecret": null,
    "debugMode": false,
    "channels": [
        'epickittyxp'
    ]
};
let configPath;
const streamStatuses = {};

if (app.isPackaged) {
    // Path when app is compiled
    configPath = './resources/config.json';
} else {
    // Path in development (relative to main.js or main process file)
    configPath = './config.json';
}
console.log(configPath);

async function loadConfig() {
    if (existsSync(configPath)) {
        try {
            const module = await import(configPath, { assert: { type: 'json' } });
            config = module.default;
            return true;
        } catch (error) {
            console.error('Failed to load config:', error);
            return false;
        }
    } else {
        return false;
    }
}

async function saveConfig() {
    try {
        await writeFile(configPath, JSON.stringify(config, null, 4), 'utf8', () => { });
        return true;
    } catch (error) {
        console.error('Failed to save config:', error);
        return false;
    }
}

function createWindow() {
    win = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.setMinimumSize(350, 200);
    // win.setIcon('Twitch_icon.png');

    loadConfig().then(configExists => {
        if (config.debugMode) {
            win.webContents.openDevTools();
        } else {
            win.removeMenu();
        }

        if (configExists) {
            win.loadFile('frontend/index.html');
            checkStreams(true);
        } else {
            win.loadFile('frontend/setup.html');
        }
    });
}

async function getOAuthToken() {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'client_credentials'
            }
        });
        console.log('OAuth token fetched successfully')
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching OAuth token:', error);
        return null;
    }
}

async function getChannelInfo(channelName, token) {
    try {
        // Fetch stream info
        let streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${channelName}`, {
            headers: {
                'Client-ID': config.clientId,
                'Authorization': `Bearer ${token}`
            }
        });

        // Fetch user info
        let userResponse = await axios.get(`https://api.twitch.tv/helix/users?login=${channelName}`, {
            headers: {
                'Client-ID': config.clientId,
                'Authorization': `Bearer ${token}`
            }
        });

        const displayName = userResponse.data.data[0].display_name;
        const isLive = streamResponse.data.data.length > 0 && streamResponse.data.data[0].type === 'live';
        const profileImageUrl = userResponse.data.data[0].profile_image_url;
        let viewerCount;
        if (isLive) viewerCount = streamResponse.data.data[0].viewer_count || 0;

        return { displayName, isLive, profileImageUrl, viewerCount };
    } catch (error) {
        console.error(`Error fetching info for ${channelName}:`, error);
        return { channelName, isLive: false, profileImageUrl: null, viewerCount: 0 };
    }
}

async function checkStreams(start) {
    const token = await getOAuthToken();
    if (!token) return;

    config.channels.forEach(channel => {
        streamStatuses[channel] = false;
        if (start) {
            win.webContents.send('update-stream-status', channel.toLowerCase(), false, null, 0);
        }
    });

    await processStreams(token)

    if (start) {
        setInterval(async () => {
            await processStreams(token)
        }, 60000); // Check every minute
    }
}

async function processStreams(token) {
    for (const channel of config.channels) {
        // Inside your setInterval in checkStreams function
        const { displayName, isLive, profileImageUrl, viewerCount } = await getChannelInfo(channel, token);
        win.webContents.send('update-stream-status', displayName, isLive, profileImageUrl, viewerCount);

        if (isLive && !streamStatuses[channel]) {
            console.log(`${channel} is live!`);
            win.webContents.send('can-open-stream', channel);
        } else if (!isLive && streamStatuses[channel]) {
            console.log(`${channel} is offline!`);
        }

        streamStatuses[channel] = isLive;
    }
    console.log('Checked all channels')
}

async function addChannel(channel) {
    const channelName = channel.toLowerCase();

    // Check if the channel is already in the config
    if (config.channels.includes(channelName)) {
        console.log(`${channelName} is already in the config`);
    }

    // Add the channel to the config
    config.channels.push(channelName);
    const success = await saveConfig();
    if (!success) {
        console.error('Failed to save config');
    } else {
        console.log(`${channelName} added to config`);
        win.webContents.send('update-stream-status', channel.toLowerCase(), false, null, 0);
        checkStreams();
    }
}

async function deleteChannel(channel) {
    const channelName = channel.toLowerCase();

    // Check if the channel is in the config
    if (!config.channels.includes(channelName)) {
        console.log(`${channelName} is not in the config`);
    }

    // Remove the channel from the config
    config.channels = config.channels.filter(c => c !== channelName);
    const success = await saveConfig();
    if (!success) {
        console.error('Failed to save config');
    } else {
        console.log(`${channelName} removed from config`);
    }
}

app.whenReady().then(() => {
    createWindow();
    console.log('App is ready');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Listeners from the frontend

ipcMain.on('save-twitch-credentials', (event, client_id, client_secret) => {
    config.clientId = client_id;
    config.clientSecret = client_secret;
    saveConfig().then(success => {
        if (success) {
            win.loadFile('frontend/index.html');
            checkStreams(true);
        } else {
            console.error('Failed to save config');
        }
    });
});

ipcMain.on('check-streams', (event, channel) => {
    console.log('Front end has requested to check streams');
    checkStreams();
});

ipcMain.on('add-channel', (event, channel) => {
    console.log(`Front end has requested to add ${channel}`);
    addChannel(channel);
});

ipcMain.on('delete-channel', (event, channel) => {
    console.log(`Front end has requested to delete ${channel}`);
    deleteChannel(channel);
});

ipcMain.on('open-link', (event, href) => {
    console.log(`Front end has requested to open ${href}`);
    open(href);
});

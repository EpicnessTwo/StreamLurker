import { app, BrowserWindow, ipcMain, Tray, Menu, shell, Notification, nativeTheme } from 'electron';
import axios from 'axios';
import { existsSync, writeFile } from 'fs';
import Store from 'electron-store';
import path from 'path';
import * as fs from "fs";

let win, tray;
let config = {
    "initialised": false,
    "clientId": null,
    "clientSecret": null,
    "debugMode": false,
    "canOpenStreams": false,
    "themeSource": 'dark',
    "channels": [
        'epickittyxp'
    ]
};
const streamStatuses = {};
const notificationTitle = 'Stream Lurker';
const gotTheLock = app.requestSingleInstanceLock();
const openTime = new Date();

/**
 * Checks for updates on GitHub
 * @returns {Promise<boolean>}
 */
async function hasUpdate () {
    const currentVersion = app.getVersion();
    const url = 'https://api.github.com/repos/EpicnessTwo/StreamLurker/releases/latest';

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'StreamLurker' }
        });

        const latestVersion = response.data.tag_name.replace('v', '');

        await log('log', `Current version: ${currentVersion}, Latest version: ${latestVersion}`);

        // Compare versions, assuming semantic versioning
        return latestVersion !== currentVersion;
    } catch (error) {
        await log('error', 'Error checking for updates:', error);
        return false;
    }
};

async function checkForUpdate() {
    const updateAvailable = await hasUpdate();
    if (updateAvailable) {
        await log('log', 'Update available');
        win.webContents.send('update-available');
    }
}

/**
 * Loads the config from the store or config.json
 * @returns {Promise<boolean>}
 */
async function loadConfig() {
    if (app.isPackaged) {
        await log('log', 'Loading config from store');
        const store = new Store();
        if (!store.has('config')) return false;
        config = store.get('config');
        return true;
    } else {
        if (existsSync('./config.json')) {
            try {
                const module = await import('./config.json', { assert: { type: 'json' } });
                config = module.default;
                return true;
            } catch (error) {
                await log('error', 'Failed to load config:', error);
                return false;
            }
        } else {
            return false;
        }
    }
}

/**
 * Saves the config to the store or config.json
 * @returns {Promise<boolean>}
 */
async function saveConfig() {
    config.initialised = true;
    if (app.isPackaged) {
        await log('log', 'Saving config to store');
        const store = new Store();
        store.set('config', config);
        return true;
    } else {
        try {
            await writeFile('./config.json', JSON.stringify(config, null, 4), 'utf8', () => { });
            return true;
        } catch (error) {
            await log('error', 'Failed to save config:', error);
            return false;
        }
    }
}

async function log(type, message, channel = false) {
    fs.mkdirSync('./logs', { recursive: true });
    const channelName = channel ? `(${channel}) ` : ' ';
    const currentDate = new Date();
    const logFile = `./logs/${openTime.toISOString().split('T')[0]}-${openTime.toTimeString().split(' ')[0].replaceAll(':', '-')}.log`;
    const logMessage = `[${currentDate.toTimeString().split(' ')[0]}] [${type.toUpperCase()}] ${channelName}${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console[type](logMessage);
}

/**
 * Creates the main window
 */
function createWindow() {
    win = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            win.hide();
        }
        return false;
    });

    win.setMinimumSize(350, 200);
    if (!app.isPackaged) {
        win.setIcon('./frontend/images/lurker.png');
    }

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

/**
 * Creates the tray icon
 */
function createTray() {
    let iconPath = './frontend/images/lurker.png';

    if (app.isPackaged) {
        iconPath = path.join(process.resourcesPath, 'app.asar', iconPath);
    }

    tray = new Tray(iconPath); // Path to your tray icon

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Stream Lurker', type: 'normal', enabled: false, icon: iconPath },
        { type: 'separator' },
        { label: 'Open Repo', click: () => shell.openExternal('https://github.com/EpicnessTwo/StreamLurker') },
        { label: 'Report an Issue', click: () => shell.openExternal('https://github.com/EpicnessTwo/StreamLurker/issues') },
        { type: 'separator' },
        { label: 'Quit Stream Lurker', click: () => app.quit() }
    ]);

    tray.setToolTip('Stream Lurker - Twitch stream status checker');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        win.show();
    });
}

/**
 * Gets an OAuth token from Twitch
 * @returns {Promise<*|null>}
 */
async function getOAuthToken() {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'client_credentials'
            }
        });
        await log('log', 'OAuth token fetched successfully')
        return response.data.access_token;
    } catch (error) {
        await log('error', 'Error fetching OAuth token:', error);
        await apiError();
        return null;
    }
}

/**
 * Gets the stream info for a channel
 * @param channelName
 * @param token
 * @returns {Promise<{isLive: boolean, gameName, displayName: *, isMature, viewerCount: (*|number), profileImageUrl: *}|{isLive: boolean, channelName, viewerCount: number, profileImageUrl: null}>}
 */
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

        // Fetch additional info
        let additionalResponse = await axios.get(`https://api.twitch.tv/helix/channels?broadcaster_id=${userResponse.data.data[0].id}`, {
            headers: {
                'Client-ID': config.clientId,
                'Authorization': `Bearer ${token}`
            }
        });

        // The data of this will return an array of matching channels, we need to find the correct one
        // This will be based on the `broadcaster_login` field
        const additionalChannel = additionalResponse.data.data.find(c => c.broadcaster_login === channelName);

        // Check to see if additionalChannel has been found
        let gameName, streamTitle;
        if (additionalChannel) {
            gameName = additionalChannel.game_name;
            streamTitle = additionalChannel.title;

        }

        // console.log(`Fetched info for ${channelName}`, userResponse.data, streamResponse.data, additionalChannel);

        const displayName = userResponse.data.data[0].display_name;
        const isLive = streamResponse.data.data.length > 0 && streamResponse.data.data[0].type === 'live';
        const profileImageUrl = userResponse.data.data[0].profile_image_url;
        let viewerCount, isMature;
        if (isLive) {
            viewerCount = streamResponse.data.data[0].viewer_count || 0;
            isMature = streamResponse.data.data[0].is_mature;
        }

        return { displayName, isLive, profileImageUrl, viewerCount, gameName, isMature, streamTitle };
    } catch (error) {
        await log('error', `Error fetching info for ${channelName}:` + error, channelName);
        return { channelName, isLive: false, profileImageUrl: null, viewerCount: 0 };
    }
}

async function checkStreams(start) {
    const token = await getOAuthToken();
    if (!token) return;

    await processStreams(token);
    await checkForUpdate();

    if (start) {
        // Main stream checking loop
        setInterval(async () => {
            await processStreams(token);
        }, 60000);

        // Check for updates loop
        setInterval(async () => {
            await checkForUpdate();
        }, 3600000);
    }
}

/**
 * Sets whether streams can be opened
 * @param status
 * @returns {Promise<void>}
 */
async function canOpenStreams(status) {
    await log('log', 'Setting canOpenStreams to' + status);
    config.canOpenStreams = status;
    saveConfig();
}

async function processStreams(token) {
    await isSyncing(true);
    for (const channel of config.channels) {
        streamStatuses[channel] = streamStatuses[channel] || {};
        // Inside your setInterval in checkStreams function
        const { displayName, isLive, profileImageUrl, viewerCount, gameName, isMature, streamTitle } = await getChannelInfo(channel, token);

        let infoChanged;
        let infoUndefined = false
        // First check if the current stored gameName and streamTitle are undefined, if so, just set infoChanged to false
        // Else check if the current gameName and streamTitle are different to the stored ones, if so, set infoChanged to true
        if (streamStatuses[channel].gameName === undefined || streamStatuses[channel].streamTitle === undefined) {
            infoChanged = false;
            infoUndefined = true;
        } else {
            infoChanged = streamStatuses[channel].gameName !== gameName || streamStatuses[channel].streamTitle !== streamTitle;
        }

        if (infoChanged || infoUndefined) {
            await log('log', 'Game Name: (before) ' + streamStatuses[channel].gameName + ' (after) ' + gameName, channel);
            await log('log', 'Stream Title: (before) ' + streamStatuses[channel].streamTitle + ' (after) ' + streamTitle, channel);
            await log('log', 'Info Changed: ' + infoChanged, channel);
        }

        streamStatuses[channel] = streamStatuses[channel] || {};
        streamStatuses[channel].displayName = displayName;
        streamStatuses[channel].profileImageUrl = profileImageUrl;
        streamStatuses[channel].viewerCount = viewerCount;
        streamStatuses[channel].gameName = gameName;
        streamStatuses[channel].streamTitle = streamTitle;
        streamStatuses[channel].isMature = isMature;

        if (isLive && !streamStatuses[channel].isLive) {
            await log('log', `${channel} is live!`, channel);
            new Notification({
                title: notificationTitle,
                body: `${displayName} is live!`
            }).show();
            // Open the stream if the user has enabled it
            if (config.canOpenStreams) await shell.openExternal(`https://twitch.tv/${channel}`);
        } else if (!isLive && streamStatuses[channel].isLive) {
            await log('log', `${channel} is offline!`, channel);
            new Notification({
                title: notificationTitle,
                body: `${displayName} is offline!`
            }).show();
        } else if (!isLive && infoChanged) {
            await log('log', `${channel} has just updated their stream info!`, channel);
            new Notification({
                title: notificationTitle,
                body: `${displayName} might be going live shortly!`
            }).show();
        }

        streamStatuses[channel].isLive = isLive;
    }
    win.webContents.send('update-streams', streamStatuses);
    await isSyncing(false);
    await log('log', 'Checked all channels')
}

/**
 * Adds a channel to the config
 * @param channel
 * @returns {Promise<void>}
 */
async function addChannel(channel) {
    const channelName = channel.toLowerCase();

    // Check if the channel is already in the config
    if (config.channels.includes(channelName)) {
        await log('log', `${channelName} is already in the config`);
        return;
    }

    // Add the channel to the config
    config.channels.push(channelName);
    const success = await saveConfig();
    if (!success) {
        await log('error', 'Failed to save config');
    } else {
        await log('log', `${channelName} added to config`);
        checkStreams();
    }
}

/**
 * Deletes a channel from the config
 * @param channel
 * @returns {Promise<void>}
 */
async function deleteChannel(channel) {
    const channelName = channel.toLowerCase();

    // Check if the channel is in the config
    if (!config.channels.includes(channelName)) {
        await log('log', `${channelName} is not in the config`);
        return;
    }

    // Remove the channel from the config
    config.channels = config.channels.filter(c => c !== channelName);
    const success = await saveConfig();
    if (!success) {
        await log('error', 'Failed to save config');
    } else {
        await log('log', `${channelName} removed from config`);
    }

    // Stop checking the channel
    delete streamStatuses[channelName];
}

async function apiError() {
    await win.loadFile('frontend/setup.html');
    win.webContents.send('failed-credentials');
}

/**
 * Sends the syncing status to the frontend
 * @param status
 * @returns {Promise<void>}
 */
async function isSyncing(status) {
    win.webContents.send('is-syncing', status);
}

// App Processes

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (win) {
            log('log', 'Second instance prevented');
            win.show();
        }
    });

    app.whenReady().then(() => {
        nativeTheme.themeSource = config.themeSource;

        createWindow();
        createTray();
        log('log', 'App is ready');
    });
}



app.on('before-quit', () => app.isQuitting = true);

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

ipcMain.on('change-theme', (event, theme) => {
    nativeTheme.themeSource = theme;
    config.themeSource = theme;
    saveConfig();
});

ipcMain.on('save-twitch-credentials', (event, client_id, client_secret) => {
    config.clientId = client_id;
    config.clientSecret = client_secret;
    saveConfig().then(success => {
        if (success) {
            win.loadFile('frontend/index.html');
            checkStreams(true);
        } else {
            log('error', 'Failed to save config');
        }
    });
});

ipcMain.on('fetch-streams', (event, channel) => {
    log('log', 'Front end has requested to fetch streams');
    win.webContents.send('update-streams', streamStatuses);
});

ipcMain.on('add-channel', (event, channel) => {
    log('log', `Front end has requested to add ${channel}`);
    addChannel(channel);
});

ipcMain.on('delete-channel', (event, channel) => {
    log('log', `Front end has requested to delete ${channel}`);
    deleteChannel(channel);
});

ipcMain.on('change-open-streams', (event, status) => {
    log('log', `Front end has requested to change open streams to ${status}`);
    canOpenStreams(status);
});

ipcMain.on('open-link', (event, href) => {
    log('log', `Front end has requested to open ${href}`);
    shell.openExternal(href);
});

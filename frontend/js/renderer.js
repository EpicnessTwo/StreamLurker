const { ipcRenderer } = require('electron');
const onlineStreamsContainer = document.getElementById('online-channels');
const offlineStreamsContainer = document.getElementById('offline-channels');


document.getElementById('open-streams').addEventListener('change', () => {
    localStorage.setItem('canOpenStreams', document.getElementById('open-streams').checked ? 'enabled' : 'disabled');
});

if (localStorage.getItem('canOpenStreams') === null) {
    localStorage.setItem('canOpenStreams', 'disabled');
    document.getElementById('open-streams').checked = false;
}

document.getElementById('open-streams').checked = localStorage.getItem('canOpenStreams') === 'enabled';

ipcRenderer.on('update-stream-status', (event, channel, isLive, profileImageUrl, viewerCount) => {
    updateStreamStatus(channel, isLive, profileImageUrl, viewerCount);
});

ipcRenderer.on('can-open-stream', (event, channel) => {
    console.log('can-open-stream')
    if (localStorage.getItem('canOpenStreams') === 'enabled') openStream(channel);
});

document.getElementById('addChannelButton').addEventListener('click', () => {
    document.getElementById('add-channel').style.display = 'block';
    document.getElementById('channel_name').focus();
});

document.getElementById('close').addEventListener('click', () => {
    document.getElementById('channel_name').value = '';
    document.getElementById('add-channel').style.display = 'none';
});

document.getElementById('submitChannel').addEventListener('click', () => {
    const channel = document.getElementById('channel_name').value.toLowerCase();
    if (!channel) return; // Don't add empty channels

    document.getElementById('channel_name').value = '';
    document.getElementById('add-channel').style.display = 'none';

    if (!document.getElementById(channel)) {
        ipcRenderer.send('add-channel', channel);
    }
});

function updateStreamStatus(channel, status, imageUrl, viewerCount) {
    const channelId = channel.toLowerCase();
    let channelDiv = document.getElementById(channelId);
    let statusTemplate;

    if (!channelDiv) {
        const template = document.getElementById('template');
        channelDiv = template.cloneNode(true);
        channelDiv.id = channelId;
        channelDiv.querySelector('.channel-watch').addEventListener('click', () => openStream(channel));
        channelDiv.querySelector('.channel-delete').addEventListener('click', () => deleteChannel(channel));

        if (status) {
            onlineStreamsContainer.appendChild(channelDiv);
        } else {
            offlineStreamsContainer.appendChild(channelDiv);
        }
    }

    const channelName = channelDiv.querySelector('.channel-name');
    const channelImage = channelDiv.querySelector('.channel-image');
    channelName.textContent = channel;
    channelImage.style.backgroundImage = `url('${imageUrl}')`;
    channelImage.style.backgroundSize = 'cover';

    const channelStatus = channelDiv.querySelector('.channel-status');
    statusTemplate = document.getElementById(status ? 'status-online' : 'status-offline');
    channelStatus.innerHTML = statusTemplate.outerHTML;
    channelStatus.id = '';
    channelDiv.querySelector('.channel-delete').setAttribute('title', 'Delete ' + channel);

    if (status) {
        viewerCountTemplate = document.getElementById('viewer-count');
        const viewerCountDiv = viewerCountTemplate.cloneNode(true);
        viewerCountDiv.id = '';
        viewerCountDiv.querySelector('.count').textContent = formatNumber(viewerCount) + " viewers";
        viewerCountDiv.querySelector('.count').setAttribute('data-count', viewerCount);
        channelStatus.appendChild(viewerCountDiv);
    }

    // Check if the stream is in the correct container, move if not
    if (status && channelDiv.parentElement !== onlineStreamsContainer) {
        onlineStreamsContainer.appendChild(channelDiv);
    } else if (!status && channelDiv.parentElement !== offlineStreamsContainer) {
        offlineStreamsContainer.appendChild(channelDiv);
    }

    const onlineStreams = Array.from(onlineStreamsContainer.children);
    onlineStreams.sort((a, b) => {
        const aCount = parseInt(a.querySelector('.count').getAttribute('data-count'));
        const bCount = parseInt(b.querySelector('.count').getAttribute('data-count'));
        return bCount - aCount;
    });
    onlineStreams.forEach(stream => onlineStreamsContainer.appendChild(stream));

    const offlineStreams = Array.from(offlineStreamsContainer.children);
    offlineStreams.sort((a, b) => {
        const aName = a.querySelector('.channel-name').textContent;
        const bName = b.querySelector('.channel-name').textContent;
        return aName.localeCompare(bName);
    });
    offlineStreams.forEach(stream => offlineStreamsContainer.appendChild(stream));
}

function formatNumber(number) {
    number = number.toFixed(0);
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(number)) {
        number = number.replace(rgx, '$1' + ',' + '$2');
    }
    return number;
}

function openStream(channel) {
    console.log(`Opening ${channel}'s stream`);
    ipcRenderer.send('open-link', `https://twitch.tv/${channel}`);
}

function deleteChannel(channel) {
    console.log(`Deleting ${channel}`);
    document.getElementById(channel.toLowerCase()).remove();
    ipcRenderer.send('delete-channel', channel);
}

// When the page loads, ask the backend to check the streams
ipcRenderer.send('check-streams');

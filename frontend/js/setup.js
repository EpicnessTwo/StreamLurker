const { ipcRenderer } = require('electron');

function saveTwitchCredentials() {
    const clientId = document.getElementById('client_id').value;
    const clientSecret = document.getElementById('client_secret').value;

    if (!clientId || !clientSecret) {
        alert('Please enter a Client ID and Client Secret.');
        return;
    }

    ipcRenderer.send('save-twitch-credentials', clientId, clientSecret);
}

function openLink(a) {
    const href = a.getAttribute('data-href');
    ipcRenderer.send('open-link', href);
}

document.getElementById('submit').addEventListener('click', saveTwitchCredentials);
document.getElementById('help').addEventListener('click', () => {
    document.getElementById('setup_form').style.display = 'none';
    document.getElementById('setup_guide').style.display = 'block';
});
document.getElementById('back').addEventListener('click', () => {
    document.getElementById('setup_form').style.display = 'block';
    document.getElementById('setup_guide').style.display = 'none';
});

ipcRenderer.on('failed-credentials', () => {
    document.getElementById('apiError').classList.remove('hidden');
});

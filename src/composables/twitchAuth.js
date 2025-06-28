import { start, cancel, onUrl, onInvalidUrl } from '@fabianlars/tauri-plugin-oauth';

async function startOAuthFlow() {
    try {
        const port = await start();
        console.log(`OAuth server started on port ${port}`);

        // Set up listeners for OAuth results
        await onUrl((url) => {
            console.log('Received OAuth URL:', url);
            // Handle the OAuth redirect
        });

        // Initiate your OAuth flow here
        // ...

    } catch (error) {
        console.error('Error starting OAuth server:', error);
    }
}

// Don't forget to stop the server when you're done
async function stopOAuthServer() {
    try {
        await cancel(port);
        console.log('OAuth server stopped');
    } catch (error) {
        console.error('Error stopping OAuth server:', error);
    }
}
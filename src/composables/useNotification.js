import { sendNotification } from "@tauri-apps/plugin-notification";
import { useNotificationStore } from "./useNotificationStore.js";

import StreamUp from "../assets/sounds/stream_up.mp3";
import StreamDown from "../assets/sounds/stream_down.mp3";
import Predict from "../assets/sounds/predict.mp3";

export async function notify(title, body, icon = null, sound = null) {
    // Store notification in our local store
    const { addNotification } = useNotificationStore();
    
    // Determine notification type based on sound
    let type = 'info';
    switch (sound) {
        case 'up':
            type = 'live';
            break;
        case 'down':
            type = 'offline';
            break;
        case 'predict':
            type = 'predictive';
            break;
    }
    
    addNotification(title, body, icon, type);
    
    try {
        await sendNotification({
            title: title,
            body: body,
            icon: icon
        });
    } catch (error) {
        console.warn('Failed to send OS notification (expected in browser mode):', error.message);
        // Fall back to browser notification if possible
        if (typeof window !== 'undefined' && typeof window.Notification !== 'undefined' && window.Notification.permission === 'granted') {
            new window.Notification(title, { body, icon });
        }
    }

    try {
        switch (sound) {
            case 'up':
                if (typeof window !== 'undefined') {
                    await new window.Audio(StreamUp).play();
                }
                break;
            case 'down':
                if (typeof window !== 'undefined') {
                    await new window.Audio(StreamDown).play();
                }
                break;
            case 'predict':
                if (typeof window !== 'undefined') {
                    await new window.Audio(Predict).play();
                }
                break;
            default:
                break;
        }
    } catch (error) {
        console.error('Failed to play notification sound:', error);
    }
}
import { sendNotification } from "@tauri-apps/plugin-notification";
import { convertFileSrc } from '@tauri-apps/api/core';

import StreamUp from "../assets/sounds/stream_up.mp3";
import StreamDown from "../assets/sounds/stream_down.mp3";
import Predict from "../assets/sounds/predict.mp3";

export async function notify(title, body, icon = null, sound = null) {
    try {
        await sendNotification({
            title: title,
            body: body,
            icon: icon
        });
    } catch (error) {
        console.error('Failed to send notification:', error);
    }

    try {
        let audioSrc = null;
        
        // Check if sound is a file path (custom sound) or a default sound identifier
        if (typeof sound === 'string') {
            if (sound.includes('/') || sound.includes('\\')) {
                // This looks like a file path, convert it for Tauri
                audioSrc = convertFileSrc(sound);
            } else {
                // This is a default sound identifier
                switch (sound) {
                    case 'up':
                        audioSrc = StreamUp;
                        break;
                    case 'down':
                        audioSrc = StreamDown;
                        break;
                    case 'predict':
                        audioSrc = Predict;
                        break;
                    default:
                        break;
                }
            }
        }
        
        if (audioSrc) {
            await new Audio(audioSrc).play();
        }
    } catch (error) {
        console.error('Failed to play notification sound:', error);
    }
}
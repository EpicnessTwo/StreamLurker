import { sendNotification } from "@tauri-apps/plugin-notification";

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
        switch (sound) {
            case 'up':
                await new Audio(StreamUp).play();
                break;
            case 'down':
                await new Audio(StreamDown).play();
                break;
            case 'predict':
                await new Audio(Predict).play();
                break;
            default:
                break;
        }
    } catch (error) {
        console.error('Failed to play notification sound:', error);
    }
}
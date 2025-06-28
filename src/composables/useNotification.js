import { sendNotification } from "@tauri-apps/plugin-notification";

export async function notify(title, body, icon = null) {
    try {
        await sendNotification({
            title: title,
            body: body,
            icon: icon
        });
    } catch (error) {
        console.error('Failed to send notification:', error);
    }
}
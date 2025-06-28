import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";

export async function autostart(state) {
    try {
        if (state) {
            await enable();
            console.log("Autostart enabled.");
        } else {
            await disable();
            console.log("Autostart disabled.");
        }
    } catch (error) {
        console.error("Failed to change autostart state:", error);
    }
}
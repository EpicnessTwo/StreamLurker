import { TrayIcon} from "@tauri-apps/api/tray";
import { defaultWindowIcon } from "@tauri-apps/api/app";
import { Menu } from "@tauri-apps/api/menu/menu";
import { invoke } from "@tauri-apps/api/core";

export async function createTray() {
    try {
        const menu = await Menu.new({
            items: [
                {
                    id: 'quit',
                    text: 'Quit',
                    action: actionQuit
                },
            ],
        });

        const options = {
            icon: await defaultWindowIcon(),
            menu,
            menuOnLeftClick: true,
        };

        const tray = await TrayIcon.new(options);
        console.log("Tray icon created successfully.");
        return tray;
    } catch (error) {
        console.error("Failed to create tray icon:", error);
        throw error;
    }
}

function actionQuit() {
    invoke('action_quit')
}
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{
    Manager,
    command,
    Emitter,
    Window,
    menu::{
        Menu,
        MenuItem
    },
    tray::{
        TrayIconBuilder,
        TrayIconEvent,
        MouseButton,
        MouseButtonState
    }
};
use tauri_plugin_oauth::start;

#[command]
async fn start_server(window: Window) -> Result<u16, String> {
    start(move |url| {
        // Because of the unprotected localhost port, you must verify the URL here.
        // Preferebly send back only the token, or nothing at all if you can handle everything else in Rust.
        let _ = window.emit("redirect_uri", url);
    })
        .map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app.get_webview_window("main").expect("no main window").set_focus();
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec![])))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            start_server,
        ])
        .setup(|app| {
            let menu_vanity = MenuItem::with_id(app, "vanity", "StreamLurker", false, None::<&str>)?;
            let menu_repo = MenuItem::with_id(app, "repo", "Open Repository", true, None::<&str>)?;
            let menu_issues = MenuItem::with_id(app, "issues", "Issue Tracker", true, None::<&str>)?;
            let menu_quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu_spacer = MenuItem::with_id(app, "spacer", "", false, None::<&str>)?;

            let menu = Menu::with_items(app, &[
                &menu_vanity,
                &menu_repo,
                &menu_issues,
                &menu_spacer,
                &menu_quit,
            ])?;

            TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        let _ = app.exit(0);
                    }
                    "repo" => {
                        tauri_plugin_opener::open_url("https://github.com/EpicnessTwo/StreamLurker", None::<&str>)
                            .expect("Could not open URL");
                    }
                    "issues" => {
                        tauri_plugin_opener::open_url("https://github.com/EpicnessTwo/StreamLurker/issues", None::<&str>)
                            .expect("Could not open URL");
                    }
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

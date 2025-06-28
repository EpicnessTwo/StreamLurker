import { createApp } from "vue";
import { createTray } from "./composables/useTray.js";
import Main from "./Main.vue";

// import { setConfig } from "./composables/useConfig";
//
// await setConfig('config', null)

// Tray Handling

await createTray().then((tray) => {

})

const app = createApp(Main)

const globalSettings = {
    twitchClientId: "26tu1jqk1j5gzn7hzhw71sjc5v9xtw",
}

app.provide('globalSettings', globalSettings);

app.mount("#app");

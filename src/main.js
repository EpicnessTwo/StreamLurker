import { createApp } from "vue";
import Main from "./Main.vue";

// import { setConfig } from "./composables/useConfig";
//
// await setConfig('config', null)

const app = createApp(Main)

const globalSettings = {
    twitchClientId: "26tu1jqk1j5gzn7hzhw71sjc5v9xtw",
}

app.provide('globalSettings', globalSettings);

app.mount("#app");

import { load } from '@tauri-apps/plugin-store';

let store = null;

async function initStore() {
  store = await load('store.json');
}

export async function getConfig(key) {
  if (!store) await initStore();
  return await store.get(key) || null;
}

export async function setConfig(key, value) {
  if (!store) await initStore();
  return store.set(key, value);
}

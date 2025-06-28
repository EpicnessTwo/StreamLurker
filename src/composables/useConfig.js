import { load } from '@tauri-apps/plugin-store';

const store = await load('store.json');

export async function getConfig(key) {
  return await store.get(key) || null;
}

export function setConfig(key, value) {
  return store.set(key, value);
}
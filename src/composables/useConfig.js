import { load } from '@tauri-apps/plugin-store';

let store = null;

// Mock store for browser development
const mockStore = {
  data: {},
  async get(key) {
    return this.data[key] || null;
  },
  async set(key, value) {
    this.data[key] = value;
  }
};

async function initStore() {
  try {
    // Try to use Tauri store
    store = await load('store.json');
  } catch {
    console.warn('Tauri store not available, using mock store for development');
    store = mockStore;
  }
}

export async function getConfig(key) {
  if (!store) await initStore();
  return await store.get(key) || null;
}

export async function setConfig(key, value) {
  if (!store) await initStore();
  store.set(key, value);

  return store.get(key);
}

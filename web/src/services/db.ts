import { openDB, type IDBPDatabase } from 'idb';
import type { Slot } from '@/schemas/user';

const DB_NAME = 'svitlosk_db';
const DB_VERSION = 1;

export interface AppDatabase {
  settings: {
    key: string;
    value: any;
  };
  slots: Slot;
}

let dbPromise: Promise<IDBPDatabase<any>>;

export const initDB = () => {
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for general settings (theme, start group, etc.)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
      // Store for subscription slots
      if (!db.objectStoreNames.contains('slots')) {
        db.createObjectStore('slots', { keyPath: 'id' });
      }
    },
  });
};

export const db = {
  async getSetting<T>(key: string): Promise<T | undefined> {
    const d = await dbPromise;
    return d.get('settings', key);
  },
  async setSetting(key: string, value: any) {
    const d = await dbPromise;
    return d.put('settings', value, key);
  },
  async getAllSlots(): Promise<Slot[]> {
    const d = await dbPromise;
    return d.getAll('slots');
  },
  async saveSlot(slot: Slot) {
    const d = await dbPromise;
    return d.put('slots', slot);
  },
  async deleteSlot(id: string) {
    const d = await dbPromise;
    return d.delete('slots', id);
  }
};

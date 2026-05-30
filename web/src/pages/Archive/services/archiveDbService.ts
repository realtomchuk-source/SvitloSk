import { openDB, type IDBPDatabase } from 'idb';
import type { ArchivedDay } from '../types/archive';

const DB_NAME = 'svitlosk_archive_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

export const initArchiveDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('daily_schedules')) {
        db.createObjectStore('daily_schedules', { keyPath: 'date' });
      }
    },
  });

  return dbPromise;
};

export const archiveDb = {
  async saveDay(day: ArchivedDay): Promise<string> {
    const db = await initArchiveDB();
    return db.put('daily_schedules', day);
  },

  async getDay(date: string): Promise<ArchivedDay | undefined> {
    const db = await initArchiveDB();
    return db.get('daily_schedules', date);
  },

  async getAllDates(): Promise<string[]> {
    const db = await initArchiveDB();
    return db.getAllKeys('daily_schedules') as Promise<string[]>;
  },

  async deleteDay(date: string): Promise<void> {
    const db = await initArchiveDB();
    return db.delete('daily_schedules', date);
  },

  async importDays(days: ArchivedDay[]): Promise<void> {
    const db = await initArchiveDB();
    const tx = db.transaction('daily_schedules', 'readwrite');
    const store = tx.objectStore('daily_schedules');
    for (const day of days) {
      await store.put(day);
    }
    await tx.done;
  }
};

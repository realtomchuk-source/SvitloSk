import { db } from './db';
import type { Slot, UserConfig } from '@/schemas/user';

export const migrateFromLocalStorage = async () => {
  const isMigrated = localStorage.getItem('sssk_migrated_to_idb');
  if (isMigrated) return;

  console.log('[Migration] Starting migration from LocalStorage to IndexedDB...');

  // 1. Migrate Start Group
  const startGroup = localStorage.getItem('sssk_start_group') || '1.1';
  
  // 2. Migrate DND
  const oldDnd = JSON.parse(localStorage.getItem('sssk_dnd_settings') || 'null');
  const dnd = {
    active: oldDnd?.active ?? true,
    start: oldDnd?.start ?? '22:00',
    end: oldDnd?.end ?? '08:00',
  };

  // 3. Migrate Slots (Subscriptions)
  const oldSubs = JSON.parse(localStorage.getItem('sssk_subscriptions') || '[]');
  if (Array.isArray(oldSubs)) {
    for (const sub of oldSubs) {
      if (sub && (sub.isActive || sub.active)) {
        const slot: Slot = {
          id: sub.id || crypto.randomUUID(),
          name: sub.locationName || sub.name || 'Локація',
          subGroup: sub.group || sub.subGroup || '1.1',
          notifyAdvance: sub.notifyTime || sub.notifyAdvance || 10,
          notify247: !(sub.dndEnabled ?? false),
          dndStart: sub.dndStart || '22:00',
          dndEnd: sub.dndEnd || '08:00',
          isActive: true,
        };
        await db.saveSlot(slot);
      }
    }
  }

  // Save final config
  const config: UserConfig = {
    startGroup,
    tomorrowPush: localStorage.getItem('sssk_tomorrow_push') === 'true',
    dnd,
  };
  await db.setSetting('userConfig', config);

  localStorage.setItem('sssk_migrated_to_idb', 'true');
  console.log('[Migration] Migration completed successfully.');
};

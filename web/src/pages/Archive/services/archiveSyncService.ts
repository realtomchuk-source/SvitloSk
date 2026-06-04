import { archiveDb } from './archiveDbService';
import type { ArchivedDay, QueueStats } from '../types/archive';
import type { Schedule } from '@/schemas/schedule';

export const saveScheduleToArchive = async (schedule: Schedule) => {
  try {
    const date = schedule.date;
    if (!date) return;

    // Check if the date is in the verified range or demo range
    const isDemoDate = ['2026-05-26', '2026-05-27', '2026-05-28'].includes(date);
    const isVerifiedDate = date >= '2026-05-29';
    if (!isDemoDate && !isVerifiedDate) {
      console.log(`Skipping saving schedule for date ${date} to archive - unverified.`);
      return;
    }

    const queues48: Record<string, string> = {};
    const stats: Record<string, QueueStats> = {};

    const GROUPS = [
      '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
      '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
    ];

    GROUPS.forEach(g => {
      const q24 = schedule.queues[g] || '1'.repeat(24);
      // Convert 24 hourly values to 48 half-hourly values by duplicating each character
      const q48 = q24.split('').map(char => char + char).join('');
      queues48[g] = q48;

      const hoursOn = q24.split('').filter(c => c === '1').length;
      stats[g] = {
        hoursOn,
        hoursOff: 24 - hoursOn
      };
    });

    const archivedDay: ArchivedDay = {
      date,
      queues: queues48,
      meta: {
        savedAt: new Date().toISOString(),
        source: 'parser',
        stats
      }
    };

    await archiveDb.saveDay(archivedDay);
    console.log(`Successfully saved schedule for ${date} to local archive DB.`);
  } catch (err) {
    console.warn('Failed to auto-save schedule to archive DB:', err);
  }
};

import { ScheduleSchema, type Schedule, type TimeInterval } from '@/schemas/schedule';

const OUTAGES_SK_BASE = 'https://raw.githubusercontent.com/realtomchuk-source/OutagesSk/main/data/gpv';

export const fetchSchedule = async (type: 'today' | 'tomorrow' = 'today'): Promise<Schedule | null> => {
  if (type === 'tomorrow') {
    // Try primary source from OutagesSk repository
    try {
      const remoteRes = await fetch(`${OUTAGES_SK_BASE}/tomorrow.json?t=${Date.now()}`);
      if (remoteRes.ok) {
        const rawRemote = await remoteRes.json();
        if (rawRemote.status !== 'waiting' && rawRemote.status !== 'pending' && rawRemote.queues) {
          const mode = Object.values(rawRemote.queues as Record<string, string>).some(q => q.includes('0'))
            ? 'schedule'
            : 'all_clear';
          return ScheduleSchema.parse({
            ...rawRemote,
            mode
          });
        }
        return null;
      }
    } catch (err) {
      console.warn('Failed to fetch tomorrow from OutagesSk primary source, trying local fallback:', err);
    }
  }

  const base = import.meta.env.BASE_URL;
  const response = await fetch(`${base}data/${type}.json?t=${Date.now()}`);
  if (!response.ok) {
    if (type === 'tomorrow') return null;
    throw new Error(`Failed to fetch ${type} schedule`);
  }
  const data = await response.json();
  if (type === 'tomorrow' && (data.status === 'pending' || data.status === 'waiting' || !data.queues)) {
    return null;
  }
  return ScheduleSchema.parse(data);
};

export const normalizeTo48 = (scheduleString: string): string => {
  if (!scheduleString) return '1'.repeat(48);
  if (scheduleString.length === 48) return scheduleString;
  if (scheduleString.length === 24) {
    return scheduleString.split('').map(c => c + c).join('');
  }
  return '1'.repeat(48);
};

export const convertToIntervals = (scheduleString: string): TimeInterval[] => {
  const s48 = normalizeTo48(scheduleString);
  const intervals: TimeInterval[] = [];
  let currentStatus: 'available' | 'unavailable' = s48[0] === '1' ? 'available' : 'unavailable';
  let startSlot = 0;

  const fmtTime = (slot: number) => {
    const h = Math.floor(slot / 2);
    const m = (slot % 2) * 30;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  for (let i = 1; i <= 48; i++) {
    const status: 'available' | 'unavailable' = (i < 48 && s48[i] === '1') ? 'available' : 'unavailable';
    if (i === 48 || status !== currentStatus) {
      intervals.push({
        start: fmtTime(startSlot),
        end: fmtTime(i),
        status: currentStatus
      });
      startSlot = i;
      currentStatus = status;
    }
  }
  return intervals;
};

/**
 * Calculates status and time until next change relative to a reference date.
 * Supports 48-slot (30-min intervals) schedule strings with fallback for 24-slot.
 */
export const getStatusInfo = (scheduleString: string, referenceDate?: Date) => {
  const s48 = normalizeTo48(scheduleString);
  const baseTime = referenceDate || new Date();
  const currentSlot = Math.min(47, Math.max(0, baseTime.getHours() * 2 + Math.floor(baseTime.getMinutes() / 30)));
  const isCurrentlyOn = s48[currentSlot] === '1';
  
  let nextChangeSlot = 48;
  for (let i = currentSlot + 1; i < 48; i++) {
    if ((s48[i] === '1') !== isCurrentlyOn) {
      nextChangeSlot = i;
      break;
    }
  }

  const nextChangeHour = Math.floor(nextChangeSlot / 2);
  const nextChangeMinute = (nextChangeSlot % 2) * 30;

  const nextTime = new Date(baseTime);
  nextTime.setHours(nextChangeHour, nextChangeMinute, 0, 0);
  
  // Calculate difference in minutes from the reference point
  const diffMs = nextTime.getTime() - baseTime.getTime();
  const minutesRemaining = Math.max(0, Math.floor(diffMs / 60000));

  const nextChangeFormatted = nextChangeSlot === 48 
    ? '24:00' 
    : `${String(nextChangeHour).padStart(2, '0')}:${String(nextChangeMinute).padStart(2, '0')}`;

  return {
    isCurrentlyOn,
    nextChangeHour,
    nextChangeMinute,
    nextChangeSlot,
    nextChangeFormatted,
    minutesRemaining,
    h: Math.floor(minutesRemaining / 60),
    m: minutesRemaining % 60
  };
};

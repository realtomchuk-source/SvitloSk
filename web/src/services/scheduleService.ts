import { ScheduleSchema, type Schedule, type TimeInterval } from '@/schemas/schedule';

export const fetchSchedule = async (type: 'today' | 'tomorrow' = 'today'): Promise<Schedule> => {
  const response = await fetch(`/data/${type}.json?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} schedule`);
  }
  const data = await response.json();
  return ScheduleSchema.parse(data);
};

export const convertToIntervals = (scheduleString: string): TimeInterval[] => {
  if (!scheduleString || scheduleString.length !== 24) {
    return [{ start: "00:00", end: "24:00", status: "unknown" }];
  }

  const intervals: TimeInterval[] = [];
  let currentStatus: 'available' | 'unavailable' = scheduleString[0] === '1' ? 'available' : 'unavailable';
  let startHour = 0;

  for (let i = 1; i <= 24; i++) {
    const status: 'available' | 'unavailable' = (i < 24 && scheduleString[i] === '1') ? 'available' : 'unavailable';
    if (i === 24 || status !== currentStatus) {
      intervals.push({
        start: `${String(startHour).padStart(2, '0')}:00`,
        end: `${String(i).padStart(2, '0')}:00`,
        status: currentStatus
      });
      startHour = i;
      currentStatus = status;
    }
  }
  return intervals;
};

/**
 * Calculates current status and time until next change
 */
export const getStatusInfo = (scheduleString: string) => {
  const now = new Date();
  const currentHour = now.getHours();
  const isCurrentlyOn = scheduleString[currentHour] === '1';
  
  let nextChangeHour = 24;
  for (let i = currentHour + 1; i < 24; i++) {
    if ((scheduleString[i] === '1') !== isCurrentlyOn) {
      nextChangeHour = i;
      break;
    }
  }

  const nextTime = new Date();
  nextTime.setHours(nextChangeHour, 0, 0, 0);
  const diffMs = nextTime.getTime() - now.getTime();
  const minutesRemaining = Math.max(0, Math.floor(diffMs / 60000));

  return {
    isCurrentlyOn,
    nextChangeHour,
    minutesRemaining,
    h: Math.floor(minutesRemaining / 60),
    m: minutesRemaining % 60
  };
};

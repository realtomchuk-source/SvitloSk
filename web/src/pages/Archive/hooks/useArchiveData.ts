import { useState, useEffect, useCallback } from 'react';
import { archiveDb, initArchiveDB } from '../services/archiveDbService';
import type { ArchivedDay, QueueStats } from '../types/archive';

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

/**
 * Calculates the maximum selectable archive date (Today - 2 days)
 * Returns date in YYYY-MM-DD format
 */
export const getArchiveThresholdDate = (currentDate: Date = new Date()): string => {
  const threshold = new Date(currentDate);
  threshold.setDate(threshold.getDate() - 2);
  
  const yyyy = threshold.getFullYear();
  const mm = String(threshold.getMonth() + 1).padStart(2, '0');
  const dd = String(threshold.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
};

export const useArchiveData = () => {
  const [savedDates, setSavedDates] = useState<string[]>([]);
  const [selectedDayData, setSelectedDayData] = useState<ArchivedDay | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const thresholdDate = getArchiveThresholdDate();

  // Helper to refresh the list of dates that have data
  const refreshSavedDates = useCallback(async () => {
    try {
      const dates = await archiveDb.getAllDates();
      setSavedDates(dates);
    } catch (err) {
      console.error('Failed to get archive dates:', err);
    }
  }, []);

  // Initialize DB and import pre-loaded JSON if empty (Variant 2)
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        await initArchiveDB();
        
        const existingDates = await archiveDb.getAllDates();
        if (existingDates.length === 0) {
          // Empty DB, pull initial static monthly file
          const base = import.meta.env.BASE_URL || '/';
          const response = await fetch(`${base}data/archive_init.json`);
          if (response.ok) {
            const data: ArchivedDay[] = await response.json();
            await archiveDb.importDays(data);
          }
        }
        await refreshSavedDates();
      } catch (err) {
        console.error('Failed to initialize archive database:', err);
        setError('Не вдалося ініціалізувати базу даних архіву');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [refreshSavedDates]);

  // Load schedule for a specific date (Local IndexedDB -> CDN fetch -> fallback empty)
  const loadDayData = useCallback(async (date: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const isDemo = ['2026-05-26', '2026-05-27', '2026-05-28'].includes(date);
      const isVerified = date >= '2026-05-29';
      if (!isDemo && !isVerified) {
        setSelectedDayData({ date, isUnverified: true });
        setIsLoading(false);
        return;
      }

      // 1. Try local cache
      let day: ArchivedDay | null = (await archiveDb.getDay(date)) || null;

      if (!day) {
        // 2. Try fetching static day JSON from server
        let response = null;
        try {
          const base = import.meta.env.BASE_URL || '/';
          response = await fetch(`${base}data/archive/${date}.json?t=${Date.now()}`);
        } catch (e) {
          console.warn('Failed to fetch schedule from server, using fallback', e);
        }
        
        if (response && response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const fetchedDay: ArchivedDay = await response.json();
              await archiveDb.saveDay(fetchedDay);
              day = fetchedDay;
              await refreshSavedDates();
            } catch (jsonErr) {
              console.warn('Failed to parse fetched JSON:', jsonErr);
            }
          } else {
            console.warn(`Server returned non-JSON response for date ${date} (content-type: ${contentType})`);
          }
        }

        // 3. Fallback: No schedule exists for this date, assume 24h stable power
        if (!day) {
          const emptyStats: Record<string, QueueStats> = {};
          const emptyQueues: Record<string, string> = {};
          
          GROUPS.forEach(g => {
            emptyQueues[g] = '1'.repeat(48); // Full electricity (48 half-hour slots)
            emptyStats[g] = { hoursOn: 24, hoursOff: 0 };
          });

          const fallbackDay: ArchivedDay = {
            date,
            queues: emptyQueues,
            meta: {
              savedAt: new Date().toISOString(),
              source: 'parser',
              stats: emptyStats
            }
          };
          day = fallbackDay;
        }
      }

      setSelectedDayData(day);
    } catch (err) {
      console.error('Error loading date data:', err);
      setError('Не вдалося завантажити дані для обраної дати');
      setSelectedDayData(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshSavedDates]);

  return {
    savedDates,
    selectedDayData,
    isLoading,
    isInitializing,
    error,
    thresholdDate,
    loadDayData,
    refreshSavedDates
  };
};

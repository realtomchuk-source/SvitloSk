import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Schedule } from '@/schemas/schedule';
import type { Slot, UserConfig } from '@/schemas/user';
import { db } from '@/services/db';

interface AppState {
  // Data State
  selectedGroup: string;
  scheduleData: Schedule | null;
  isLoading: boolean;
  error: string | null;
  
  // User State
  userConfig: UserConfig;
  slots: Slot[];

  // Actions
  setSelectedGroup: (group: string) => void;
  setScheduleData: (data: Schedule | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // User Actions
  updateUserConfig: (config: Partial<UserConfig>) => void;
  addSlot: (slot: Slot) => Promise<void>;
  updateSlot: (slot: Slot) => Promise<void>;
  deleteSlot: (id: string) => Promise<void>;
  loadUserData: () => Promise<void>;
}

const DEFAULT_CONFIG: UserConfig = {
  startGroup: '1.1',
  tomorrowPush: false,
  dnd: { active: true, start: '22:00', end: '08:00' }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedGroup: '1.1',
      scheduleData: null,
      isLoading: false,
      error: null,
      userConfig: DEFAULT_CONFIG,
      slots: [],

      setSelectedGroup: (group) => set({ selectedGroup: group }),
      setScheduleData: (data) => set({ scheduleData: data }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error: error }),

      updateUserConfig: async (newConfig) => {
        const updated = { ...get().userConfig, ...newConfig };
        set({ userConfig: updated });
        await db.setSetting('userConfig', updated);
      },

      addSlot: async (slot) => {
        await db.saveSlot(slot);
        set({ slots: [...get().slots, slot] });
      },

      updateSlot: async (slot) => {
        await db.saveSlot(slot);
        set({ slots: get().slots.map(s => s.id === slot.id ? slot : s) });
      },

      deleteSlot: async (id) => {
        await db.deleteSlot(id);
        set({ slots: get().slots.filter(s => s.id !== id) });
      },

      loadUserData: async () => {
        const config = await db.getSetting<UserConfig>('userConfig');
        const slots = await db.getAllSlots();
        set({ 
          userConfig: config || DEFAULT_CONFIG,
          slots: slots || [],
          selectedGroup: config?.startGroup || get().selectedGroup 
        });
      }
    }),
    {
      name: 'sssk-storage',
      partialize: (state) => ({ selectedGroup: state.selectedGroup }),
    }
  )
);

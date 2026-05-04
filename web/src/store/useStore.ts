import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Schedule } from '@/schemas/schedule';
import type { Slot, UserConfig } from '@/schemas/user';
import { db } from '@/services/db';
import { supabase } from '@/services/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface AppState {
  // Data State
  selectedGroup: string;
  scheduleData: Schedule | null;
  isLoading: boolean;
  error: string | null;
  
  // User State
  user: User | null;
  userConfig: UserConfig;
  isAuthLoading: boolean;
  slots: Slot[];

  // Actions
  setSelectedGroup: (group: string) => void;
  setScheduleData: (data: Schedule | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // User Actions
  initAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUserConfig: (config: Partial<UserConfig>) => Promise<void>;
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

const EMPTY_SLOTS: Slot[] = [
  { id: '1', name: '', subGroup: '', notifyAdvance: 10, notify247: true, dndStart: '22:00', dndEnd: '08:00', isActive: false },
  { id: '2', name: '', subGroup: '', notifyAdvance: 10, notify247: true, dndStart: '22:00', dndEnd: '08:00', isActive: false },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedGroup: '1.1',
      scheduleData: null,
      isLoading: false,
      error: null,
      user: null,
      userConfig: DEFAULT_CONFIG,
      isAuthLoading: true,
      slots: EMPTY_SLOTS,

      setSelectedGroup: (group) => set({ selectedGroup: group }),
      setScheduleData: (data) => set({ scheduleData: data }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error: error }),

      initAuth: async () => {
        // Capture code immediately from URL before Router mangles it
        const params = new URLSearchParams(window.location.search);
        const hasCode = params.has('code');
        
        if (hasCode) {
            set({ isAuthLoading: true });
        } else {
            // Check session to decide if we need to show loading
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                set({ isAuthLoading: false });
            }
        }

        // Set up listener
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth event:', event, !!session);
          localStorage.setItem('sssk_last_auth_event', `${event} at ${new Date().toLocaleTimeString()}`);
          
          if (session?.user) {
            set({ user: session.user, isAuthLoading: false });
            
            // Sync profiles
            const { data } = await supabase
              .from('user_profiles')
              .select('start_group, tomorrow_push')
              .eq('id', session.user.id)
              .single();
              
            if (data) {
              const remoteConfig = {
                ...get().userConfig,
                startGroup: data.start_group || '1.1',
                tomorrowPush: data.tomorrow_push || false
              };
              set({ userConfig: remoteConfig, isAuthLoading: false });
              await db.setSetting('userConfig', remoteConfig);
            }

            // Redirect to cabinet if coming from OAuth
            if (window.location.search.includes('code=')) {
              window.location.hash = '#/cabinet';
            }
          } else if (event === 'INITIAL_SESSION' && !hasCode) {
            set({ user: null, isAuthLoading: false });
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthLoading: false });
          }
        });

        // Safety timeout for the "Instant Skip"
        setTimeout(() => {
          if (get().isAuthLoading) {
            set({ isAuthLoading: false });
          }
        }, 8000);
      },

      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            // Use EXACT string from Supabase Dashboard
            redirectTo: 'https://realtomchuk-source.github.io/SvitloSk/'
          }
        });
        if (error) console.error('Error signing in with Google', error);
      },

      updateUserConfig: async (newConfig) => {
        const updated = { ...get().userConfig, ...newConfig };
        set({ userConfig: updated });
        await db.setSetting('userConfig', updated);

        // Sync to Supabase if we have a user
        const { user } = get();
        if (user) {
          await supabase
            .from('user_profiles')
            .update({
              start_group: updated.startGroup,
              tomorrow_push: updated.tomorrowPush,
              last_active: new Date().toISOString()
            })
            .eq('id', user.id);
        }
      },

      addSlot: async (slot) => {
        await db.saveSlot(slot);
        const { user } = get();
        if (user) {
          await supabase.from('notification_slots').upsert({
            id: slot.id,
            user_id: user.id,
            data: slot,
            updated_at: new Date().toISOString()
          });
        }
        set({ slots: get().slots.map(s => s.id === slot.id ? slot : s) });
      },

      updateSlot: async (slot) => {
        await db.saveSlot(slot);
        const { user } = get();
        if (user) {
          await supabase.from('notification_slots').upsert({
            id: slot.id,
            user_id: user.id,
            data: slot,
            updated_at: new Date().toISOString()
          });
        }
        set({ slots: get().slots.map(s => s.id === slot.id ? slot : s) });
      },

      deleteSlot: async (id) => {
        // Instead of deleting, we reset it to empty
        const resetSlot = EMPTY_SLOTS.find(s => s.id === id) || EMPTY_SLOTS[0];
        await db.saveSlot(resetSlot);
        const { user } = get();
        if (user) {
          await supabase.from('notification_slots').upsert({
            id: resetSlot.id,
            user_id: user.id,
            data: resetSlot,
            updated_at: new Date().toISOString()
          });
        }
        set({ slots: get().slots.map(s => s.id === id ? resetSlot : s) });
      },

      loadUserData: async () => {
        const localConfig = await db.getSetting<UserConfig>('userConfig');
        const localSlots = await db.getAllSlots();
        
        const { user } = get();
        let currentSlots = [...EMPTY_SLOTS];

        if (user) {
          // 1. Load slots from Supabase
          const { data: remoteSlots } = await supabase
            .from('notification_slots')
            .select('id, data')
            .eq('user_id', user.id);
            
          if (remoteSlots && remoteSlots.length > 0) {
            // Merge remote slots into our fixed 1/2 structure
            remoteSlots.forEach(r => {
                const idx = currentSlots.findIndex(s => s.id === r.id);
                if (idx !== -1) currentSlots[idx] = r.data as Slot;
            });
            // Update local DB
            for (const s of currentSlots) await db.saveSlot(s);
          } else if (localSlots.length > 0) {
            // 2. Migration
            localSlots.forEach(s => {
                const idx = currentSlots.findIndex(cs => cs.id === s.id);
                if (idx !== -1) currentSlots[idx] = s;
            });
            for (const s of currentSlots) {
              await supabase.from('notification_slots').upsert({
                id: s.id,
                user_id: user.id,
                data: s,
                updated_at: new Date().toISOString()
              });
            }
          }
        } else if (localSlots.length > 0) {
           localSlots.forEach(s => {
                const idx = currentSlots.findIndex(cs => cs.id === s.id);
                if (idx !== -1) currentSlots[idx] = s;
            });
        }

        set({ 
          slots: currentSlots,
          userConfig: localConfig || DEFAULT_CONFIG,
          selectedGroup: localConfig?.startGroup || get().selectedGroup 
        });
      }
    }),
    {
      name: 'sssk-storage',
      partialize: (state) => ({ selectedGroup: state.selectedGroup }),
    }
  )
);


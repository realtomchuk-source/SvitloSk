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
      slots: [],

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

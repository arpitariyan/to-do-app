import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCK_KEY = '@nexus/app_lock_enabled';
const PIN_KEY = '@nexus/app_lock_pin';

interface AppLockState {
  lockEnabled: boolean;
  isLocked: boolean;
  pin: string | null;

  // Initialization
  initializeLock: () => Promise<void>;

  // Actions
  enableLock: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  unlock: () => void;
  lock: () => void;
  verifyPin: (input: string) => boolean;
}

export const useAppLockStore = create<AppLockState>((set, get) => ({
  lockEnabled: false,
  isLocked: false,
  pin: null,

  initializeLock: async () => {
    try {
      const [enabled, pin] = await Promise.all([
        AsyncStorage.getItem(LOCK_KEY),
        AsyncStorage.getItem(PIN_KEY),
      ]);
      const lockEnabled = enabled === 'true';
      set({ lockEnabled, pin, isLocked: lockEnabled });
    } catch {
      set({ lockEnabled: false, pin: null, isLocked: false });
    }
  },

  enableLock: async (pin: string) => {
    await Promise.all([
      AsyncStorage.setItem(LOCK_KEY, 'true'),
      AsyncStorage.setItem(PIN_KEY, pin),
    ]);
    set({ lockEnabled: true, pin, isLocked: false });
  },

  disableLock: async () => {
    await Promise.all([
      AsyncStorage.removeItem(LOCK_KEY),
      AsyncStorage.removeItem(PIN_KEY),
    ]);
    set({ lockEnabled: false, pin: null, isLocked: false });
  },

  unlock: () => set({ isLocked: false }),

  lock: () => {
    const { lockEnabled } = get();
    if (lockEnabled) set({ isLocked: true });
  },

  verifyPin: (input: string) => {
    const { pin } = get();
    return pin === input;
  },
}));

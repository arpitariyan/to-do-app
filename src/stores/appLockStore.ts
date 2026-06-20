import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const LOCK_KEY = 'nexus.app_lock_enabled';
const PIN_KEY = 'nexus.app_lock_pin';
const BIO_KEY = 'nexus.app_lock_bio_enabled';

interface AppLockState {
  lockEnabled: boolean;
  biometricEnabled: boolean;
  isLocked: boolean;
  pin: string | null;

  // Initialization
  initializeLock: () => Promise<void>;

  // Actions
  enableLock: (pin: string, useBiometrics: boolean) => Promise<void>;
  toggleBiometrics: (useBiometrics: boolean) => Promise<void>;
  disableLock: () => Promise<void>;
  unlock: () => void;
  lock: () => void;
  verifyPin: (input: string) => boolean;
}

export const useAppLockStore = create<AppLockState>((set, get) => ({
  lockEnabled: false,
  biometricEnabled: false,
  isLocked: false,
  pin: null,

  initializeLock: async () => {
    try {
      const [enabled, pin, bioEnabled] = await Promise.all([
        SecureStore.getItemAsync(LOCK_KEY),
        SecureStore.getItemAsync(PIN_KEY),
        SecureStore.getItemAsync(BIO_KEY),
      ]);
      const lockEnabled = enabled === 'true';
      set({ 
        lockEnabled, 
        biometricEnabled: bioEnabled === 'true',
        pin, 
        isLocked: lockEnabled 
      });
    } catch {
      set({ lockEnabled: false, biometricEnabled: false, pin: null, isLocked: false });
    }
  },

  enableLock: async (pin: string, useBiometrics: boolean) => {
    await Promise.all([
      SecureStore.setItemAsync(LOCK_KEY, 'true'),
      SecureStore.setItemAsync(PIN_KEY, pin),
      SecureStore.setItemAsync(BIO_KEY, useBiometrics ? 'true' : 'false'),
    ]);
    set({ lockEnabled: true, biometricEnabled: useBiometrics, pin, isLocked: false });
  },

  toggleBiometrics: async (useBiometrics: boolean) => {
    await SecureStore.setItemAsync(BIO_KEY, useBiometrics ? 'true' : 'false');
    set({ biometricEnabled: useBiometrics });
  },

  disableLock: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(LOCK_KEY),
      SecureStore.deleteItemAsync(PIN_KEY),
      SecureStore.deleteItemAsync(BIO_KEY),
    ]);
    set({ lockEnabled: false, biometricEnabled: false, pin: null, isLocked: false });
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

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette, lightPalette, type AccentColor } from './tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Colors {
  bg0: string;
  bg1: string;
  bg2: string;
  bg3: string;
  border: string;
  borderLight: string;
  accent: string;
  accentSoft: string;
  accentMid: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  info: string;
  infoSoft: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  priorityNone: string;
  white: string;
  black: string;
  transparent: string;
}

export interface ThemeContextValue {
  colors: Colors;
  isDark: boolean;
  mode: ThemeMode;
  accentColor: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const THEME_MODE_KEY = '@nexus/theme_mode';
const ACCENT_COLOR_KEY = '@nexus/accent_color';
const DEFAULT_ACCENT: AccentColor = '#6C63FF';

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildColors(isDark: boolean, accent: string): Colors {
  const base = isDark ? palette : { ...palette, ...lightPalette };
  return {
    ...base,
    accent,
    accentSoft: `${accent}1E`,
    accentMid: `${accent}47`,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<AccentColor>(DEFAULT_ACCENT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedMode, savedAccent] = await Promise.all([
          AsyncStorage.getItem(THEME_MODE_KEY),
          AsyncStorage.getItem(ACCENT_COLOR_KEY),
        ]);
        if (savedMode) setModeState(savedMode as ThemeMode);
        if (savedAccent) setAccentColorState(savedAccent as AccentColor);
      } catch {
        // Use defaults on error
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem(THEME_MODE_KEY, newMode);
  }, []);

  const setAccentColor = useCallback(async (color: AccentColor) => {
    setAccentColorState(color);
    await AsyncStorage.setItem(ACCENT_COLOR_KEY, color);
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = buildColors(isDark, accentColor);

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, accentColor, setMode, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

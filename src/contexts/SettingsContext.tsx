/**
 * SettingsContext.tsx
 * Global reactive context for app preferences.
 * Also exports `useAppTheme()` — a one-liner hook that gives any screen the full theme palette.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  isLightBackground,
} from '../services/appSettings';

// ─── Theme object ─────────────────────────────────────────────────────────────

export interface AppTheme {
  bg: string;
  accent: string;
  isLight: boolean;
  /** Primary text */
  text: string;
  /** Secondary / subtitle text */
  textSub: string;
  /** Muted / hint text */
  textMuted: string;
  /** Card / panel background */
  cardBg: string;
  /** Card border */
  cardBorder: string;
  /** Row divider */
  divider: string;
  /** Section label color */
  labelColor: string;
  /** Icon background (subtle) */
  iconBg: string;
  /** Status bar style */
  statusBar: 'light-content' | 'dark-content';
}

function buildTheme(settings: AppSettings): AppTheme {
  const isLight = isLightBackground(settings.backgroundColor);
  return {
    bg: settings.backgroundColor,
    accent: settings.accentColor,
    isLight,
    text: isLight ? '#111111' : '#ffffff',
    textSub: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)',
    textMuted: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
    cardBg: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
    cardBorder: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)',
    divider: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',
    labelColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
    iconBg: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
    statusBar: isLight ? 'dark-content' : 'light-content',
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SettingsContextType {
  settings: AppSettings;
  theme: AppTheme;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<AppTheme>(buildTheme(DEFAULT_SETTINGS));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setTheme(buildTheme(s));
      setLoading(false);
    });
  }, []);

  const updateSettings = async (patch: Partial<AppSettings>) => {
    const next = await saveSettings(patch);
    setSettings(next);
    setTheme(buildTheme(next));
  };

  return (
    <SettingsContext.Provider value={{ settings, theme, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

/** Convenience hook — returns only the theme object */
export function useAppTheme(): AppTheme {
  return useSettings().theme;
}

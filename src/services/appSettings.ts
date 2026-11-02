/**
 * appSettings.ts
 * Persistent user preferences stored via SecureStore / localStorage.
 */

import * as Storage from '../utils/storage';

export type VideoQuality = 'auto' | '1080p' | '720p' | '480p' | '360p';
export type AppLanguage = 'es' | 'en' | 'pt';
export type AccentColor = '#e50914' | '#f97316' | '#3b82f6' | '#10b981' | '#8b5cf6' | '#ec4899';

// Dark and light background options
export type BackgroundColor =
  // Dark
  | '#0d0d0d' | '#000000' | '#0f172a' | '#111827' | '#1a0a00' | '#0a0a1a'
  // Light
  | '#ffffff' | '#f3f4f6' | '#fef9f0' | '#e0f2fe' | '#f0fdf4' | '#fdf4ff';

/** Returns true if the given hex background color is "light" (luminance > 0.4) */
export function isLightBackground(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  // Perceived luminance
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4;
}

export interface AppSettings {
  videoQuality: VideoQuality;
  subtitlesAuto: boolean;
  appLanguage: AppLanguage;
  accentColor: AccentColor;
  backgroundColor: BackgroundColor;
  autoplayNext: boolean;
  miniPlayerEnabled: boolean;
  notifyNewContent: boolean;
  notifyRecommendations: boolean;
  notifyAppUpdates: boolean;
}

const STORAGE_KEY = 'app_settings_v2';

export const DEFAULT_SETTINGS: AppSettings = {
  videoQuality: 'auto',
  subtitlesAuto: false,
  appLanguage: 'es',
  accentColor: '#e50914',
  backgroundColor: '#0d0d0d',
  autoplayNext: true,
  miniPlayerEnabled: true,
  notifyNewContent: true,
  notifyRecommendations: false,
  notifyAppUpdates: true,
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await Storage.getItemAsync(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('appSettings: error loading', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const current = await loadSettings();
    const next = { ...current, ...patch };
    await Storage.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch (e) {
    console.warn('appSettings: error saving', e);
    return DEFAULT_SETTINGS;
  }
}

export async function resetSettings(): Promise<AppSettings> {
  await Storage.setItemAsync(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  return { ...DEFAULT_SETTINGS };
}

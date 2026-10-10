/**
 * Nuba TV Design System – Color Tokens
 * Industry standard premium streaming UI colors.
 */

export const DARK = {
  // Backgrounds
  bgBase:       '#080808',   // Match web --bg-base
  bgPanel:      '#0a0502',   // Match web --bg-panel
  bgCard:       '#1a100a',   // Slightly lighter than panel

  // Text
  textPrimary:  '#ffffff',   // Pure white
  textSecondary:'rgba(255, 255, 255, 0.5)',   // Match web --text-muted
  textAccent:   '#ffb703',   // Amber brilliant

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.1)', // Translucent white border

  // Accent / Brand
  accent:       '#ffb703',   // Web --tv-cyan equivalent (Amber)
  accentGlow:   'rgba(255, 183, 3, 0.2)',
};

export const LIGHT = {
  // Backgrounds
  bgBase:       '#e5e7eb',   // Soft gray (gray-200) instead of bright white
  bgPanel:      '#f3f4f6',   // Lighter gray for panels (gray-100)
  bgCard:       '#f9fafb',   // Card surface (gray-50)

  // Text
  textPrimary:  '#0f172a',   // Slate 900
  textSecondary:'#64748b',   // Slate 500
  textAccent:   '#b45309',   // Amber 700

  // Borders
  borderSubtle: 'rgba(0, 0, 0, 0.1)', // Translucent black border

  // Accent / Brand
  accent:       '#d97706',   // Amber 600
  accentGlow:   'rgba(217, 119, 6, 0.2)',
};

export type ThemeColors = typeof DARK;

export function useThemeColors(colorScheme: string | undefined | null): ThemeColors {
  // El tema por defecto es oscuro, ignoramos el tema del sistema (light).
  return DARK;
}

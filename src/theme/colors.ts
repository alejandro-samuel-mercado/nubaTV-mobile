/**
 * Nuba TV Design System – Color Tokens
 * Industry standard premium streaming UI colors.
 */

export const DARK = {
  // Backgrounds
  bgBase:       '#18181b',   // Zinc 900 (Soft dark gray, not pitch black)
  bgPanel:      '#27272a',   // Zinc 800
  bgCard:       '#3f3f46',   // Zinc 700

  // Text
  textPrimary:  '#f4f4f5',   // Zinc 50 (Very light gray)
  textSecondary:'#a1a1aa',   // Muted slate (Zinc 400)
  textAccent:   '#d4af37',   // Metallic gold

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.1)', // Translucent white border

  // Accent / Brand
  accent:       '#d4af37',   // Metallic gold
  accentGlow:   'rgba(212, 175, 55, 0.2)',
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

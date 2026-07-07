/**
 * Theme entry point.
 *
 * New code should use `useTheme()` for theme-aware (light/dark) colors.
 * The static `colors`/`shadow` exports below are a LIGHT-only legacy alias kept
 * so any not-yet-migrated module still compiles and renders correctly.
 */
export { spacing, radius, typography, makeShadows, lightPalette, darkPalette, palettes } from './tokens';
export type { Palette, ThemeName } from './tokens';
export { ThemeProvider, useTheme, useThemedStyles } from './ThemeProvider';
export type { Theme, ThemeMode } from './ThemeProvider';

import { lightPalette, makeShadows } from './tokens';

const p = lightPalette;
const s = makeShadows(p);

/** @deprecated Legacy light-only color map. Prefer `useTheme().colors`. */
export const colors = {
  primary: p.primary,
  primaryDark: p.primaryHover,
  primaryLight: '#60A5FA',
  accent: p.accent,
  gradientStart: p.gradientStart,
  gradientEnd: p.gradientEnd,
  bg: p.bg,
  card: p.surface,
  cardAlt: p.surfaceAlt,
  border: p.border,
  divider: p.border,
  text: p.text,
  textMuted: p.textMuted,
  textSubtle: p.textSubtle,
  textOnPrimary: p.onPrimary,
  success: p.success,
  successBg: p.successSoft,
  warning: p.warning,
  warningBg: p.warningSoft,
  danger: p.danger,
  dangerBg: p.dangerSoft,
  info: p.info,
  infoBg: p.infoSoft,
  white: '#FFFFFF',
  black: '#000000',
  overlay: p.overlay,
  shadow: p.shadow,
};

/** @deprecated Legacy light-only shadows. Prefer `useTheme().shadows`. */
export const shadow = {
  card: s.sm,
  soft: s.xs,
  floating: s.brand,
};

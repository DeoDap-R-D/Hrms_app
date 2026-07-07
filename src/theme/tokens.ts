/**
 * Design tokens for the ShiftPro redesign.
 * Brand: Cream canvas (60%) · Bright Orange secondary (30%) · Cobalt Blue accent (10%).
 * Full light + dark parity. 8px spatial system.
 */

export type ThemeName = 'light' | 'dark';

export interface Palette {
  // surfaces
  bg: string;
  surface: string;
  surfaceAlt: string;
  elevated: string;
  border: string;
  borderStrong: string;
  // text
  text: string;
  textMuted: string;
  textSubtle: string;
  // brand (teal / emerald)
  primary: string;
  primaryHover: string;
  primarySoft: string;
  onPrimary: string;
  gradientStart: string;
  gradientEnd: string;
  // ink (dark navy CTA, e.g. Sign In) + purple accent
  ink: string;
  onInk: string;
  accent: string;
  accentSoft: string;
  // semantic
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  // misc
  overlay: string;
  shadow: string;
  skeleton: string;
  skeletonHighlight: string;
}

export const lightPalette: Palette = {
  // surfaces — warm cream canvas (60%)
  bg: '#F4EEDF',
  surface: '#FFFDF8',
  surfaceAlt: '#EFE7D5',
  elevated: '#FFFFFF',
  border: '#E6DCC6',
  borderStrong: '#D6C9AC',
  // text — deep cobalt-charcoal ink
  text: '#1E3247',
  textMuted: '#5E6E7B',
  textSubtle: '#9AA4AD',
  // primary — Cobalt Blue (10% accent)
  primary: '#1E3D59',
  primaryHover: '#16304A',
  primarySoft: '#DCE6EE',
  onPrimary: '#FFFFFF',
  gradientStart: '#2A5476',
  gradientEnd: '#1E3D59',
  // ink CTA = cobalt
  ink: '#1E3D59',
  onInk: '#FFFFFF',
  // accent — Bright Orange (30% secondary)
  accent: '#FF6E40',
  accentSoft: '#FFE2D6',
  // semantic
  success: '#1F9D6A',
  successSoft: '#D8F1E6',
  warning: '#E59324',
  warningSoft: '#FBEBD1',
  danger: '#E04848',
  dangerSoft: '#FBDEDE',
  info: '#1E3D59',
  infoSoft: '#DCE6EE',
  // misc
  overlay: 'rgba(20, 35, 48, 0.45)',
  shadow: '#3A2E18',
  skeleton: '#ECE3D0',
  skeletonHighlight: '#F7F0E0',
};

export const darkPalette: Palette = {
  // surfaces — deep cobalt-charcoal
  bg: '#13212C',
  surface: '#1C2E3B',
  surfaceAlt: '#24394A',
  elevated: '#203342',
  border: '#2E4456',
  borderStrong: '#3D5A72',
  text: '#ECF1F5',
  textMuted: '#A6B5C2',
  textSubtle: '#6E8190',
  primary: '#4A82AD',
  primaryHover: '#5E96C0',
  primarySoft: '#1F374A',
  onPrimary: '#FFFFFF',
  gradientStart: '#24506F',
  gradientEnd: '#152A3A',
  ink: '#ECF1F5',
  onInk: '#13212C',
  accent: '#FF7E54',
  accentSoft: '#3C2519',
  success: '#33B883',
  successSoft: '#123528',
  warning: '#E9A23C',
  warningSoft: '#33260F',
  danger: '#F06A6A',
  dangerSoft: '#34181A',
  info: '#4A82AD',
  infoSoft: '#1F374A',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  skeleton: '#24394A',
  skeletonHighlight: '#2E4658',
};

/** 8px spatial system (4 is a half-step). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
  s12: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.4 },
  h2: { fontSize: 21, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.2 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.1 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyMd: { fontSize: 15, lineHeight: 22, fontWeight: '500' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 0.8 },
};

/**
 * Responsive token builders — scale the base spacing / radius / typography by a
 * factor `k` (from the device width). Used by ThemeProvider so every themed
 * screen adapts to small phones, large phones and tablets, and recomputes on
 * rotation. `k === 1` returns the exact base values (typical phones unchanged).
 */
const rnd = (n: number, k: number) => Math.round(n * k);

export function makeSpacing(k: number): typeof spacing {
  return {
    xs: rnd(4, k), sm: rnd(8, k), md: rnd(12, k), lg: rnd(16, k),
    xl: rnd(20, k), xxl: rnd(24, k), xxxl: rnd(32, k), huge: rnd(40, k),
    s1: rnd(4, k), s2: rnd(8, k), s3: rnd(12, k), s4: rnd(16, k),
    s5: rnd(20, k), s6: rnd(24, k), s8: rnd(32, k), s10: rnd(40, k), s12: rnd(48, k),
  };
}

export function makeRadius(k: number): typeof radius {
  return { sm: rnd(10, k), md: rnd(14, k), lg: rnd(20, k), xl: rnd(28, k), pill: 999 };
}

export function makeTypography(k: number): typeof typography {
  const f = (n: number) => rnd(n, k);
  return {
    display: { fontSize: f(32), lineHeight: f(38), fontWeight: '800' as const, letterSpacing: -0.5 },
    h1: { fontSize: f(26), lineHeight: f(32), fontWeight: '700' as const, letterSpacing: -0.4 },
    h2: { fontSize: f(21), lineHeight: f(28), fontWeight: '700' as const, letterSpacing: -0.3 },
    h3: { fontSize: f(17), lineHeight: f(24), fontWeight: '600' as const, letterSpacing: -0.2 },
    title: { fontSize: f(16), lineHeight: f(22), fontWeight: '600' as const, letterSpacing: -0.1 },
    body: { fontSize: f(15), lineHeight: f(22), fontWeight: '400' as const },
    bodyMd: { fontSize: f(15), lineHeight: f(22), fontWeight: '500' as const },
    small: { fontSize: f(13), lineHeight: f(18), fontWeight: '500' as const },
    caption: { fontSize: f(12), lineHeight: f(16), fontWeight: '600' as const },
    overline: { fontSize: f(11), lineHeight: f(14), fontWeight: '700' as const, letterSpacing: 0.8 },
  };
}

/** Elevation presets generated per-theme (shadow color differs). */
export function makeShadows(p: Palette) {
  const c = p.shadow;
  const dark = p.bg === darkPalette.bg;
  const op = (light: number, darkOp: number) => (dark ? darkOp : light);
  return {
    xs: {
      shadowColor: c,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: op(0.05, 0.4),
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: c,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: op(0.07, 0.45),
      shadowRadius: 8,
      elevation: 3,
    },
    md: {
      shadowColor: c,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: op(0.1, 0.5),
      shadowRadius: 16,
      elevation: 7,
    },
    lg: {
      shadowColor: c,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: op(0.14, 0.55),
      shadowRadius: 28,
      elevation: 14,
    },
    brand: {
      shadowColor: p.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: op(0.28, 0.5),
      shadowRadius: 16,
      elevation: 8,
    },
    accent: {
      shadowColor: p.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: op(0.34, 0.5),
      shadowRadius: 16,
      elevation: 8,
    },
  };
}

export const palettes: Record<ThemeName, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};

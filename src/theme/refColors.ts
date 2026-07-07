/**
 * Reference design palette — the exact colours used by the Home, Attendance,
 * Leave and Profile screens (and the bottom tab bar) so the app matches the
 * approved reference screenshots pixel-for-pixel. These are intentionally kept
 * separate from the themed `tokens.ts` palette, which drives the older screens.
 */
export const ref = {
  // Brand blue (header / profile banner / active tab)
  blue: '#2563EB',
  blueDark: '#1E52C8',
  blueTint: '#E7EEFF',

  // Surfaces
  pageBg: '#F3F4F6',
  card: '#FFFFFF',
  border: '#EEF0F4',

  // Text
  text: '#1F2430',
  textMuted: '#8A94A6',
  tabInactive: '#9AA0A6',

  // Stat / status colours
  green: '#22C55E',
  orange: '#F59E0B',
  red: '#EF4444',
  skyBlue: '#3B82F6',
  teal: '#14B8A6',
  amber: '#EAB308',

  // Soft icon-tile backgrounds (Profile info rows)
  blueSoft: '#E7EEFF',
  greenSoft: '#DCFCE7',
  amberSoft: '#FEF3C7',
  redSoft: '#FEE2E2',
} as const;

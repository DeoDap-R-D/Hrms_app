import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  lightPalette,
  makeShadows,
  makeSpacing,
  makeRadius,
  makeTypography,
  spacing,
  radius,
  typography,
  Palette,
  ThemeName,
} from './tokens';
import { uiScale } from '../utils/responsive';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: ThemeMode;
  scheme: ThemeName;
  isDark: boolean;
  colors: Palette;
  shadows: ReturnType<typeof makeShadows>;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

const noop = () => {};

/**
 * Light-only theme. Dark mode has been removed — the app always renders the
 * cream / cobalt / orange light palette. `isDark`/`setMode`/`toggle` are kept on
 * the Theme shape (as no-ops) so existing consumers continue to compile.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Responsive scale from the shorter side, so portrait↔landscape stays stable.
  const { width, height } = useWindowDimensions();
  const scale = uiScale(Math.min(width, height));

  const value = useMemo<Theme>(() => {
    const colors = lightPalette;
    return {
      mode: 'light',
      scheme: 'light',
      isDark: false,
      colors,
      shadows: makeShadows(colors),
      spacing: scale === 1 ? spacing : makeSpacing(scale),
      radius: scale === 1 ? radius : makeRadius(scale),
      typography: scale === 1 ? typography : makeTypography(scale),
      setMode: noop,
      toggle: noop,
    };
  }, [scale]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** Build StyleSheet-like styles from the active theme, memoized per scheme. */
export function useThemedStyles<T>(factory: (t: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

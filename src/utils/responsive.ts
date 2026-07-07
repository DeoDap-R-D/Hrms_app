import { useWindowDimensions } from 'react-native';

/**
 * Global UI scale factor from the available width. Typical phones (360–430dp)
 * return exactly 1 (no change); small phones scale down gently, tablets/large
 * screens scale up (capped). Used to size spacing, radius and type responsively.
 */
export function uiScale(width: number): number {
  if (width >= 360 && width <= 430) return 1;
  if (width < 360) return Math.max(0.86, width / 360);
  return Math.min(1.22, 1 + ((width - 430) / 430) * 0.4);
}

export interface Responsive {
  width: number;
  height: number;
  isTablet: boolean;
  isLarge: boolean;
  /** Suggested column count for action grids. */
  columns: number;
  /** Max content width for centered layouts on wide screens. */
  maxWidth: number;
  gutter: number;
}

/** Width-based responsive helper (phone / tablet / large). */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;
  const isLarge = width >= 840;
  return {
    width,
    height,
    isTablet,
    isLarge,
    columns: isLarge ? 6 : isTablet ? 4 : 3,
    maxWidth: isTablet ? 600 : width,
    gutter: isTablet ? 24 : 16,
  };
}

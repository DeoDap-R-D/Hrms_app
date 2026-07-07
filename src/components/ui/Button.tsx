import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import PressableScale from '../motion/PressableScale';
import Icon from './Icon';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconSet?: 'mci' | 'feather';
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

const HEIGHTS: Record<Size, number> = { sm: 42, md: 48, lg: 56 };
const FONTS: Record<Size, number> = { sm: 14, md: 15, lg: 16 };

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  icon,
  iconSet = 'mci',
  style,
  fullWidth = true,
}: ButtonProps) {
  const theme = useTheme();
  const { colors } = theme;
  const isDisabled = disabled || loading;
  const showDisabled = !!disabled && !loading;
  const fg = showDisabled ? colors.textSubtle : textColor(variant, theme);
  const height = HEIGHTS[size];

  const inner = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? (
            <Icon name={icon} set={iconSet} size={size === 'lg' ? 19 : 17} color={fg} style={styles.icon} />
          ) : null}
          <Text style={[styles.text, { color: fg, fontSize: FONTS[size] }]}>{title}</Text>
        </>
      )}
    </View>
  );

  const base: StyleProp<ViewStyle> = [
    styles.base,
    { height, borderRadius: theme.radius.md },
    fullWidth && styles.fullWidth,
    style,
  ];

  // Disabled → flat light grey, regardless of variant.
  if (showDisabled) {
    return (
      <PressableScale onPress={onPress} disabled style={[base, { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }]}>
        {inner}
      </PressableScale>
    );
  }

  // Filled gradient — Cobalt primary / red danger.
  if (variant === 'primary' || variant === 'danger') {
    const grad =
      variant === 'danger'
        ? [colors.danger, theme.isDark ? '#C53A3A' : '#B83232']
        : [colors.gradientStart, colors.gradientEnd];
    return (
      <PressableScale onPress={onPress} disabled={isDisabled} style={base}>
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fill, { borderRadius: theme.radius.md }, variant === 'primary' && theme.shadows.brand]}>
          {inner}
        </LinearGradient>
      </PressableScale>
    );
  }

  // Solid Bright Orange secondary.
  if (variant === 'secondary') {
    return (
      <PressableScale
        onPress={onPress}
        disabled={isDisabled}
        style={[base, { backgroundColor: colors.accent }, theme.shadows.accent]}>
        {inner}
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      style={[base, variantStyle(variant, theme)]}>
      {inner}
    </PressableScale>
  );
}

function variantStyle(variant: Variant, t: Theme): ViewStyle {
  switch (variant) {
    case 'outline':
      return { backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.primary };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    default:
      return {};
  }
}

function textColor(variant: Variant, t: Theme): string {
  switch (variant) {
    case 'primary':
    case 'danger':
    case 'secondary':
      return '#FFFFFF';
    case 'outline':
    case 'ghost':
      return t.colors.primary;
    default:
      return '#FFFFFF';
  }
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fullWidth: { width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  icon: { marginRight: 8 },
  text: { fontWeight: '700', letterSpacing: 0.1 },
});

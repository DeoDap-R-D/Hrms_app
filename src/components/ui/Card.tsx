import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import PressableScale from '../motion/PressableScale';
import { useTheme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
  elevation?: 'none' | 'xs' | 'sm' | 'md';
  bordered?: boolean;
}

export default function Card({
  children,
  style,
  onPress,
  padded = true,
  elevation = 'sm',
  bordered = true,
}: CardProps) {
  const { colors, radius, spacing, shadows } = useTheme();

  const cardStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.border,
    },
    elevation !== 'none' && shadows[elevation],
    padded && { padding: spacing.lg },
    style,
  ];

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={cardStyle}>
        {children}
      </PressableScale>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

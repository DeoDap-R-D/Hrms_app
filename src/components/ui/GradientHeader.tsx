import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import FocusAwareStatusBar from './FocusAwareStatusBar';
import { useTheme } from '../../theme';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children?: React.ReactNode;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function GradientHeader({
  title,
  subtitle,
  onBack,
  right,
  children,
  rounded = true,
  style,
}: GradientHeaderProps) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        },
        rounded && { borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
        style,
      ]}>
      <FocusAwareStatusBar barStyle="light-content" />
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={hitSlop}>
            <Icon name="chevron-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={{ marginLeft: spacing.sm }}>{right}</View> : null}
      </View>
      {children}
    </LinearGradient>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginRight: 8, marginLeft: -6 },
  titleWrap: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 21, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
});

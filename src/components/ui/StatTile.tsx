import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Icon from './Icon';
import { useTheme } from '../../theme';

interface StatTileProps {
  icon: string;
  label: string;
  value: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export default function StatTile({ icon, label, value, tone = 'primary', style }: StatTileProps) {
  const { colors, radius, spacing, shadows } = useTheme();
  const toneColor = colors[tone];
  const toneSoft =
    tone === 'success'
      ? colors.successSoft
      : tone === 'warning'
      ? colors.warningSoft
      : tone === 'danger'
      ? colors.dangerSoft
      : colors.primarySoft;

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderColor: colors.border },
        shadows.sm,
        style,
      ]}>
      <View style={[styles.iconChip, { backgroundColor: toneSoft, borderRadius: radius.md }]}>
        <Icon name={icon} size={20} color={toneColor} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, borderWidth: StyleSheet.hairlineWidth },
  iconChip: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 12, marginTop: 2, fontWeight: '500' },
});

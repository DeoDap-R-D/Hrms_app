import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Icon from './Icon';
import { useTheme } from '../../theme';

export interface Segment {
  label: string;
  value: string;
  icon?: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export default function SegmentedControl({ segments, value, onChange, style }: SegmentedControlProps) {
  const { colors, radius, spacing, shadows } = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4 },
        style,
      ]}>
      {segments.map(seg => {
        const active = seg.value === value;
        return (
          <TouchableOpacity
            key={seg.value}
            activeOpacity={0.8}
            onPress={() => onChange(seg.value)}
            style={[
              styles.seg,
              { borderRadius: radius.sm, paddingVertical: spacing.sm },
              active && { backgroundColor: colors.surface },
              active && shadows.xs,
            ]}>
            {seg.icon ? (
              <Icon name={seg.icon} size={16} color={active ? colors.primary : colors.textMuted} style={styles.icon} />
            ) : null}
            <Text style={[styles.label, { color: active ? colors.primary : colors.textMuted, fontWeight: active ? '700' : '500' }]}>
              {seg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row' },
  seg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: 6 },
  label: { fontSize: 13 },
});

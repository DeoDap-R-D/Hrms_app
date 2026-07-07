import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface BadgeProps {
  label: string;
  color: string;
  bg: string;
  dot?: boolean;
}

export default function Badge({ label, color, bg, dot }: BadgeProps) {
  const { radius } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: radius.pill }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
});

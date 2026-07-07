import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from './Icon';
import { useTheme } from '../../theme';
import type { ThemeMode } from '../../theme';

const OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { mode: 'dark', label: 'Dark', icon: 'weather-night' },
  { mode: 'system', label: 'Auto', icon: 'theme-light-dark' },
];

export default function ThemeToggle() {
  const { colors, radius, mode, setMode } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
      {OPTIONS.map(opt => {
        const active = mode === opt.mode;
        return (
          <TouchableOpacity
            key={opt.mode}
            activeOpacity={0.8}
            onPress={() => setMode(opt.mode)}
            style={[styles.opt, { borderRadius: radius.sm }, active && { backgroundColor: colors.surface }]}>
            <Icon name={opt.icon} size={18} color={active ? colors.primary : colors.textMuted} />
            <Text style={[styles.label, { color: active ? colors.primary : colors.textMuted, fontWeight: active ? '700' : '500' }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 4, gap: 4 },
  opt: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4 },
  label: { fontSize: 12 },
});

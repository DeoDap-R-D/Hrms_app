import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { useTheme } from '../../theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  tone?: 'default' | 'danger';
  children?: React.ReactNode;
}

export default function EmptyState({
  icon = 'inbox-outline',
  title,
  message,
  tone = 'default',
  children,
}: EmptyStateProps) {
  const { colors, spacing } = useTheme();
  const isDanger = tone === 'danger';
  const accent = isDanger ? colors.danger : colors.primary;
  const accentBg = isDanger ? colors.dangerSoft : colors.primarySoft;

  return (
    <View style={[styles.wrap, { paddingVertical: spacing.huge * 1.4 }]}>
      <View style={[styles.medallion, { backgroundColor: accentBg }]}>
        <Icon name={icon} size={38} color={accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  medallion: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center', letterSpacing: -0.2 },
  message: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 300 },
  actions: { marginTop: 22, width: '75%' },
});

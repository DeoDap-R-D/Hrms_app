import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface LoadingProps {
  message?: string;
  fullscreen?: boolean;
}

export default function Loading({ message, fullscreen = true }: LoadingProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, fullscreen && { flex: 1, backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={[styles.text, { color: colors.textMuted }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  text: { marginTop: 12, fontSize: 14 },
});

import React, { useEffect, useState } from 'react';
import { Text, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';
import { initials } from '../../utils/format';

interface AvatarProps {
  name?: string;
  uri?: string | null;
  size?: number;
  border?: boolean;
}

export default function Avatar({ name, uri, size = 48, border }: AvatarProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size, borderRadius: size / 2 };
  const borderStyle = border
    ? { borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' }
    : undefined;

  // Reset the error flag if a new image URL comes in.
  useEffect(() => setFailed(false), [uri]);

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[dim, borderStyle]}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[dim, styles.center, borderStyle]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontWeight: '700' },
});

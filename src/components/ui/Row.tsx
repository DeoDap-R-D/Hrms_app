import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PressableScale from '../motion/PressableScale';
import Icon from './Icon';
import { useTheme } from '../../theme';

interface RowProps {
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}

/** A generic list row with a leading icon chip and optional chevron / value. */
export default function Row({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  value,
  right,
  onPress,
  chevron,
}: RowProps) {
  const { colors, radius, spacing } = useTheme();

  const body = (
    <View style={[styles.row, { paddingVertical: spacing.md }]}>
      {icon ? (
        <View
          style={[
            styles.iconChip,
            { backgroundColor: iconBg ?? colors.primarySoft, borderRadius: radius.md, marginRight: spacing.md },
          ]}>
          <Icon name={icon} size={20} color={iconColor ?? colors.primary} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text> : null}
      {right}
      {chevron ? <Icon name="chevron-right" size={22} color={colors.textSubtle} /> : null}
    </View>
  );

  if (onPress) {
    return <PressableScale onPress={onPress} scaleTo={0.98}>{body}</PressableScale>;
  }
  return body;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconChip: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 2 },
  value: { fontSize: 14, fontWeight: '600', marginRight: 4 },
});

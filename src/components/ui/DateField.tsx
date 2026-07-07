import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import Icon from './Icon';
import CalendarModal from './CalendarModal';
import { useTheme } from '../../theme';

interface DateFieldProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const { colors, radius, spacing } = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.field, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: radius.md }]}
        activeOpacity={0.7}
        onPress={() => setShow(true)}>
        <Icon name="calendar-blank-outline" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
        <Text style={[styles.value, { color: value ? colors.text : colors.textSubtle }]}>
          {value ? dayjs(value).format('DD MMM YYYY') : placeholder}
        </Text>
        <Icon name="chevron-down" size={20} color={colors.textSubtle} />
      </TouchableOpacity>

      <CalendarModal
        visible={show}
        value={value && dayjs(value).isValid() ? dayjs(value) : null}
        minimumDate={minimumDate ? dayjs(minimumDate) : undefined}
        maximumDate={maximumDate ? dayjs(maximumDate) : undefined}
        onSelect={d => {
          setShow(false);
          onChange(d.format('YYYY-MM-DD'));
        }}
        onClose={() => setShow(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, height: 52 },
  value: { flex: 1, fontSize: 15, fontWeight: '500' },
});

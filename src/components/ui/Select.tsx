import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import Icon from './Icon';
import { useTheme } from '../../theme';

export interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  icon?: string;
  value?: string | number | null;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  loading?: boolean;
}

export default function Select({
  label,
  placeholder = 'Select an option',
  icon,
  value,
  options,
  onChange,
  loading,
}: SelectProps) {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.field, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: radius.md }]}
        activeOpacity={0.7}
        onPress={() => !loading && setOpen(true)}>
        {icon ? <Icon name={icon} size={20} color={colors.primary} style={{ marginRight: spacing.sm }} /> : null}
        <Text style={[styles.value, { color: selected ? colors.text : colors.textSubtle }]} numberOfLines={1}>
          {loading ? 'Loading…' : selected ? selected.label : placeholder}
        </Text>
        <Icon name="chevron-down" size={20} color={colors.textSubtle} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}
            onPress={e => e.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{label || 'Select'}</Text>
            <FlatList
              data={options}
              keyExtractor={o => String(o.value)}
              style={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />}
              renderItem={({ item }) => {
                const active = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}>
                    <Text style={[styles.optionText, { color: active ? colors.primary : colors.text, fontWeight: active ? '700' : '400' }]}>
                      {item.label}
                    </Text>
                    {active ? <Icon name="check-circle" size={20} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No options available</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, height: 52 },
  value: { flex: 1, fontSize: 15, fontWeight: '500' },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12, maxHeight: '70%' },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  list: { flexGrow: 0 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  optionText: { fontSize: 15 },
  empty: { textAlign: 'center', paddingVertical: 20 },
});

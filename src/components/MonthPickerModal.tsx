import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

import { ref } from '../theme/refColors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthPickerModalProps {
  visible: boolean;
  value: dayjs.Dayjs;
  minimumDate?: dayjs.Dayjs;
  maximumDate?: dayjs.Dayjs;
  onSelect: (month: dayjs.Dayjs) => void;
  onClose: () => void;
}

/** Simple month + year picker (year stepper above a 12-month grid). */
export default function MonthPickerModal({ visible, value, minimumDate, maximumDate, onSelect, onClose }: MonthPickerModalProps) {
  const [year, setYear] = useState(value.year());

  useEffect(() => {
    if (visible) setYear(value.year());
  }, [visible, value]);

  const max = maximumDate ?? dayjs();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.yearRow}>
            <TouchableOpacity style={styles.yearBtn} onPress={() => setYear(y => y - 1)} hitSlop={hit}>
              <Icon name="chevron-left" size={26} color={ref.blue} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{year}</Text>
            <TouchableOpacity style={styles.yearBtn} onPress={() => setYear(y => y + 1)} hitSlop={hit}>
              <Icon name="chevron-right" size={26} color={ref.blue} />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {MONTHS.map((m, i) => {
              const isSel = value.year() === year && value.month() === i;
              const cellMonth = dayjs().year(year).month(i).startOf('month');
              const disabled =
                cellMonth.isAfter(max, 'month') || (!!minimumDate && cellMonth.isBefore(minimumDate, 'month'));
              return (
                <TouchableOpacity
                  key={m}
                  style={styles.cell}
                  activeOpacity={0.7}
                  disabled={disabled}
                  onPress={() => onSelect(dayjs().year(year).month(i).date(1).startOf('day'))}>
                  <View style={[styles.pill, isSel && styles.pillSel]}>
                    <Text style={[styles.cellText, isSel && styles.cellTextSel, disabled && styles.cellTextDisabled]}>{m}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 12 },
  yearBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ref.blueSoft },
  yearText: { fontSize: 18, fontWeight: '700', color: ref.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '33.333%', paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  pill: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999 },
  pillSel: { backgroundColor: ref.blue },
  cellText: { fontSize: 16, fontWeight: '600', color: ref.text },
  cellTextSel: { color: '#FFFFFF' },
  cellTextDisabled: { color: '#C4C9D2' },
});

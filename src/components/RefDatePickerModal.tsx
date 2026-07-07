import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

import { ref } from '../theme/refColors';

interface Props {
  visible: boolean;
  value?: dayjs.Dayjs | null;
  minimumDate?: dayjs.Dayjs;
  maximumDate?: dayjs.Dayjs;
  onSelect: (date: dayjs.Dayjs) => void;
  onClose: () => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const YEAR_PAGE = 12;

/** Clean, modern blue date picker matching the app's report design. */
export default function RefDatePickerModal({ visible, value, minimumDate, maximumDate, onSelect, onClose }: Props) {
  const today = dayjs();
  const anchor = () => (value ?? maximumDate ?? today).startOf('month');
  const [view, setView] = useState(anchor);
  const [mode, setMode] = useState<'days' | 'years'>('days');
  const [yearStart, setYearStart] = useState(() => anchor().year() - 6);

  useEffect(() => {
    if (visible) {
      const a = anchor();
      setView(a);
      setMode('days');
      setYearStart(a.year() - 6);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const cells = useMemo(() => {
    const start = view.startOf('month');
    const lead = start.day();
    const total = view.daysInMonth();
    const arr: (dayjs.Dayjs | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(start.date(d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [view]);

  const dayDisabled = (d: dayjs.Dayjs) =>
    (!!maximumDate && d.isAfter(maximumDate, 'day')) || (!!minimumDate && d.isBefore(minimumDate, 'day'));
  const yearDisabled = (y: number) =>
    (!!maximumDate && y > maximumDate.year()) || (!!minimumDate && y < minimumDate.year());

  const years = Array.from({ length: YEAR_PAGE }, (_, i) => yearStart + i);

  const onPrev = () => (mode === 'days' ? setView(v => v.subtract(1, 'month')) : setYearStart(s => s - YEAR_PAGE));
  const onNext = () => (mode === 'days' ? setView(v => v.add(1, 'month')) : setYearStart(s => s + YEAR_PAGE));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <View style={styles.head}>
            <TouchableOpacity style={styles.navBtn} onPress={onPrev}>
              <Icon name="chevron-left" size={24} color={ref.blue} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headTitleBtn} activeOpacity={0.7} onPress={() => setMode(m => (m === 'days' ? 'years' : 'days'))}>
              <Text style={styles.headTitle}>
                {mode === 'days' ? view.format('MMMM YYYY') : `${years[0]} – ${years[years.length - 1]}`}
              </Text>
              <Icon name={mode === 'days' ? 'menu-down' : 'menu-up'} size={20} color={ref.blue} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={onNext}>
              <Icon name="chevron-right" size={24} color={ref.blue} />
            </TouchableOpacity>
          </View>

          {mode === 'days' ? (
            <>
              <View style={styles.weekRow}>
                {WEEKDAYS.map((w, i) => (
                  <Text key={i} style={styles.weekday}>{w}</Text>
                ))}
              </View>
              <View style={styles.grid}>
                {cells.map((d, i) => {
                  if (!d) return <View key={i} style={styles.cell} />;
                  const selected = !!value && d.isSame(value, 'day');
                  const isToday = d.isSame(today, 'day');
                  const disabled = dayDisabled(d);
                  return (
                    <TouchableOpacity key={i} style={styles.cell} activeOpacity={0.7} disabled={disabled} onPress={() => onSelect(d)}>
                      <View style={[styles.dayWrap, selected && styles.daySelected, !selected && isToday && styles.dayToday]}>
                        <Text
                          style={[
                            styles.dayText,
                            selected && styles.dayTextSel,
                            !selected && isToday && styles.dayTextToday,
                            disabled && styles.dayDisabled,
                          ]}>
                          {d.date()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.yearGrid}>
              {years.map(y => {
                const selected = (value ?? view).year() === y;
                const disabled = yearDisabled(y);
                return (
                  <TouchableOpacity
                    key={y}
                    style={styles.yearCell}
                    activeOpacity={0.7}
                    disabled={disabled}
                    onPress={() => {
                      setView(v => v.year(y));
                      setMode('days');
                    }}>
                    <View style={[styles.yearWrap, selected && styles.yearSelected]}>
                      <Text style={[styles.yearText, selected && styles.yearTextSel, disabled && styles.dayDisabled]}>{y}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} hitSlop={hit}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 20 },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ref.blueSoft, alignItems: 'center', justifyContent: 'center' },
  headTitleBtn: { flexDirection: 'row', alignItems: 'center' },
  headTitle: { fontSize: 17, fontWeight: '700', color: ref.text, letterSpacing: -0.2 },

  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '700', color: ref.tabInactive },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: ref.blue },
  dayToday: { borderWidth: 1.5, borderColor: ref.blue },
  dayText: { fontSize: 15, fontWeight: '600', color: ref.text },
  dayTextSel: { color: '#FFFFFF', fontWeight: '800' },
  dayTextToday: { color: ref.blue, fontWeight: '800' },
  dayDisabled: { color: '#C4C9D2', opacity: 0.6 },

  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 4 },
  yearCell: { width: '25%', paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  yearWrap: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, minWidth: 64, alignItems: 'center' },
  yearSelected: { backgroundColor: ref.blue },
  yearText: { fontSize: 15, fontWeight: '700', color: ref.text },
  yearTextSel: { color: '#FFFFFF', fontWeight: '800' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB' },
  cancel: { fontSize: 15, fontWeight: '700', color: ref.blue, paddingVertical: 4, paddingHorizontal: 8 },
});

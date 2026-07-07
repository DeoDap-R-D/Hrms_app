import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import Icon from './Icon';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';

interface CalendarModalProps {
  visible: boolean;
  /** Currently selected day (highlighted), or null. */
  value?: dayjs.Dayjs | null;
  /** Month to open on when nothing is selected. */
  initialMonth?: dayjs.Dayjs;
  minimumDate?: dayjs.Dayjs;
  maximumDate?: dayjs.Dayjs;
  onSelect: (date: dayjs.Dayjs) => void;
  onClose: () => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const YEAR_PAGE = 12;

/** App-themed calendar picker — a clean replacement for the native date dialog. */
export default function CalendarModal({
  visible,
  value,
  initialMonth,
  minimumDate,
  maximumDate,
  onSelect,
  onClose,
}: CalendarModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const today = dayjs();
  const anchor = () => (value ?? initialMonth ?? maximumDate ?? today).startOf('month');
  const [view, setView] = useState(anchor);
  const [mode, setMode] = useState<'days' | 'years'>('days');
  const [yearStart, setYearStart] = useState(() => anchor().year() - 6);

  // Re-anchor to the selected / current month each time it opens.
  useEffect(() => {
    if (visible) {
      const a = anchor();
      setView(a);
      setMode('days');
      setYearStart(a.year() - 6);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const cells = useMemo(() => {
    const start = view.startOf('month');
    const lead = start.day(); // 0 = Sunday
    const total = view.daysInMonth();
    const arr: (dayjs.Dayjs | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(start.date(d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [view]);

  const prevMonthDisabled = !!minimumDate && view.startOf('month').subtract(1, 'month').isBefore(minimumDate.startOf('month'));
  const nextMonthDisabled = !!maximumDate && view.startOf('month').add(1, 'month').isAfter(maximumDate.startOf('month'));
  const prevYearsDisabled = !!minimumDate && yearStart - 1 < minimumDate.year();
  const nextYearsDisabled = !!maximumDate && yearStart + YEAR_PAGE > maximumDate.year();
  const todayDisabled = !!maximumDate && today.isAfter(maximumDate, 'day');

  const dayDisabled = (d: dayjs.Dayjs) =>
    (!!maximumDate && d.isAfter(maximumDate, 'day')) || (!!minimumDate && d.isBefore(minimumDate, 'day'));
  const yearDisabled = (y: number) =>
    (!!maximumDate && y > maximumDate.year()) || (!!minimumDate && y < minimumDate.year());

  const onPrev = () => {
    if (mode === 'days') setView(v => v.subtract(1, 'month'));
    else setYearStart(s => s - YEAR_PAGE);
  };
  const onNext = () => {
    if (mode === 'days') setView(v => v.add(1, 'month'));
    else setYearStart(s => s + YEAR_PAGE);
  };

  const prevDisabled = mode === 'days' ? prevMonthDisabled : prevYearsDisabled;
  const nextDisabled = mode === 'days' ? nextMonthDisabled : nextYearsDisabled;

  const years = Array.from({ length: YEAR_PAGE }, (_, i) => yearStart + i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.head}>
            <TouchableOpacity
              style={[styles.navBtn, prevDisabled && styles.navDisabled]}
              disabled={prevDisabled}
              onPress={onPrev}>
              <Icon name="chevron-left" size={22} color={prevDisabled ? colors.textSubtle : colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headTitleBtn}
              activeOpacity={0.7}
              onPress={() => setMode(m => (m === 'days' ? 'years' : 'days'))}>
              <Text style={styles.headTitle}>
                {mode === 'days' ? view.format('MMMM YYYY') : `${years[0]} – ${years[years.length - 1]}`}
              </Text>
              <Icon name={mode === 'days' ? 'menu-down' : 'menu-up'} size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, nextDisabled && styles.navDisabled]}
              disabled={nextDisabled}
              onPress={onNext}>
              <Icon name="chevron-right" size={22} color={nextDisabled ? colors.textSubtle : colors.primary} />
            </TouchableOpacity>
          </View>

          {mode === 'days' ? (
            <>
              {/* Weekday labels */}
              <View style={styles.weekRow}>
                {WEEKDAYS.map((w, i) => (
                  <Text key={i} style={styles.weekday}>{w}</Text>
                ))}
              </View>

              {/* Day grid */}
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
            /* Year grid */
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

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} hitSlop={hitSlop}>
              <Text style={styles.footerCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSelect(today)} disabled={todayDisabled} hitSlop={hitSlop}>
              <Text style={[styles.footerToday, todayDisabled && styles.footerDisabled]}>Today</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.overlay, paddingHorizontal: t.spacing.xl },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      padding: t.spacing.lg,
      ...t.shadows.lg,
    },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing.md },
    navBtn: { width: 40, height: 40, borderRadius: t.radius.md, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    navDisabled: { backgroundColor: t.colors.surfaceAlt },
    headTitleBtn: { flexDirection: 'row', alignItems: 'center' },
    headTitle: { fontSize: 17, fontWeight: '800', color: t.colors.text, letterSpacing: -0.2 },

    weekRow: { flexDirection: 'row', marginBottom: t.spacing.xs },
    weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '700', color: t.colors.textSubtle },

    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
    dayWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    daySelected: { backgroundColor: t.colors.primary, ...t.shadows.brand },
    dayToday: { borderWidth: 1.5, borderColor: t.colors.primary },
    dayText: { fontSize: 15, fontWeight: '600', color: t.colors.text },
    dayTextSel: { color: '#FFFFFF', fontWeight: '800' },
    dayTextToday: { color: t.colors.primary, fontWeight: '800' },
    dayDisabled: { color: t.colors.textSubtle, opacity: 0.4 },

    yearGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: t.spacing.xs },
    yearCell: { width: '25%', paddingVertical: t.spacing.sm, alignItems: 'center', justifyContent: 'center' },
    yearWrap: { paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm, borderRadius: t.radius.pill, minWidth: 64, alignItems: 'center' },
    yearSelected: { backgroundColor: t.colors.primary, ...t.shadows.brand },
    yearText: { fontSize: 15, fontWeight: '700', color: t.colors.text },
    yearTextSel: { color: '#FFFFFF', fontWeight: '800' },

    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: t.spacing.md, paddingTop: t.spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border },
    footerCancel: { fontSize: 14, fontWeight: '700', color: t.colors.textMuted, paddingVertical: 4, paddingHorizontal: 8 },
    footerToday: { fontSize: 14, fontWeight: '800', color: t.colors.primary, paddingVertical: 4, paddingHorizontal: 8 },
    footerDisabled: { color: t.colors.textSubtle, opacity: 0.5 },
  });

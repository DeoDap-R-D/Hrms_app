import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';

import { EmptyState, Loading, Badge, FadeInView, Icon, CalendarModal, FocusAwareStatusBar } from '../../components/ui';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
import { ref } from '../../theme/refColors';
import * as svc from '../../api/services';
import type { PunchRecord, PunchStatus } from '../../api/types';
import { formatDate, formatClock, hmsToHM, attendanceStatus } from '../../utils/format';
import { monthlyAttendanceStats } from '../../utils/stats';

function worktimeMinutes(r: PunchRecord): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(r.worktime ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

/** Local YYYY-MM-DD for a record's date (handles the API's UTC date strings). */
function dayKey(date?: string | null): string {
  return date ? dayjs(date).format('YYYY-MM-DD') : '';
}

export default function AttendanceScreen() {
  const theme = useTheme();
  // Blue design-system palette for this screen (light-gray canvas, brand-blue
  // accents), keeping orange/red as status semantics for Late/Absent.
  const colors = useMemo(
    () => ({
      ...theme.colors,
      bg: ref.pageBg,
      surface: ref.card,
      border: ref.border,
      text: ref.text,
      textMuted: ref.textMuted,
      primary: ref.blue,
      primarySoft: ref.blueSoft,
      gradientStart: ref.blue,
      gradientEnd: ref.blueDark,
      accent: ref.blue,
      warning: ref.orange,
      warningSoft: '#FEF3C7',
      danger: ref.red,
      dangerSoft: ref.redSoft,
    }),
    [theme.colors],
  );
  const styles = useMemo(() => makeStyles({ ...theme, colors }), [theme, colors]);
  const [month, setMonth] = useState(dayjs());
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const [today, setToday] = useState<PunchStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const isCurrentMonth = month.isSame(dayjs(), 'month');

  // Calendar date pick: jump to that date's month and filter the list to it.
  const onSelectDate = useCallback((d: dayjs.Dayjs) => {
    setShowPicker(false);
    setMonth(m => (d.isSame(m, 'month') ? m : d));
    setSelectedDate(d);
  }, []);

  const load = useCallback(async (m: dayjs.Dayjs) => {
    setLoading(true);
    const current = m.isSame(dayjs(), 'month');
    try {
      // For the current month, also pull today's live punch status so a punch-in
      // shows immediately — the history row for "today" only appears server-side
      // once the day is finalized.
      const [hist, status] = await Promise.all([
        svc.punchHistory({ month: m.format('YYYY-MM') }),
        current ? svc.punchStatus().catch(() => null) : Promise.resolve(null),
      ]);
      setRecords(hist);
      setToday(status);
    } catch {
      setRecords([]);
      setToday(null);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(month);
    }, [load, month]),
  );

  const shiftMonth = (delta: number) => {
    setSelectedDate(null);
    setMonth(m => m.add(delta, 'month'));
  };
  const canGoNext = !month.endOf('month').isAfter(dayjs());

  // Stats/hours come from the server history only — the live "today" row is for
  // display and must not skew the monthly totals.
  const stats = monthlyAttendanceStats(records);
  const totalHours = useMemo(() => {
    const mins = records.reduce((s, r) => s + worktimeMinutes(r), 0);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }, [records]);

  // Merge today's live punch into the current-month list when the history does
  // not yet contain a row for today.
  const displayData = useMemo<PunchRecord[]>(() => {
    if (!isCurrentMonth) return records;
    const todayKey = dayjs().format('YYYY-MM-DD');
    if (records.some(r => dayKey(r.date) === todayKey)) return records;
    const punch = today?.punch;
    const todayRow: PunchRecord = punch
      ? { ...punch, date: punch.date ?? todayKey, __today: true }
      : { date: todayKey, intime: null, outtime: null, worktime: '00:00:00', status: '', __today: true };
    return [todayRow, ...records];
  }, [isCurrentMonth, records, today]);

  // When a specific date is picked from the calendar, show only that day.
  const listData = useMemo<PunchRecord[]>(() => {
    if (!selectedDate) return displayData;
    const key = selectedDate.format('YYYY-MM-DD');
    return displayData.filter(r => dayKey(r.date) === key);
  }, [displayData, selectedDate]);

  const renderItem = ({ item, index }: { item: PunchRecord; index: number }) => {
    // Treat "today" by date — the row may be the injected live row OR a real
    // history row the server created after the first punch-in.
    const isToday = !!item.__today || dayKey(item.date) === dayjs().format('YYYY-MM-DD');
    const pendingToday = isToday && !item.intime;
    const chip = pendingToday
      ? { label: 'Today', color: colors.primary, bg: colors.primarySoft }
      : isToday
      ? { label: 'Present', color: colors.primary, bg: colors.primarySoft }
      : attendanceStatus(item.status, colors);
    // A finalized PAST day with a check-in but no check-out = a missing punch-out.
    // Today's day is still in progress, so an empty check-out is just "—".
    const missingOut = !isToday && !!item.intime && !item.outtime;
    const hasWork = !!item.worktime && item.worktime !== '00:00:00';

    return (
      <FadeInView index={index}>
        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: chip.color }]}>
          {/* Header: date chip · weekday · status */}
          <View style={styles.cardHead}>
            <View style={[styles.dateChip, { backgroundColor: chip.bg }]}>
              <Text style={[styles.dateDay, { color: chip.color }]}>{formatDate(item.date, 'DD')}</Text>
              <Text style={[styles.dateMon, { color: chip.color }]}>{formatDate(item.date, 'MMM')}</Text>
            </View>
            <View style={styles.headText}>
              <Text style={styles.weekday}>{formatDate(item.date, 'dddd')}</Text>
              <Text style={styles.fullDate}>{formatDate(item.date, 'DD MMMM YYYY')}</Text>
            </View>
            <Badge label={chip.label} color={chip.color} bg={chip.bg} dot />
          </View>

          <View style={styles.cardDivider} />

          {/* Body: in · out · hours */}
          <View style={styles.cardBody}>
            <View style={styles.metric}>
              <View style={styles.metricHead}>
                <Icon name="arrow-down-left" set="feather" size={13} color={colors.primary} />
                <Text style={styles.metricLabel}>CHECK IN</Text>
              </View>
              <Text style={styles.metricValue}>{formatClock(item.intime)}</Text>
            </View>

            <View style={styles.metricSep} />

            <View style={styles.metric}>
              <View style={styles.metricHead}>
                <Icon name="arrow-up-right" set="feather" size={13} color={missingOut ? colors.warning : colors.danger} />
                <Text style={styles.metricLabel}>CHECK OUT</Text>
              </View>
              <Text style={[styles.metricValue, missingOut && styles.metricMissing]}>
                {missingOut ? 'Missing' : formatClock(item.outtime)}
              </Text>
            </View>

            <View style={styles.metricSep} />

            <View style={styles.metric}>
              <View style={styles.metricHead}>
                <Icon name="timer-sand" size={13} color={colors.accent} />
                <Text style={styles.metricLabel}>HOURS</Text>
              </View>
              <Text style={[styles.metricValue, hasWork && { color: colors.accent }]}>
                {hasWork ? hmsToHM(item.worktime) : '—'}
              </Text>
            </View>
          </View>
        </View>
      </FadeInView>
    );
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />
      {/* Clean header on cream */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Attendance</Text>
            <Text style={styles.subtitle}>Track your daily presence</Text>
          </View>
          <TouchableOpacity
            style={styles.calBadge}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.85}
            hitSlop={hitSlop}>
            <Icon name="calendar-search" size={22} color={colors.primary} />
            {selectedDate ? <View style={styles.calDot} /> : null}
          </TouchableOpacity>
        </View>

        {/* Cobalt month-summary card */}
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
          <View style={styles.monthRow}>
            <TouchableOpacity style={styles.monthBtn} onPress={() => shiftMonth(-1)} hitSlop={hitSlop}>
              <Icon name="chevron-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.monthText}>{month.format('MMMM YYYY')}</Text>
            <TouchableOpacity
              style={[styles.monthBtn, !canGoNext && styles.monthBtnDisabled]}
              onPress={() => canGoNext && shiftMonth(1)}
              disabled={!canGoNext}
              hitSlop={hitSlop}>
              <Icon name="chevron-right" size={22} color={canGoNext ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} />
            </TouchableOpacity>
          </View>

          <View style={styles.statLine}>
            <Stat styles={styles} value={String(stats.total)} label="Total Days" />
            <View style={styles.statSep} />
            <Stat styles={styles} value={String(stats.present)} label="Present" />
            <View style={styles.statSep} />
            <Stat styles={styles} value={String(stats.weekOff)} label="Week Off" />
          </View>
        </LinearGradient>
      </SafeAreaView>

      {/* Selected-date filter chip */}
      {selectedDate ? (
        <View style={styles.filterBar}>
          <Icon name="calendar-check" size={18} color={colors.primary} />
          <Text style={styles.filterText} numberOfLines={1}>Showing {selectedDate.format('ddd, DD MMM YYYY')}</Text>
          <TouchableOpacity style={styles.filterClear} activeOpacity={0.85} onPress={() => setSelectedDate(null)} hitSlop={hitSlop}>
            <Icon name="close-circle" size={17} color="#FFFFFF" />
            <Text style={styles.filterClearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Fixed sub-stats — stays put while the list scrolls */}
      <View style={styles.subStatsCard}>
        <SubStat styles={styles} value={String(stats.late)} label="Late" color={colors.warning} />
        <View style={styles.subStatSep} />
        <SubStat styles={styles} value={String(stats.absent)} label="Absent" color={colors.danger} />
        <View style={styles.subStatSep} />
        <SubStat styles={styles} value={totalHours} label="Total Hours" color={colors.accent} />
      </View>

      {/* Fixed section heading */}
      <View style={styles.listHead}>
        <Text style={styles.listHeading}>{selectedDate ? 'Selected Date' : 'Daily Records'}</Text>
        <Text style={styles.listCount}>{listData.length} {listData.length === 1 ? 'day' : 'days'}</Text>
      </View>

      {firstLoad && loading ? (
        <Loading message="Loading attendance…" fullscreen={false} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => String(item.id ?? (item.__today ? 'today' : i))}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={11}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(month)} colors={[colors.primary]} tintColor={colors.primary} progressBackgroundColor={colors.surface} />}
          ListEmptyComponent={
            selectedDate ? (
              <EmptyState icon="calendar-remove-outline" title="No record on this date" message={`No attendance was recorded on ${selectedDate.format('DD MMM YYYY')}.`} />
            ) : (
              <EmptyState icon="calendar-blank-outline" title="No records this month" message="Your attendance for this month will appear here." />
            )
          }
        />
      )}

      <CalendarModal
        visible={showPicker}
        value={selectedDate}
        initialMonth={month}
        maximumDate={dayjs()}
        onSelect={onSelectDate}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}

const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

function Stat({ styles, value, label }: { styles: ReturnType<typeof makeStyles>; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SubStat({ styles, value, label, color }: { styles: ReturnType<typeof makeStyles>; value: string; label: string; color: string }) {
  return (
    <View style={styles.subStat}>
      <Text style={[styles.subStatValue, { color }]}>{value}</Text>
      <Text style={styles.subStatLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },

    // Header (clean, on cream)
    safeTop: { backgroundColor: t.colors.bg, paddingHorizontal: t.spacing.lg },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: t.spacing.sm },
    title: { color: t.colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6 },
    subtitle: { color: t.colors.textMuted, fontSize: 13, marginTop: 2, fontWeight: '500' },
    calBadge: {
      width: 46,
      height: 46,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...t.shadows.xs,
    },
    calDot: { position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 4.5, backgroundColor: t.colors.accent, borderWidth: 1.5, borderColor: t.colors.surface },

    // Cobalt month-summary card
    summaryCard: {
      marginTop: t.spacing.lg,
      borderRadius: t.radius.xl,
      padding: t.spacing.lg,
      overflow: 'hidden',
      ...t.shadows.brand,
    },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthBtn: {
      width: 40,
      height: 40,
      borderRadius: t.radius.md,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.24)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' },
    monthText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },

    statLine: { flexDirection: 'row', alignItems: 'center', marginTop: t.spacing.lg },
    statSep: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: 'rgba(255,255,255,0.22)' },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
    statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11.5, fontWeight: '600', marginTop: 3 },

    // Selected-date filter chip
    filterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.primarySoft,
      marginHorizontal: t.spacing.lg,
      marginTop: t.spacing.lg,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.md,
    },
    filterText: { flex: 1, fontSize: 13, fontWeight: '700', color: t.colors.primary, marginLeft: t.spacing.sm, marginRight: t.spacing.sm },
    filterClear: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.primary,
      paddingHorizontal: t.spacing.md,
      paddingVertical: 9,
      borderRadius: t.radius.pill,
      ...t.shadows.brand,
    },
    filterClearText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginLeft: 5, letterSpacing: 0.2 },

    // List
    list: { flex: 1 },
    listContent: { paddingHorizontal: t.spacing.lg, paddingTop: 0, paddingBottom: t.spacing.huge },

    subStatsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      paddingVertical: t.spacing.lg,
      marginHorizontal: t.spacing.lg,
      marginTop: t.spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      ...t.shadows.sm,
    },
    subStat: { flex: 1, alignItems: 'center' },
    subStatValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
    subStatLabel: { fontSize: 12, color: t.colors.textMuted, fontWeight: '600', marginTop: 4 },
    subStatSep: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: t.colors.border },

    listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: t.spacing.lg, marginTop: t.spacing.lg, marginBottom: t.spacing.md },
    listHeading: { fontSize: 17, fontWeight: '800', color: t.colors.text, letterSpacing: -0.3 },
    listCount: { fontSize: 13, fontWeight: '600', color: t.colors.textMuted },

    // Day card
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      padding: t.spacing.lg,
      marginBottom: t.spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      ...t.shadows.xs,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center' },
    dateChip: { width: 50, height: 50, borderRadius: t.radius.md, alignItems: 'center', justifyContent: 'center', marginRight: t.spacing.md },
    dateDay: { fontSize: 19, fontWeight: '800', lineHeight: 21, letterSpacing: -0.5 },
    dateMon: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    headText: { flex: 1 },
    weekday: { fontSize: 15, fontWeight: '700', color: t.colors.text, letterSpacing: -0.2 },
    fullDate: { fontSize: 12.5, color: t.colors.textMuted, marginTop: 2, fontWeight: '500' },

    cardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border, marginVertical: t.spacing.md },

    cardBody: { flexDirection: 'row', alignItems: 'center' },
    metric: { flex: 1 },
    metricHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    metricLabel: { fontSize: 10, fontWeight: '700', color: t.colors.textSubtle, letterSpacing: 0.5, marginLeft: 4 },
    metricValue: { fontSize: 15, fontWeight: '800', color: t.colors.text, letterSpacing: -0.2 },
    metricMissing: { fontSize: 13, color: t.colors.warning },
    metricSep: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: t.colors.border, marginHorizontal: t.spacing.md },
  });

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { DonutChart, Icon, FocusAwareStatusBar } from '../../components/ui';
import AppDrawer from '../../components/AppDrawer';
import { ref } from '../../theme/refColors';
import { useAuth } from '../../context/AuthContext';
import { displayName } from '../../utils/format';
import { leaveDaysInMonth } from '../../utils/stats';
import * as svc from '../../api/services';
import type { PunchStatus, PunchRecord, Leave } from '../../api/types';

/** Format a clock/duration string ("10:54:00") as "HH:mm", or "--:--" when empty. */
function hhmm(value?: string | null): string {
  if (!value) return '--:--';
  const m = /^(\d{1,2}):(\d{2})/.exec(String(value).trim());
  if (m) {
    const hh = m[1].padStart(2, '0');
    if (hh === '00' && m[2] === '00') return '--:--';
    return `${hh}:${m[2]}`;
  }
  const d = dayjs(value);
  return d.isValid() ? d.format('HH:mm') : '--:--';
}

function isLateRecord(r: PunchRecord): boolean {
  const v = String(r.late_in ?? '').trim();
  return !!v && v !== '00:00:00' && v !== '00:00' && v !== '0';
}

export default function HomeScreen() {
  const { user } = useAuth();

  const [status, setStatus] = useState<PunchStatus | null>(null);
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h, lv] = await Promise.all([
        svc.punchStatus().catch(() => null),
        svc.punchHistory({ month: dayjs().format('YYYY-MM') }).catch(() => [] as PunchRecord[]),
        svc.listLeaves().catch(() => [] as Leave[]),
      ]);
      if (s) setStatus(s);
      setRecords(h);
      setLeaves(lv);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const inClock = hhmm(status?.punch?.intime);
  const outClock = hhmm(status?.punch?.outtime);
  const workHrs = hhmm(status?.punch?.worktime);

  // Monthly attendance breakdown for the Attendance card.
  const bd = useMemo(() => {
    let present = 0, late = 0, absent = 0, weekOff = 0, holidays = 0;
    records.forEach(r => {
      const st = String(r.status ?? '').toUpperCase().trim();
      if (st === 'P') {
        present += 1;
        if (isLateRecord(r)) late += 1;
      } else if (st === 'A') {
        absent += 1;
      } else if (st === 'WO' || st === 'W') {
        weekOff += 1;
      } else if (st === 'H' || st === 'HO') {
        holidays += 1;
      }
    });
    return { present, late, absent, weekOff, holidays };
  }, [records]);

  const leaveCount = useMemo(() => leaveDaysInMonth(leaves, dayjs()), [leaves]);

  const stats = [
    { label: 'Present', value: bd.present, color: ref.green },
    { label: 'Late', value: bd.late, color: ref.orange },
    { label: 'Absent', value: bd.absent, color: ref.red },
    { label: 'Week off', value: bd.weekOff, color: ref.skyBlue },
    { label: 'Holidays', value: bd.holidays, color: ref.teal },
    { label: 'Leave', value: leaveCount, color: ref.amber },
  ];

  const donut = useMemo(
    () =>
      [
        { value: bd.present, color: ref.green, label: 'Present' },
        { value: bd.late, color: ref.orange, label: 'Late' },
        { value: bd.weekOff, color: ref.skyBlue, label: 'Week off' },
        { value: bd.holidays, color: ref.teal, label: 'Holidays' },
        { value: leaveCount, color: ref.amber, label: 'Leave' },
        { value: bd.absent, color: ref.red, label: 'Absent' },
      ].filter(d => d.value > 0),
    [bd, leaveCount],
  );

  const code = user?.code || user?.username || '';

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="light-content" />

      {/* Blue header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.menuBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setDrawerOpen(true)}>
            <Icon name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Hello, {code ? `${code} - ` : ''}{displayName(user)}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} colors={[ref.blue]} tintColor={ref.blue} />
        }>
        {/* Punch In/Out card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Punch In/Out</Text>
          </View>

          <View style={styles.punchRow}>
            <View style={styles.punchCol}>
              <Text style={[styles.punchValue, { color: ref.green }]}>{inClock}</Text>
              <Text style={styles.punchLabel}>IN</Text>
            </View>

            <View style={styles.punchCol}>
              <Text style={[styles.punchValue, styles.punchValueDim]}>{workHrs}</Text>
              <View style={styles.workLine} />
              <Text style={styles.punchLabel}>work Hrs</Text>
            </View>

            <View style={styles.punchCol}>
              <Text style={[styles.punchValue, { color: ref.blue }]}>{outClock}</Text>
              <Text style={styles.punchLabel}>Out</Text>
            </View>
          </View>
        </View>

        {/* Attendance card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attendance</Text>

          <View style={styles.attRow}>
            <DonutChart
              segments={donut}
              size={130}
              strokeWidth={13}
              centerValue={String(bd.present)}
              centerLabel="Present"
              centerColor={ref.green}
              centerLabelColor={ref.green}
            />

            <View style={styles.statsGrid}>
              {[0, 3].map(row => (
                <View key={row} style={styles.statsGridRow}>
                  {stats.slice(row, row + 3).map(s => (
                    <View key={s.label} style={styles.statCell}>
                      <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                      <Text style={styles.statLabel} numberOfLines={1}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ref.pageBg },
  flex: { flex: 1 },

  // Header
  header: { backgroundColor: ref.blue },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  menuBtn: { marginRight: 16 },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },

  // Scroll body
  scroll: { padding: 16, paddingBottom: 28 },

  // Cards
  card: {
    backgroundColor: ref.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: ref.text, letterSpacing: -0.3 },

  // Punch row
  punchRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 22 },
  punchCol: { flex: 1, alignItems: 'center' },
  punchValue: { fontSize: 26, fontWeight: '700', letterSpacing: 0.5 },
  punchValueDim: { color: '#9AA0A6' },
  workLine: { width: 46, height: 3, borderRadius: 2, backgroundColor: ref.green, marginTop: 6 },
  punchLabel: { fontSize: 15, color: ref.textMuted, marginTop: 8, fontWeight: '500' },

  // Attendance
  attRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statsGrid: { flex: 1, marginLeft: 6 },
  statsGridRow: { flexDirection: 'row' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2 },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 12.5, color: ref.textMuted, marginTop: 2, fontWeight: '500' },
});

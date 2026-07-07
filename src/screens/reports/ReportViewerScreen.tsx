import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

import { FocusAwareStatusBar } from '../../components/ui';
import ZoomableView from '../../components/ZoomableView';
import { ref } from '../../theme/refColors';
import { useAuth } from '../../context/AuthContext';
import { displayName } from '../../utils/format';
import type { PunchRecord } from '../../api/types';
import type { AppStackParamList } from '../../navigation/types';
import {
  loadReportData,
  loadMonthData,
  loadRangeData,
  reportHasData,
  filterByType,
  timeVal,
  durVal,
  firstText,
} from './reportData';

type R = RouteProp<AppStackParamList, 'ReportViewer'>;

const BASE_TITLES: Record<string, string> = {
  Performance: 'Present Performance Report',
  'Datewise Performance': 'Datewise Present Performance Report',
  Present: 'Present Report',
  Absent: 'Absent Report',
  'Late In': 'Late IN Report',
  'Early In': 'Early IN Report',
  'Early Out': 'Early OUT Report',
  'Half Day': 'Half Day Report',
  'In Out': 'IN/OUT Report',
  'In/Out Report': 'IN/OUT Report',
  'Over Time': 'Over Time Report',
  'Mis Punch': 'Mis Punch Report',
  'Week Off': 'Week Off Report',
  'Periodic Report': 'Periodic Report',
  'Periodic Performance Report': 'Periodic Present Performance Report',
  'Access Control Report': 'Access Control Report',
};

interface ColDef {
  label: string;
  w: number;
  get: (r: PunchRecord) => string;
}

const statusOf = (r: PunchRecord) => String(r.status ?? '').toUpperCase().trim();

export default function ReportViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const { type, date, to } = route.params;
  const period = route.params.period ?? 'daily';
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const day = useMemo(() => dayjs(date), [date]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PunchRecord[]>([]);
  const [dept, setDept] = useState('—');
  const [shift, setShift] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        if (period === 'monthly') {
          const data = await loadMonthData(date, user);
          if (!active) return;
          setRows(filterByType(type, data.records));
          setDept(data.dept);
          setShift(data.shift);
        } else if (period === 'periodic') {
          const data = await loadRangeData(date, to ?? date, user);
          if (!active) return;
          setRows(filterByType(type, data.records));
          setDept(data.dept);
          setShift(data.shift);
        } else {
          const data = await loadReportData(date, user);
          if (!active) return;
          setRows(data.record && reportHasData(type, data.record) ? [data.record] : []);
          setDept(data.dept);
          setShift(data.shift);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [date, to, period, type, user]);

  const multiRow = period !== 'daily';
  const baseTitle = BASE_TITLES[type] || `${type} Report`;
  const title = period === 'monthly' ? `Monthly ${baseTitle}` : period === 'periodic' ? baseTitle : `Daily ${baseTitle}`;
  const kind: 'perf' | 'latein' | 'inout' =
    type === 'Late In'
      ? 'latein'
      : type === 'In Out' || type === 'In/Out Report' || type === 'Access Control Report'
      ? 'inout'
      : 'perf';

  const emp = { code: firstText(user?.code, user?.username) || '—', name: displayName(user) };

  const columns: ColDef[] = useMemo(() => {
    const idCols: ColDef[] = multiRow
      ? [{ label: 'Date', w: 84, get: r => dayjs(r.date).format('DD/MM/YYYY') }]
      : [
          { label: 'Empcode', w: 62, get: () => emp.code },
          { label: 'Name', w: 112, get: () => emp.name },
        ];
    const shiftCol: ColDef = { label: 'Shift', w: 54, get: r => shift || firstText(r.shift) || '—' };

    if (kind === 'latein') {
      return [
        ...idCols,
        shiftCol,
        { label: 'IN Time', w: 84, get: r => timeVal(r.intime) },
        { label: 'Late IN', w: 84, get: r => durVal(r.late_in) },
      ];
    }
    if (kind === 'inout') {
      const io: ColDef[] = [...idCols, shiftCol, { label: 'INTime', w: 54, get: r => timeVal(r.intime) }];
      ['Out1', 'In2', 'Out2', 'In3', 'Out3', 'In4', 'Out4', 'In5', 'Out5', 'In6', 'Out6', 'In7', 'Out7', 'In8'].forEach(p =>
        io.push({ label: p, w: 40, get: () => '' }),
      );
      io.push(
        { label: 'OUTTime', w: 58, get: r => timeVal(r.outtime) },
        { label: 'Work+OT', w: 58, get: r => durVal(r.worktime) },
        { label: 'OT', w: 46, get: r => durVal(r.overtime) },
        { label: 'Break', w: 50, get: r => durVal(r.breaktime) },
      );
      return io;
    }
    // perf
    return [
      ...idCols,
      shiftCol,
      { label: 'INTime', w: 58, get: r => timeVal(r.intime) },
      { label: 'Late In', w: 58, get: r => durVal(r.late_in) },
      { label: 'Erl Out', w: 58, get: r => durVal(r.erl_out) },
      { label: 'OUTTime', w: 74, get: r => timeVal(r.outtime) },
      { label: 'Work+OT', w: 74, get: r => durVal(r.worktime) },
      { label: 'Over Time', w: 74, get: r => durVal(r.overtime) },
      { label: 'Status', w: 52, get: r => statusOf(r) || '—' },
      { label: 'Remark', w: 66, get: r => firstText(r.remark, r.remarks) },
    ];
  }, [kind, period, emp.code, emp.name, shift]);

  const naturalW = columns.reduce((s, c) => s + c.w, 0);
  const dateStr =
    period === 'monthly'
      ? `Month :- ${day.format('MMMM YYYY')}`
      : period === 'periodic'
      ? `From :- ${day.format('DD/MM/YYYY')}    To :- ${dayjs(to ?? date).format('DD/MM/YYYY')}`
      : `Date :- ${day.format('DD/MM/YYYY')}`;

  // Fit-to-width scaling (never upscale). Fonts/paddings scale by the same factor.
  const availableW = width - 24;
  const contentW = naturalW > 0 ? naturalW : availableW;
  const scale = Math.min(1, availableW / contentW);
  const docW = Math.round(contentW * scale);
  const styles = useMemo(() => makeStyles(scale), [scale]);
  const cw = (w: number) => Math.round(w * scale);

  const onShare = () => {
    Share.share({ message: `${title} — ${day.format(period === 'monthly' ? 'MMMM YYYY' : 'DD/MM/YYYY')}` }).catch(() => {});
  };

  const presentN = rows.filter(r => statusOf(r) === 'P' || r.intime).length;
  const absentN = rows.filter(r => statusOf(r) === 'A').length;
  const lateN = rows.filter(r => !!r.late_in && durVal(r.late_in) !== '00:00').length;
  const halfN = rows.filter(r => statusOf(r) === 'HD').length;
  const hasData = rows.length > 0;

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />

      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="arrow-left" size={24} color={ref.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {period === 'monthly' ? 'Monthly Report' : period === 'periodic' ? 'Periodic Report' : 'Daily Report'}
          </Text>
          <TouchableOpacity onPress={onShare} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="export-variant" size={24} color={ref.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={ref.blue} size="large" />
        </View>
      ) : (
        <ZoomableView>
          <View style={[styles.page, { width: availableW }]}>
            <View style={[styles.doc, { width: docW }]}>
              {/* Title + date */}
              <View style={styles.rowLine}>
                <View style={[styles.cellPlain, styles.grow, styles.center]}>
                  <Text style={styles.titleText}>{title}</Text>
                </View>
                <View style={[styles.cellPlain, { width: cw(160) }]}>
                  <Text style={styles.dateText}>{dateStr}</Text>
                </View>
              </View>

              {/* Company */}
              <View style={styles.rowLine}>
                <View style={[styles.cellPlain, styles.grow, styles.center]}>
                  <Text style={styles.company}>DEODAP</Text>
                </View>
              </View>

              {/* Dept + totals */}
              <View style={styles.rowLine}>
                <View style={[styles.cellPlain, styles.deptLabel, { width: cw(90) }]}>
                  <Text style={styles.deptLabelText}>Dept. Name</Text>
                </View>
                <View style={[styles.cellPlain, styles.grow, styles.deptRow]}>
                  <Text style={styles.deptName}>{dept}</Text>
                  {kind === 'perf' ? (
                    <View style={styles.totals}>
                      <Text style={[styles.totalItem, { color: ref.green }]}>Total Present :- {presentN}</Text>
                      <Text style={[styles.totalItem, { color: ref.red }]}>Total Absent :- {absentN}</Text>
                      <Text style={[styles.totalItem, { color: ref.orange }]}>Total Late In :- {lateN}</Text>
                      <Text style={[styles.totalItem, { color: ref.blue }]}>Total Half Day :- {halfN}</Text>
                    </View>
                  ) : kind === 'latein' ? (
                    <View style={styles.totals}>
                      <Text style={styles.totalItem}>Total Late IN Emp :- {lateN}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Employee (monthly / periodic) */}
              {multiRow ? (
                <View style={styles.rowLine}>
                  <View style={[styles.cellPlain, styles.grow]}>
                    <Text style={styles.empInfo}>
                      Emp Code : {emp.code}      Name : {emp.name}
                    </Text>
                  </View>
                </View>
              ) : null}

              {hasData ? (
                <>
                  {/* Column headers */}
                  <View style={styles.rowLine}>
                    {columns.map(c => (
                      <View key={c.label} style={[styles.cell, { width: cw(c.w) }]}>
                        <Text style={styles.headText} numberOfLines={1}>{c.label}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Data rows */}
                  {rows.map((r, ri) => (
                    <View key={r.id ?? r.date ?? ri} style={styles.rowLine}>
                      {columns.map(c => (
                        <View key={c.label} style={[styles.cell, { width: cw(c.w) }]}>
                          <Text style={styles.cellText} numberOfLines={1}>{c.get(r)}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                  {/* Footer totals */}
                  {kind === 'perf' ? (
                    <View style={styles.rowLine}>
                      <View style={[styles.cellPlain, styles.grow, styles.center]}>
                        <Text style={styles.footText}>
                          Total For Whole Company   Total Present:- {presentN}   Total Absent:- {absentN}   Total Late In:- {lateN}   Total Half Day :- {halfN}
                        </Text>
                      </View>
                    </View>
                  ) : kind === 'latein' ? (
                    <View style={styles.rowLine}>
                      <View style={[styles.cellPlain, styles.grow, styles.center]}>
                        <Text style={styles.footText}>Total For Whole Company   Total Late IN Emp :- {lateN}</Text>
                      </View>
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.rowLine}>
                  <View style={[styles.cellPlain, styles.grow, styles.center, styles.notFoundBox]}>
                    <Text style={styles.notFound}>Record Not Found</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Legend + page */}
            {kind === 'perf' ? (
              <Text style={styles.legend}>
                OT:- Over Time   EI:- Early IN   EO:- Early OUT   LT:- LateIN   LTA:- Late IN Allow   MIS:- Mis Punch   EOA:- Early OUT Allow   M:- Manual Punch
              </Text>
            ) : null}
            <Text style={styles.page1}>Page :-   1 Of 1</Text>
          </View>
        </ZoomableView>
      )}
    </View>
  );
}

const BORDER = '#B7B7B7';

const makeStyles = (scale: number) => {
  const f = (n: number) => n * scale;
  const p = (n: number) => n * scale;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#EAEAEA' },
    topBar: { backgroundColor: '#FFFFFF' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: ref.text, marginLeft: 20, letterSpacing: -0.3 },

    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    page: { paddingVertical: 24, alignItems: 'center' },

    doc: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderLeftWidth: 1, borderColor: BORDER },
    rowLine: { flexDirection: 'row' },
    grow: { flex: 1 },
    center: { alignItems: 'center' },

    cell: {
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: BORDER,
      paddingVertical: p(5),
      paddingHorizontal: p(3),
      justifyContent: 'center',
    },
    cellPlain: {
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: BORDER,
      paddingVertical: p(5),
      paddingHorizontal: p(6),
      justifyContent: 'center',
    },

    titleText: { fontSize: f(11), fontWeight: '700', color: '#111', textAlign: 'center' },
    dateText: { fontSize: f(10), fontWeight: '600', color: '#111' },
    company: { fontSize: f(11), fontWeight: '700', color: '#111' },

    deptLabel: { backgroundColor: '#D9D9D9' },
    deptLabelText: { fontSize: f(10), fontWeight: '700', color: '#111' },
    deptRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    deptName: { fontSize: f(10), color: '#111', marginRight: p(12) },
    totals: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
    totalItem: { fontSize: f(10), fontWeight: '700', marginRight: p(14) },

    empInfo: { fontSize: f(10), fontWeight: '700', color: '#111' },

    headText: { fontSize: f(9.5), fontWeight: '700', color: '#111', textAlign: 'center' },
    cellText: { fontSize: f(9.5), color: '#111', textAlign: 'center' },

    footText: { fontSize: f(10), fontWeight: '700', color: '#111', textAlign: 'center' },

    notFoundBox: { paddingVertical: 22 },
    notFound: { fontSize: 15, fontWeight: '700', color: '#B00020' },

    legend: { fontSize: 11, color: '#333', marginTop: 22, paddingHorizontal: 16, textAlign: 'center' },
    page1: { fontSize: 12, color: '#333', marginTop: 14 },
  });
};

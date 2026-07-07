import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Share, useWindowDimensions } from 'react-native';
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
import { loadRangeData, timeVal, durVal, firstText } from './reportData';

type R = RouteProp<AppStackParamList, 'PeriodicReportViewer'>;

const two = (n: number) => String(n).padStart(2, '0');
function hoursOf(v?: string | null): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(v ?? '').trim());
  return m ? Number(m[1]) + Number(m[2]) / 60 : 0;
}
function statusText(s?: string): string {
  const u = String(s ?? '').toUpperCase().trim();
  if (u === 'W') return 'WO';
  return u || '--';
}
function statusColor(s?: string): string {
  const u = String(s ?? '').toUpperCase().trim();
  if (u === 'P') return ref.green;
  if (u === 'A') return ref.red;
  if (u === 'WO' || u === 'W') return ref.blue;
  if (u === 'H' || u === 'HO') return ref.orange;
  if (u === 'L') return ref.amber;
  return '#111';
}

const METRICS: { key: string; label: string; get: (r: PunchRecord | null) => string }[] = [
  { key: 'in', label: 'IN', get: r => timeVal(r?.intime) },
  { key: 'out', label: 'OUT', get: r => timeVal(r?.outtime) },
  { key: 'work', label: 'WORK', get: r => durVal(r?.worktime) },
  { key: 'break', label: 'Break', get: r => durVal(r?.breaktime) },
  { key: 'ot', label: 'OT', get: r => durVal(r?.overtime) },
];

const LABEL_W = 42;
const DAY_W = 30;

export default function PeriodicReportViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const { from, to } = route.params;
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const fromD = useMemo(() => dayjs(from), [from]);
  const toD = useMemo(() => dayjs(to), [to]);

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const [dept, setDept] = useState('—');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await loadRangeData(from, to, user);
        if (!active) return;
        setRecords(data.records);
        setDept(data.dept);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [from, to, user]);

  const days = useMemo(() => {
    const out: dayjs.Dayjs[] = [];
    let d = fromD.startOf('day');
    const end = toD.startOf('day');
    let guard = 0;
    while (!d.isAfter(end, 'day') && guard < 400) {
      out.push(d);
      d = d.add(1, 'day');
      guard += 1;
    }
    return out;
  }, [fromD, toD]);

  const recByDate = useMemo(() => {
    const m: Record<string, PunchRecord> = {};
    records.forEach(r => {
      if (r.date) m[dayjs(r.date).format('YYYY-MM-DD')] = r;
    });
    return m;
  }, [records]);
  const recOf = (d: dayjs.Dayjs) => recByDate[d.format('YYYY-MM-DD')] ?? null;

  // Summary counts.
  const sum = useMemo(() => {
    let present = 0, wo = 0, hl = 0, lv = 0, absent = 0, work = 0, ot = 0;
    days.forEach(d => {
      const r = recOf(d);
      const u = String(r?.status ?? '').toUpperCase().trim();
      if (u === 'P') present += 1;
      else if (u === 'A') absent += 1;
      else if (u === 'WO' || u === 'W') wo += 1;
      else if (u === 'H' || u === 'HO') hl += 1;
      else if (u === 'L') lv += 1;
      if (r) {
        work += hoursOf(r.worktime);
        ot += hoursOf(r.overtime);
      }
    });
    return { present, wo, hl, lv, absent, work: work.toFixed(1), ot: ot.toFixed(1) };
  }, [days, recByDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const emp = { code: firstText(user?.code, user?.username) || '—', name: displayName(user) };
  const rangeText = `${fromD.format('DD/MM/YYYY')}-${toD.format('DD/MM/YYYY')}`;

  const naturalW = LABEL_W + days.length * DAY_W;
  const availableW = width - 24;
  const scale = Math.min(1, availableW / Math.max(naturalW, 1));
  const docW = Math.round(naturalW * scale);
  const styles = useMemo(() => makeStyles(scale), [scale]);
  const cw = (w: number) => Math.round(w * scale);

  const onShare = () => {
    Share.share({ message: `Periodic Report — ${rangeText}\n${emp.code} - ${emp.name}` }).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="arrow-left" size={24} color={ref.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Periodic Report</Text>
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
              {/* Info row 1 */}
              <View style={styles.rowLine}>
                <View style={[styles.cell, styles.gray, { width: cw(58) }]}><Text style={styles.bold}>Dept. Name</Text></View>
                <View style={[styles.cell, styles.f3]}><Text style={styles.txt} numberOfLines={1}>{dept}</Text></View>
                <View style={[styles.cell, { width: cw(56) }]}><Text style={styles.bold}>CompName</Text></View>
                <View style={[styles.cell, styles.f2]}><Text style={styles.txt} numberOfLines={1}>DEODAP</Text></View>
                <View style={[styles.cell, { width: cw(74) }]}><Text style={styles.bold}>Report Month</Text></View>
                <View style={[styles.cell, styles.f2]}><Text style={styles.txt} numberOfLines={1}>{rangeText}</Text></View>
              </View>

              {/* Info row 2 */}
              <View style={styles.rowLine}>
                <View style={[styles.cell, styles.gray, { width: cw(58) }]}><Text style={styles.bold}>Empcode</Text></View>
                <View style={[styles.cell, styles.f1]}><Text style={styles.txt} numberOfLines={1}>{emp.code}</Text></View>
                <View style={[styles.cell, { width: cw(42) }]}><Text style={styles.bold}>Name</Text></View>
                <View style={[styles.cell, styles.f2]}><Text style={styles.txt} numberOfLines={1}>{emp.name}</Text></View>
                <View style={[styles.cell, styles.totals]}>
                  <Total styles={styles} label="Present" value={sum.present} color={ref.green} />
                  <Total styles={styles} label="WO" value={sum.wo} color={ref.blue} />
                  <Total styles={styles} label="HL" value={sum.hl} color="#111" />
                  <Total styles={styles} label="LV" value={sum.lv} color="#111" />
                  <Total styles={styles} label="Absent" value={sum.absent} color={ref.red} />
                  <Total styles={styles} label="Tot.Work+OT" value={sum.work} color="#111" />
                  <Total styles={styles} label="Total OT" value={sum.ot} color="#111" />
                </View>
              </View>

              {/* Day numbers */}
              <View style={styles.rowLine}>
                <View style={[styles.cell, styles.gray, { width: cw(LABEL_W) }]} />
                {days.map(d => (
                  <View key={`n${d.valueOf()}`} style={[styles.cell, { width: cw(DAY_W) }]}>
                    <Text style={styles.dayTxt}>{d.format('DD')}</Text>
                  </View>
                ))}
              </View>
              {/* Weekdays */}
              <View style={styles.rowLine}>
                <View style={[styles.cell, styles.gray, { width: cw(LABEL_W) }]} />
                {days.map(d => (
                  <View key={`w${d.valueOf()}`} style={[styles.cell, { width: cw(DAY_W) }]}>
                    <Text style={styles.dayTxt}>{d.format('ddd')}</Text>
                  </View>
                ))}
              </View>

              {/* Metric rows */}
              {METRICS.map(mt => (
                <View key={mt.key} style={styles.rowLine}>
                  <View style={[styles.cell, styles.gray, { width: cw(LABEL_W) }]}>
                    <Text style={styles.bold}>{mt.label}</Text>
                  </View>
                  {days.map(d => (
                    <View key={`${mt.key}${d.valueOf()}`} style={[styles.cell, { width: cw(DAY_W) }]}>
                      <Text style={styles.cellTxt} numberOfLines={1}>{mt.get(recOf(d))}</Text>
                    </View>
                  ))}
                </View>
              ))}
              {/* Status row */}
              <View style={styles.rowLine}>
                <View style={[styles.cell, styles.gray, { width: cw(LABEL_W) }]}>
                  <Text style={styles.bold}>Status</Text>
                </View>
                {days.map(d => {
                  const r = recOf(d);
                  return (
                    <View key={`s${d.valueOf()}`} style={[styles.cell, { width: cw(DAY_W) }]}>
                      <Text style={[styles.cellTxt, styles.statusTxt, { color: statusColor(r?.status) }]} numberOfLines={1}>
                        {statusText(r?.status)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <Text style={styles.page1}>Page :-   1 Of 1</Text>
          </View>
        </ZoomableView>
      )}
    </View>
  );
}

function Total({ styles, label, value, color }: { styles: any; label: string; value: string | number; color: string }) {
  return (
    <View style={styles.totalItem}>
      <Text style={[styles.totalLabel, { color }]}>{label}</Text>
      <Text style={styles.totalValue}>{String(value)}</Text>
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

    page: { alignItems: 'center', paddingVertical: 24 },
    doc: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderLeftWidth: 1, borderColor: BORDER },

    rowLine: { flexDirection: 'row' },
    f1: { flex: 1 },
    f2: { flex: 2 },
    f3: { flex: 3 },

    cell: {
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: BORDER,
      paddingVertical: p(4),
      paddingHorizontal: p(2),
      alignItems: 'center',
      justifyContent: 'center',
    },
    gray: { backgroundColor: '#E7E7E7' },

    bold: { fontSize: f(8.5), fontWeight: '700', color: '#111', textAlign: 'center' },
    txt: { fontSize: f(8.5), color: '#111', textAlign: 'center' },
    dayTxt: { fontSize: f(8), fontWeight: '700', color: '#111', textAlign: 'center' },
    cellTxt: { fontSize: f(8), color: '#111', textAlign: 'center' },
    statusTxt: { fontWeight: '700' },

    totals: { flex: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: p(4) },
    totalItem: { flexDirection: 'row', alignItems: 'center', marginRight: p(8) },
    totalLabel: { fontSize: f(8.5), fontWeight: '700' },
    totalValue: { fontSize: f(8.5), fontWeight: '700', color: '#111', marginLeft: p(3) },

    page1: { fontSize: 12, color: '#333', marginTop: 14 },
  });
};

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
import type { AppStackParamList } from '../../navigation/types';
import { loadYearData, firstText, type YearMonthStat } from './reportData';

type R = RouteProp<AppStackParamList, 'YearlyReportViewer'>;

const ROWS: { key: string; label: string; color: string; get: (s: YearMonthStat) => number }[] = [
  { key: 'present', label: 'Present', color: ref.green, get: s => s.present },
  { key: 'absent', label: 'Absent', color: ref.red, get: s => s.absent },
  { key: 'wo', label: 'WO', color: ref.blue, get: s => s.wo },
];

const LABEL_W = 52;
const MONTH_W = 34;
const TOTAL_W = 44;
const REMARK_W = 52;

export default function YearlyReportViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const { type, from, to } = route.params;
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<YearMonthStat[]>([]);
  const [dept, setDept] = useState('—');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await loadYearData(from, to, user);
        if (!active) return;
        setStats(data.stats);
        setDept(data.dept);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [from, to, user]);

  const emp = { code: firstText(user?.code, user?.username) || '—', name: displayName(user), id: firstText(user?.id) };

  const naturalW = LABEL_W + stats.length * MONTH_W + TOTAL_W + REMARK_W;
  const availableW = width - 24;
  const scale = Math.min(1, availableW / Math.max(naturalW, 1));
  const docW = Math.round(naturalW * scale);
  const styles = useMemo(() => makeStyles(scale), [scale]);
  const cw = (w: number) => Math.round(w * scale);

  const onShare = () => {
    Share.share({ message: `${type} — ${dayjs(from).format('MMM YYYY')} to ${dayjs(to).format('MMM YYYY')}\n${emp.code} - ${emp.name}` }).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="arrow-left" size={24} color={ref.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yearly Report</Text>
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
              {/* Title */}
              <View style={styles.rowLine}>
                <View style={[styles.cell, styles.grow]}>
                  <Text style={styles.title}>{type}</Text>
                </View>
              </View>

              {/* Id / Dept / Company */}
              <View style={styles.rowLine}>
                <View style={[styles.cell, styles.gray, { width: cw(70) }]}><Text style={styles.bold}>{emp.id || ''}</Text></View>
                <View style={[styles.cell, styles.grow]}><Text style={styles.txt} numberOfLines={1}>{dept}</Text></View>
                <View style={[styles.cell, { width: cw(120) }]}><Text style={styles.txt} numberOfLines={1}>DEODAP</Text></View>
              </View>

              {/* Empcode / Name */}
              <View style={styles.rowLine}>
                <View style={[styles.cell, styles.gray, { width: cw(70) }]}><Text style={styles.bold}>Empcode</Text></View>
                <View style={[styles.cell, styles.f1]}><Text style={styles.txt} numberOfLines={1}>{emp.code}</Text></View>
                <View style={[styles.cell, styles.gray, { width: cw(56) }]}><Text style={styles.bold}>Name</Text></View>
                <View style={[styles.cell, styles.f2]}><Text style={styles.txt} numberOfLines={1}>{emp.name}</Text></View>
              </View>

              {/* Column headers */}
              <View style={styles.rowLine}>
                <View style={[styles.cell, { width: cw(LABEL_W) }]} />
                {stats.map(s => (
                  <View key={s.ym} style={[styles.cell, { width: cw(MONTH_W) }]}>
                    <Text style={styles.headYear}>{dayjs(s.ym).format('YYYY')}</Text>
                    <Text style={styles.headMonth}>{dayjs(s.ym).format('MMM')}</Text>
                  </View>
                ))}
                <View style={[styles.cell, { width: cw(TOTAL_W) }]}><Text style={styles.bold}>Total</Text></View>
                <View style={[styles.cell, { width: cw(REMARK_W) }]}><Text style={styles.bold}>Remark</Text></View>
              </View>

              {/* Data rows */}
              {ROWS.map(row => {
                const total = stats.reduce((a, s) => a + row.get(s), 0);
                return (
                  <View key={row.key} style={styles.rowLine}>
                    <View style={[styles.cell, { width: cw(LABEL_W) }]}>
                      <Text style={[styles.rowLabel, { color: row.color }]}>{row.label}</Text>
                    </View>
                    {stats.map(s => (
                      <View key={s.ym} style={[styles.cell, { width: cw(MONTH_W) }]}>
                        <Text style={[styles.count, { color: row.color }]}>{row.get(s)}</Text>
                      </View>
                    ))}
                    <View style={[styles.cell, { width: cw(TOTAL_W) }]}>
                      <Text style={[styles.count, { color: row.color }]}>{total}</Text>
                    </View>
                    <View style={[styles.cell, { width: cw(REMARK_W) }]} />
                  </View>
                );
              })}
            </View>

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

    page: { alignItems: 'center', paddingVertical: 24 },
    doc: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderLeftWidth: 1, borderColor: BORDER },

    rowLine: { flexDirection: 'row' },
    grow: { flex: 1 },
    f1: { flex: 1 },
    f2: { flex: 2 },

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

    title: { fontSize: f(11), fontWeight: '700', color: '#111', textAlign: 'center' },
    bold: { fontSize: f(9), fontWeight: '700', color: '#111', textAlign: 'center' },
    txt: { fontSize: f(9), color: '#111', textAlign: 'center' },

    headYear: { fontSize: f(8), fontWeight: '600', color: '#111', textAlign: 'center' },
    headMonth: { fontSize: f(8.5), fontWeight: '700', color: '#111', textAlign: 'center' },

    rowLabel: { fontSize: f(9), fontWeight: '700', textAlign: 'center' },
    count: { fontSize: f(9), fontWeight: '700', textAlign: 'center' },

    page1: { fontSize: 12, color: '#333', marginTop: 14 },
  });
};

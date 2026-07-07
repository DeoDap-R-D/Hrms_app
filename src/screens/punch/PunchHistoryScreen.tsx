import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { GradientHeader, Card, EmptyState, Loading, Badge, FadeInView } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import type { PunchRecord } from '../../api/types';
import { formatDate, formatClock, hmsToHM, attendanceStatus } from '../../utils/format';

/**
 * Full-screen punch history (pushed from the dashboard). The Attendance tab
 * shows the same data with month navigation; this view lists the current month.
 */
export default function PunchHistoryScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await svc.punchHistory({ month: dayjs().format('YYYY-MM') }));
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderItem = ({ item, index }: { item: PunchRecord; index: number }) => {
    const chip = attendanceStatus(item.status, colors);
    return (
      <FadeInView index={index}>
        <Card style={styles.item}>
          <View style={styles.row}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{formatDate(item.date, 'DD')}</Text>
              <Text style={styles.dateMon}>{formatDate(item.date, 'MMM')}</Text>
            </View>
            <View style={styles.flex}>
              <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                  <Icon name="login-variant" size={15} color={colors.primary} />
                  <Text style={styles.timeText}>{formatClock(item.intime)}</Text>
                </View>
                <View style={styles.timeBlock}>
                  <Icon name="logout-variant" size={15} color={colors.danger} />
                  <Text style={styles.timeText}>{formatClock(item.outtime)}</Text>
                </View>
              </View>
              <Badge label={chip.label} color={chip.color} bg={chip.bg} />
            </View>
            {item.worktime && item.worktime !== '00:00:00' ? (
              <Text style={styles.work}>{hmsToHM(item.worktime)}</Text>
            ) : null}
          </View>
        </Card>
      </FadeInView>
    );
  };

  return (
    <View style={styles.root}>
      <GradientHeader title="Punch History" subtitle={dayjs().format('MMMM YYYY')} onBack={() => navigation.goBack()} />
      {firstLoad && loading ? (
        <Loading message="Loading history…" fullscreen={false} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item, i) => String(item.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState icon="calendar-blank-outline" title="No records yet" message="This month's attendance will appear here." />
          }
        />
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },
    flex: { flex: 1 },
    listContent: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl, flexGrow: 1 },
    item: { marginBottom: t.spacing.md },
    row: { flexDirection: 'row', alignItems: 'center' },
    dateBox: {
      width: 52,
      height: 52,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    dateDay: { fontSize: 18, fontWeight: '800', color: t.colors.primary, lineHeight: 20 },
    dateMon: { fontSize: 11, fontWeight: '600', color: t.colors.primary, textTransform: 'uppercase' },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: t.spacing.sm },
    timeBlock: { flexDirection: 'row', alignItems: 'center', marginRight: t.spacing.lg },
    timeText: { fontSize: 14, fontWeight: '600', color: t.colors.text, marginLeft: 4 },
    work: { fontSize: 12, fontWeight: '700', color: t.colors.primary, marginLeft: t.spacing.sm },
  });

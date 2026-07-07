import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { GradientHeader, Card, EmptyState, Loading, DateField, FadeInView } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import type { WorkReport } from '../../api/types';
import { formatDate, formatClock, formatTime } from '../../utils/format';
import type { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

/** Best-available time for a report: the submit time, else the created timestamp. */
function reportTime(r: WorkReport): string {
  if (r.submit_time) {
    const t = formatClock(r.submit_time);
    if (t !== '—') return t;
  }
  return r.created_at ? formatTime(r.created_at) : '';
}

export default function WorkReportsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      setReports(await svc.listWorkReports({ date: d }));
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(date);
    }, [load, date]),
  );

  const renderItem = ({ item, index }: { item: WorkReport; index: number }) => {
    const time = reportTime(item);
    return (
      <FadeInView index={index}>
        <Card style={styles.item}>
          <View style={styles.itemHeader}>
            <View style={styles.taskIcon}>
              <Icon name="checkbox-marked-circle-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.task} numberOfLines={2}>
              {item.task || 'Untitled task'}
            </Text>
            {time ? (
              <View style={styles.timePill}>
                <Icon name="clock-outline" size={12} color={colors.primary} />
                <Text style={styles.timeText}>{time}</Text>
              </View>
            ) : null}
          </View>

          {item.outcome ? (
            <View style={styles.detailRow}>
              <Icon name="flag-checkered" size={15} color={colors.success} />
              <Text style={styles.detailText} numberOfLines={3}>{item.outcome}</Text>
            </View>
          ) : null}

          {item.remarks ? (
            <View style={styles.detailRow}>
              <Icon name="comment-text-outline" size={15} color={colors.textSubtle} />
              <Text style={[styles.detailText, styles.remarksText]} numberOfLines={3}>{item.remarks}</Text>
            </View>
          ) : null}
        </Card>
      </FadeInView>
    );
  };

  return (
    <View style={styles.root}>
      <GradientHeader
        title="Work Reports"
        subtitle="Log your daily work"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('CreateWorkReport')}>
            <Icon name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.filterBar}>
        <DateField value={date} onChange={setDate} maximumDate={new Date()} />
      </View>

      {firstLoad && loading ? (
        <Loading message="Loading reports…" fullscreen={false} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item, i) => String(item.id ?? i)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={11}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(date)} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="file-document-outline"
              title="No reports for this day"
              message="Tap + to add a work report for the selected date."
            />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigation.navigate('CreateWorkReport')}>
        <Icon name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Row direction gives the DateField (flex:1) a definite height so it can't
    // collapse and let the list overlap it.
    filterBar: { flexDirection: 'row', paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg },
    list: { flex: 1 },
    listContent: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.xs, paddingBottom: 100, flexGrow: 1 },
    item: { marginBottom: t.spacing.md },
    itemHeader: { flexDirection: 'row', alignItems: 'center' },
    taskIcon: {
      width: 38,
      height: 38,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    task: { flex: 1, fontSize: 15, fontWeight: '700', color: t.colors.text, letterSpacing: -0.2 },
    timePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.primarySoft,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 4,
      borderRadius: t.radius.pill,
      marginLeft: t.spacing.sm,
    },
    timeText: { fontSize: 12, fontWeight: '800', color: t.colors.primary, marginLeft: 4 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: t.spacing.md },
    detailText: { flex: 1, fontSize: 13.5, color: t.colors.textMuted, marginLeft: t.spacing.sm, lineHeight: 19 },
    remarksText: { color: t.colors.textSubtle, fontStyle: 'italic' },
    fab: {
      position: 'absolute',
      right: t.spacing.lg,
      bottom: t.spacing.lg,
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: t.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...t.shadows.accent,
    },
  });

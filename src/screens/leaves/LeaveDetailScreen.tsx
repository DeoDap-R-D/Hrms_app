import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Screen, GradientHeader, Card, Badge, Loading, EmptyState } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import type { Leave } from '../../api/types';
import { formatDate, formatDateTime, statusStyle } from '../../utils/format';
import type { AppStackParamList } from '../../navigation/types';

type R = RouteProp<AppStackParamList, 'LeaveDetail'>;

export default function LeaveDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = route.params;
  const [leave, setLeave] = useState<Leave | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLeave(await svc.getLeave(id));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const chip = statusStyle(leave?.status, colors);

  return (
    <Screen
      scroll
      padded={false}
      edges={['left', 'right']}
      header={<GradientHeader title="Leave Details" onBack={() => navigation.goBack()} />}>
      <View style={styles.body}>
        {loading ? (
          <Loading message="Loading details…" fullscreen={false} />
        ) : error || !leave ? (
          <EmptyState icon="alert-circle-outline" title="Could not load leave" message="Please try again later." />
        ) : (
          <>
            <Card style={styles.statusCard}>
              <View style={styles.statusTop}>
                <View style={styles.statusIcon}>
                  <Icon name="calendar-account" size={26} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.statusLabel}>Leave request</Text>
                  <Text style={styles.statusDays}>
                    {leave.total_leave_days ?? '—'} day{Number(leave.total_leave_days) === 1 ? '' : 's'}
                  </Text>
                </View>
                <Badge label={chip.label} color={chip.color} bg={chip.bg} />
              </View>
            </Card>

            <Card style={styles.detailCard}>
              <DetailRow icon="calendar-start" label="From" value={formatDate(leave.leave_date_from)} styles={styles} iconColor={colors.textMuted} />
              <Divider styles={styles} />
              <DetailRow icon="calendar-end" label="To" value={formatDate(leave.leave_date_to)} styles={styles} iconColor={colors.textMuted} />
              {leave.leave_time_from ? (
                <>
                  <Divider styles={styles} />
                  <DetailRow icon="clock-start" label="Time from" value={leave.leave_time_from} styles={styles} iconColor={colors.textMuted} />
                </>
              ) : null}
              {leave.leave_time_to ? (
                <>
                  <Divider styles={styles} />
                  <DetailRow icon="clock-end" label="Time to" value={leave.leave_time_to} styles={styles} iconColor={colors.textMuted} />
                </>
              ) : null}
              {leave.created_at ? (
                <>
                  <Divider styles={styles} />
                  <DetailRow icon="clock-outline" label="Applied on" value={formatDateTime(leave.created_at)} styles={styles} iconColor={colors.textMuted} />
                </>
              ) : null}
            </Card>

            <Card style={styles.detailCard}>
              <Text style={styles.reasonLabel}>Reason</Text>
              <Text style={styles.reasonText}>{leave.reason_for_leave || 'No reason provided.'}</Text>
            </Card>
          </>
        )}
      </View>
    </Screen>
  );
}

function DetailRow({
  icon,
  label,
  value,
  styles,
  iconColor,
}: {
  icon: string;
  label: string;
  value: string;
  styles: ReturnType<typeof makeStyles>;
  iconColor: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} size={20} color={iconColor} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Divider({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.divider} />;
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    body: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg },
    statusCard: { marginBottom: t.spacing.lg },
    statusTop: { flexDirection: 'row', alignItems: 'center' },
    statusIcon: {
      width: 50,
      height: 50,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    statusLabel: { fontSize: 13, color: t.colors.textMuted },
    statusDays: { fontSize: 18, fontWeight: '700', color: t.colors.text, marginTop: 2 },
    detailCard: { marginBottom: t.spacing.lg },
    detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: t.spacing.sm },
    detailLabel: { fontSize: 14, color: t.colors.textMuted, marginLeft: t.spacing.md, flex: 1 },
    detailValue: { fontSize: 14, color: t.colors.text, fontWeight: '600' },
    divider: { height: 1, backgroundColor: t.colors.border },
    reasonLabel: { fontSize: 13, color: t.colors.textMuted, fontWeight: '600', marginBottom: t.spacing.sm },
    reasonText: { fontSize: 15, color: t.colors.text, lineHeight: 22 },
  });

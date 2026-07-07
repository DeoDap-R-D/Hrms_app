import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Screen, GradientHeader, Card, Button, Input, DateField } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import { getErrorMessage } from '../../api/client';

export default function CreateLeaveScreen() {
  const navigation = useNavigation();
  const { colors, spacing } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [from, setFrom] = useState(dayjs().format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalDays = useMemo(() => {
    const a = dayjs(from);
    const b = dayjs(to);
    if (!a.isValid() || !b.isValid()) return 0;
    const diff = b.diff(a, 'day') + 1;
    return diff > 0 ? diff : 0;
  }, [from, to]);

  const onSubmit = async () => {
    if (!reason.trim()) return Alert.alert('Reason required', 'Please describe the reason for your leave.');
    if (totalDays <= 0) return Alert.alert('Invalid dates', 'The end date must be on or after the start date.');
    setSubmitting(true);
    try {
      await svc.createLeave({
        leave_date_from: from,
        leave_date_to: to,
        reason_for_leave: reason.trim(),
        total_leave_days: String(totalDays),
        leave_time_from: '',
        leave_time_to: '',
      });
      Alert.alert('Leave submitted', 'Your leave request has been sent for approval.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Could not submit', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      padded={false}
      edges={['left', 'right']}
      header={<GradientHeader title="Apply for Leave" subtitle="Fill in your request" onBack={() => navigation.goBack()} />}>
      <View style={styles.body}>
        <Card>
          <View style={styles.dateRow}>
            <DateField label="From" value={from} onChange={setFrom} />
            <View style={{ width: spacing.md }} />
            <DateField label="To" value={to} onChange={setTo} minimumDate={dayjs(from).toDate()} />
          </View>

          <View style={styles.summary}>
            <Icon name="calendar-check-outline" size={18} color={colors.primary} />
            <Text style={styles.summaryText}>
              Total: <Text style={styles.summaryStrong}>{totalDays} day{totalDays === 1 ? '' : 's'}</Text>
            </Text>
          </View>

          <Input
            label="Reason"
            icon="text-box-outline"
            placeholder="e.g. Personal work, medical, vacation…"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            style={styles.textarea}
          />
        </Card>

        <Button
          title="Submit Request"
          icon="send"
          loading={submitting}
          onPress={onSubmit}
          style={styles.submit}
        />
      </View>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    body: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg },
    dateRow: { flexDirection: 'row' },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.primarySoft,
      borderRadius: t.radius.md,
      padding: t.spacing.md,
      marginBottom: t.spacing.lg,
    },
    summaryText: { fontSize: 14, color: t.colors.text, marginLeft: t.spacing.sm },
    summaryStrong: { fontWeight: '700', color: t.colors.primary },
    textarea: { height: 90, textAlignVertical: 'top' },
    submit: { marginTop: t.spacing.lg },
  });

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

import { Screen, GradientHeader, Card, Button, Input, DateField, Select } from '../../components/ui';
import type { SelectOption } from '../../components/ui';
import { useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import { getErrorMessage } from '../../api/client';

export default function CreateWorkReportScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(makeStyles);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [task, setTask] = useState('');
  const [outcome, setOutcome] = useState('');
  const [remarks, setRemarks] = useState('');
  const [timeSlot, setTimeSlot] = useState<number | null>(null);
  const [slots, setSlots] = useState<SelectOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const times = await svc.workReportTimes();
        setSlots(
          times.map(t => ({
            value: t.id ?? 0,
            label: t.label || t.time || t.slot || `Slot ${t.id}`,
          })),
        );
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, []);

  const onSubmit = async () => {
    if (!task.trim()) return Alert.alert('Task required', 'Please describe the task you worked on.');
    if (timeSlot == null) return Alert.alert('Time slot required', 'Please select an hourly time slot.');
    setSubmitting(true);
    try {
      await svc.createWorkReport({
        date,
        task: task.trim(),
        outcome: outcome.trim(),
        wr_time: timeSlot,
        report_type: '',
        screen_shot: '',
        remarks: remarks.trim(),
      });
      Alert.alert('Report saved', 'Your work report has been submitted.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Could not save', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      padded={false}
      edges={['left', 'right']}
      header={<GradientHeader title="New Work Report" subtitle="Log what you worked on" onBack={() => navigation.goBack()} />}>
      <View style={styles.body}>
        <Card>
          <View style={styles.row}>
            <DateField label="Date" value={date} onChange={setDate} maximumDate={new Date()} />
          </View>
          <Select
            label="Time slot"
            icon="clock-outline"
            placeholder="Select hourly slot"
            value={timeSlot}
            options={slots}
            loading={loadingSlots}
            onChange={v => setTimeSlot(Number(v))}
          />
          <Input
            label="Task"
            icon="clipboard-text-outline"
            placeholder="What did you work on?"
            value={task}
            onChangeText={setTask}
            multiline
            style={styles.area}
          />
          <Input
            label="Outcome"
            icon="flag-checkered"
            placeholder="What was achieved?"
            value={outcome}
            onChangeText={setOutcome}
            multiline
            style={styles.area}
          />
          <Input
            label="Remarks (optional)"
            icon="comment-outline"
            placeholder="Any extra notes"
            value={remarks}
            onChangeText={setRemarks}
          />
        </Card>
        <Button title="Save Report" icon="content-save-outline" loading={submitting} onPress={onSubmit} style={styles.submit} />
      </View>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    body: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg },
    row: { flexDirection: 'row' },
    area: { height: 80, textAlignVertical: 'top' },
    submit: { marginTop: t.spacing.lg },
  });

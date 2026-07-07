import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Screen, GradientHeader, Card, Button, EmptyState, Loading, FadeInView } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import { getErrorMessage } from '../../api/client';
import type { TrackingType } from '../../api/types';
import { lookupName } from '../../utils/format';

export default function TrackingScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [types, setTypes] = useState<TrackingType[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setTypes(await svc.trackingTypes());
      } catch {
        setTypes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onStart = async () => {
    if (selected == null) return Alert.alert('Select a type', 'Please choose a tracking type first.');
    setSubmitting(true);
    try {
      await svc.createTracking(selected);
      Alert.alert('Tracking started', 'Your tracking entry has been created.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Could not start', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      padded={false}
      edges={['left', 'right']}
      header={<GradientHeader title="Tracking" subtitle="Start an activity" onBack={() => navigation.goBack()} />}>
      <View style={styles.body}>
        {loading ? (
          <Loading message="Loading types…" fullscreen={false} />
        ) : types.length === 0 ? (
          <EmptyState icon="map-marker-off-outline" title="No tracking types" message="No tracking types are available right now." />
        ) : (
          <>
            <Text style={styles.hint}>Choose a tracking type to begin.</Text>
            {types.map((t, index) => {
              const active = t.id === selected;
              return (
                <FadeInView key={String(t.id)} index={index}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setSelected(t.id ?? null)}>
                    <Card style={[styles.typeCard, active && styles.typeActive]}>
                      <View style={[styles.typeIcon, active && styles.typeIconActive]}>
                        <Icon name="map-marker-radius-outline" size={22} color={active ? '#FFFFFF' : colors.primary} />
                      </View>
                      <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{lookupName(t)}</Text>
                      <Icon
                        name={active ? 'check-circle' : 'circle-outline'}
                        size={22}
                        color={active ? colors.primary : colors.border}
                      />
                    </Card>
                  </TouchableOpacity>
                </FadeInView>
              );
            })}
            <Button title="Start Tracking" icon="play-circle-outline" loading={submitting} onPress={onStart} style={styles.submit} />
          </>
        )}
      </View>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    body: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg },
    hint: { fontSize: 14, color: t.colors.textMuted, marginBottom: t.spacing.md },
    typeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: t.spacing.md },
    typeActive: { borderWidth: 1.5, borderColor: t.colors.primary },
    typeIcon: {
      width: 44,
      height: 44,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    typeIconActive: { backgroundColor: t.colors.primary },
    typeLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: t.colors.text },
    typeLabelActive: { color: t.colors.primary },
    submit: { marginTop: t.spacing.lg },
  });

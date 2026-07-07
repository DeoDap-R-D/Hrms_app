import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Screen, GradientHeader, Card, Button, Input, FadeInView } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import { getErrorMessage } from '../../api/client';
import { fetchLocation, Coords } from '../../utils/location';
import { onCheckedIn, onCheckedOut } from '../../utils/notifications';
import type { AppStackParamList } from '../../navigation/types';

type R = RouteProp<AppStackParamList, 'Punch'>;

export default function PunchScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const type: 'in' | 'out' = route.params?.type === 'out' ? 'out' : 'in';
  const isIn = type === 'in';

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(true);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLocating(true);
      const c = await fetchLocation();
      setCoords(c);
      setLocating(false);
    })();
  }, []);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await svc.punch({
        type,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        note: note.trim() || undefined,
      });
      // Clear today's reminder now that the punch is done.
      if (isIn) onCheckedIn();
      else onCheckedOut();
      Alert.alert(
        isIn ? 'Punched In' : 'Punched Out',
        isIn ? 'Have a productive day!' : 'See you next time!',
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert('Punch failed', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const tone = isIn ? colors.success : colors.danger;
  const toneSoft = isIn ? colors.successSoft : colors.dangerSoft;

  return (
    <Screen
      scroll
      padded={false}
      edges={['left', 'right']}
      header={
        <GradientHeader
          title={isIn ? 'Punch In' : 'Punch Out'}
          subtitle="Confirm your details below"
          onBack={() => navigation.goBack()}
        />
      }>
      <View style={styles.body}>
        {/* Hero */}
        <FadeInView>
          <Card style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: toneSoft }]}>
              <Icon name={isIn ? 'login-variant' : 'logout-variant'} size={48} color={tone} />
            </View>
            <Text style={styles.heroTitle}>{isIn ? 'Ready to Punch In' : 'Ready to Punch Out'}</Text>
            <Text style={styles.heroSub}>
              {isIn
                ? 'Confirm your location and tap below to start your day.'
                : 'Confirm your details and tap below to clock out.'}
            </Text>
          </Card>
        </FadeInView>

        {/* Location */}
        <FadeInView index={1}>
          <Card style={styles.locCard}>
            <View style={styles.locRow}>
              <View style={[styles.locIcon, { backgroundColor: coords ? colors.successSoft : colors.warningSoft }]}>
                <Icon
                  name={coords ? 'map-marker-check' : 'map-marker-alert'}
                  size={22}
                  color={coords ? colors.success : colors.warning}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.locTitle}>{locating ? 'Fetching location…' : coords ? 'Location captured' : 'Location unavailable'}</Text>
                <Text style={styles.locSub}>
                  {coords
                    ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                    : locating
                    ? 'Please wait a moment'
                    : 'You can still punch without it'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  setLocating(true);
                  setCoords(await fetchLocation());
                  setLocating(false);
                }}>
                <Icon name="refresh" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        </FadeInView>

        <Input
          label="Note (optional)"
          icon="note-text-outline"
          placeholder="Add a note about this punch"
          value={note}
          onChangeText={setNote}
          multiline
        />

        <Button
          title={isIn ? 'Confirm Punch In' : 'Confirm Punch Out'}
          icon={isIn ? 'login-variant' : 'logout-variant'}
          variant={isIn ? 'primary' : 'danger'}
          loading={submitting}
          onPress={onSubmit}
        />
      </View>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    body: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg },

    hero: { alignItems: 'center', paddingVertical: t.spacing.xl },
    heroIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontSize: 18, fontWeight: '800', color: t.colors.text, marginTop: t.spacing.lg, letterSpacing: -0.3 },
    heroSub: { fontSize: 13.5, color: t.colors.textMuted, textAlign: 'center', marginTop: t.spacing.xs, lineHeight: 19, paddingHorizontal: t.spacing.md },

    locCard: { marginTop: t.spacing.lg, marginBottom: t.spacing.lg },
    locRow: { flexDirection: 'row', alignItems: 'center' },
    locIcon: {
      width: 44,
      height: 44,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    locTitle: { fontSize: 15, fontWeight: '600', color: t.colors.text },
    locSub: { fontSize: 13, color: t.colors.textMuted, marginTop: 2 },
  });

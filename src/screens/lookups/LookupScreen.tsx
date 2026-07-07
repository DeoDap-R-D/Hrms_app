import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { GradientHeader, Card, EmptyState, Loading, FadeInView } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import type { LookupItem, Holiday } from '../../api/types';
import { lookupName, formatDate, shiftTiming } from '../../utils/format';
import type { AppStackParamList, LookupKind } from '../../navigation/types';

type R = RouteProp<AppStackParamList, 'Lookup'>;

const CONFIG: Record<LookupKind, { icon: string; fetch: () => Promise<LookupItem[]> }> = {
  departments: { icon: 'office-building-outline', fetch: svc.departments },
  designations: { icon: 'card-account-details-outline', fetch: svc.designations },
  shifts: { icon: 'clock-time-four-outline', fetch: svc.shifts },
  'work-locations': { icon: 'map-marker-outline', fetch: svc.workLocations },
  holidays: { icon: 'beach', fetch: svc.holidays },
};

export default function LookupScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const { kind, title } = route.params;
  const config = CONFIG[kind];

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [items, setItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await config.fetch());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, [config]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderItem = ({ item, index }: { item: LookupItem; index: number }) => {
    const date = (item as Holiday).date || (item as Holiday).holiday_date;
    return (
      <FadeInView index={index}>
        <Card style={styles.item}>
          <View style={styles.row}>
            <View style={styles.iconChip}>
              <Icon name={config.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.title}>{lookupName(item)}</Text>
              {kind === 'holidays' && date ? <Text style={styles.sub}>{formatDate(date)}</Text> : null}
              {kind === 'shifts' && shiftTiming(item) ? <Text style={styles.sub}>{shiftTiming(item)}</Text> : null}
            </View>
          </View>
        </Card>
      </FadeInView>
    );
  };

  return (
    <View style={styles.root}>
      <GradientHeader title={title} onBack={() => navigation.goBack()} />
      {firstLoad && loading ? (
        <Loading message="Loading…" fullscreen={false} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => String(item.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="folder-open-outline" title={`No ${title.toLowerCase()}`} message="Nothing to show here yet." />}
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
    iconChip: {
      width: 40,
      height: 40,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    title: { fontSize: 15, fontWeight: '600', color: t.colors.text },
    sub: { fontSize: 13, color: t.colors.textMuted, marginTop: 2 },
  });

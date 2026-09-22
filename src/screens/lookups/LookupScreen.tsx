import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FocusAwareStatusBar } from '../../components/ui';
import { ref } from '../../theme/refColors';
import * as svc from '../../api/services';
import type { LookupItem, Holiday } from '../../api/types';
import { lookupName, formatDate, shiftTiming } from '../../utils/format';
import type { AppStackParamList, LookupKind } from '../../navigation/types';

type R = RouteProp<AppStackParamList, 'Lookup'>;

const CONFIG: Record<LookupKind, { icon: string; empty: string }> = {
  departments: { icon: 'office-building-outline', empty: 'office-building-outline' },
  designations: { icon: 'card-account-details-outline', empty: 'card-account-details-outline' },
  shifts: { icon: 'clock-time-four-outline', empty: 'clock-outline' },
  'work-locations': { icon: 'map-marker-outline', empty: 'map-marker-off-outline' },
  holidays: { icon: 'calendar-star', empty: 'calendar-blank-outline' },
};

const FETCH: Record<LookupKind, () => Promise<LookupItem[]>> = {
  departments: svc.departments,
  designations: svc.designations,
  shifts: svc.shifts,
  'work-locations': svc.workLocations,
  holidays: svc.holidays,
};

export default function LookupScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const { kind, title } = route.params;
  const config = CONFIG[kind];

  const [items, setItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await FETCH[kind]());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, [kind]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderItem = ({ item }: { item: LookupItem }) => {
    const date = (item as Holiday).date || (item as Holiday).holiday_date;
    const sub =
      kind === 'holidays' && date ? formatDate(date) : kind === 'shifts' ? shiftTiming(item) : null;
    return (
      <View style={styles.item}>
        <View style={styles.iconTile}>
          <Icon name={config.icon} size={22} color={ref.blue} />
        </View>
        <View style={styles.itemText}>
          <Text style={styles.itemTitle}>{lookupName(item)}</Text>
          {sub ? <Text style={styles.itemSub}>{sub}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />

      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="arrow-left" size={24} color={ref.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </SafeAreaView>

      {firstLoad && loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ref.blue} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => String(item.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[ref.blue]} tintColor={ref.blue} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Icon name={config.empty} size={40} color={ref.blue} />
              </View>
              <Text style={styles.emptyTitle}>No {title.toLowerCase()}</Text>
              <Text style={styles.emptySub}>There are no {title.toLowerCase()} to show right now.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ref.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: { backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: ref.text, marginLeft: 20, letterSpacing: -0.3 },

  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconTile: { width: 44, height: 44, borderRadius: 12, backgroundColor: ref.blueSoft, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: ref.text, letterSpacing: -0.2 },
  itemSub: { fontSize: 13.5, color: ref.textMuted, marginTop: 3, fontWeight: '500' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 32 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: ref.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: ref.text, textTransform: 'capitalize' },
  emptySub: { fontSize: 14, color: ref.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

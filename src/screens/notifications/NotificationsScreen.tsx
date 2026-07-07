import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { GradientHeader, Card, EmptyState, Loading, FadeInView } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import { getLocalNotifications, markLocalNotificationRead } from '../../api/storage';
import type { NotificationItem } from '../../api/types';
import { formatDateTime } from '../../utils/format';

function timeOf(n: NotificationItem): number {
  const t = n.created_at ? new Date(n.created_at).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function isRead(n: NotificationItem): boolean {
  return !!(n.read_at || n.is_read === true || Number(n.is_read) === 1);
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [server, local] = await Promise.all([
        svc.listNotifications().catch(() => [] as NotificationItem[]),
        getLocalNotifications(),
      ]);
      const merged = [...(local as NotificationItem[]), ...server].sort(
        (a, b) => timeOf(b) - timeOf(a),
      );
      setItems(merged);
    } catch {
      setItems([]);
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

  const onPress = async (n: NotificationItem) => {
    if (n.id == null || isRead(n)) return;
    setItems(prev => prev.map(i => (i.id === n.id ? { ...i, read_at: new Date().toISOString(), is_read: 1 } : i)));
    try {
      if (typeof n.id === 'string') {
        await markLocalNotificationRead(n.id); // device-local reminder
      } else {
        await svc.markNotificationRead(n.id);
      }
    } catch {
      // revert silently on failure is optional; keep optimistic
    }
  };

  const renderItem = ({ item, index }: { item: NotificationItem; index: number }) => {
    const read = isRead(item);
    return (
      <FadeInView index={index}>
        <Card style={[styles.item, !read && styles.unread]} onPress={() => onPress(item)}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: read ? colors.surfaceAlt : colors.primarySoft }]}>
              <Icon name={read ? 'bell-check-outline' : 'bell-ring-outline'} size={20} color={read ? colors.textSubtle : colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.title, !read && styles.titleUnread]} numberOfLines={1}>
                {item.title || 'Notification'}
              </Text>
              <Text style={styles.message} numberOfLines={2}>
                {item.message || item.body || ''}
              </Text>
              {item.created_at ? <Text style={styles.time}>{formatDateTime(item.created_at)}</Text> : null}
            </View>
            {!read ? <View style={styles.dot} /> : null}
          </View>
        </Card>
      </FadeInView>
    );
  };

  return (
    <View style={styles.root}>
      <GradientHeader title="Notifications" subtitle="Stay up to date" onBack={() => navigation.goBack()} />
      {firstLoad && loading ? (
        <Loading message="Loading…" fullscreen={false} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => String(item.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={11}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState icon="bell-sleep-outline" title="No notifications" message="You're all caught up!" />
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
    unread: { borderLeftWidth: 3, borderLeftColor: t.colors.primary },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    icon: {
      width: 40,
      height: 40,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    title: { fontSize: 15, fontWeight: '600', color: t.colors.text },
    titleUnread: { fontWeight: '700' },
    message: { fontSize: 13, color: t.colors.textMuted, marginTop: 2, lineHeight: 18 },
    time: { fontSize: 11, color: t.colors.textSubtle, marginTop: 6 },
    dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.primary, marginTop: 4, marginLeft: t.spacing.sm },
  });

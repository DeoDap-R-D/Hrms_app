import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { GradientHeader, Card, Badge, EmptyState, Loading, FadeInView } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import { getErrorMessage } from '../../api/client';
import type { Policy } from '../../api/types';
import { lookupName } from '../../utils/format';

function isAccepted(p: Policy): boolean {
  return !!(p.accepted === true || Number(p.accepted) === 1);
}

export default function PoliciesScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [items, setItems] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await svc.policies());
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

  const accept = async (p: Policy) => {
    if (p.id == null) return;
    setBusy(p.id);
    try {
      await svc.acceptPolicy(p.id);
      setItems(prev => prev.map(i => (i.id === p.id ? { ...i, accepted: 1 } : i)));
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const renderItem = ({ item, index }: { item: Policy; index: number }) => {
    const accepted = isAccepted(item);
    return (
      <FadeInView index={index}>
        <Card style={styles.item}>
          <View style={styles.header}>
            <View style={styles.iconChip}>
              <Icon name="shield-check-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.title}>{lookupName(item)}</Text>
          </View>
          {item.description || item.content ? (
            <Text style={styles.desc} numberOfLines={4}>
              {item.description || item.content}
            </Text>
          ) : null}
          <View style={styles.footer}>
            {accepted ? (
              <Badge label="Accepted" color={colors.success} bg={colors.successSoft} />
            ) : (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => accept(item)}
                disabled={busy === item.id}>
                <Icon name="check" size={16} color="#FFFFFF" />
                <Text style={styles.acceptText}>{busy === item.id ? 'Accepting…' : 'Accept'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </FadeInView>
    );
  };

  return (
    <View style={styles.root}>
      <GradientHeader title="Policies" subtitle="Company policies" onBack={() => navigation.goBack()} />
      {firstLoad && loading ? (
        <Loading message="Loading policies…" fullscreen={false} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => String(item.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="shield-outline" title="No policies" message="No company policies to show." />}
        />
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },
    listContent: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl, flexGrow: 1 },
    item: { marginBottom: t.spacing.md },
    header: { flexDirection: 'row', alignItems: 'center' },
    iconChip: {
      width: 40,
      height: 40,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    title: { flex: 1, fontSize: 16, fontWeight: '700', color: t.colors.text },
    desc: { fontSize: 14, color: t.colors.textMuted, lineHeight: 20, marginTop: t.spacing.md },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: t.spacing.md },
    acceptBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.primary,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.pill,
    },
    acceptText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginLeft: 4 },
  });

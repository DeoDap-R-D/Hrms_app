import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { GradientHeader, Card, EmptyState, Loading, FadeInView } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import * as svc from '../../api/services';
import type { LookupItem } from '../../api/types';
import { lookupName } from '../../utils/format';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Dept = LookupItem & { parent_id?: number | null; code?: string };

const byCode = (a: Dept, b: Dept) =>
  String(a.code ?? a.name ?? '').localeCompare(String(b.code ?? b.name ?? ''), undefined, { numeric: true });

/** Drop the leading "4A." code prefix from a sub-department name (shown as a badge instead). */
function subName(item: Dept): string {
  const name = lookupName(item);
  const code = String(item.code ?? '').trim();
  if (code && name.toUpperCase().startsWith(code.toUpperCase())) {
    const rest = name.slice(code.length).replace(/^[\s.\-:]+/, '').trim();
    if (rest) return rest;
  }
  return name;
}

export default function DepartmentsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [items, setItems] = useState<Dept[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await svc.departments()) as Dept[]);
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

  // Group into parents (parent_id == null) and their sub-departments.
  const { roots, childrenByParent } = useMemo(() => {
    const byParent = new Map<number, Dept[]>();
    const rootList: Dept[] = [];
    items.forEach(d => {
      if (d.parent_id == null) {
        rootList.push(d);
      } else {
        const arr = byParent.get(d.parent_id) ?? [];
        arr.push(d);
        byParent.set(d.parent_id, arr);
      }
    });
    rootList.sort(byCode);
    byParent.forEach(arr => arr.sort(byCode));
    return { roots: rootList, childrenByParent: byParent };
  }, [items]);

  const toggle = (id?: number) => {
    if (id == null) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderItem = ({ item, index }: { item: Dept; index: number }) => {
    const kids = item.id != null ? childrenByParent.get(item.id) ?? [] : [];
    const hasKids = kids.length > 0;
    const isOpen = item.id != null && expanded.has(item.id);
    return (
      <FadeInView index={Math.min(index, 8)}>
        <Card padded={false} style={styles.card}>
          <TouchableOpacity
            activeOpacity={hasKids ? 0.7 : 1}
            onPress={() => hasKids && toggle(item.id)}
            style={styles.parentRow}>
            <View style={styles.iconChip}>
              <Icon name="office-building-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.parentName} numberOfLines={2}>{lookupName(item)}</Text>
            {hasKids ? (
              <View style={styles.trailing}>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{kids.length}</Text>
                </View>
                <View style={[styles.chevWrap, isOpen && styles.chevWrapOpen]}>
                  <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={20} color={isOpen ? colors.primary : colors.textMuted} />
                </View>
              </View>
            ) : null}
          </TouchableOpacity>

          {isOpen && hasKids ? (
            <View style={styles.childrenWrap}>
              {kids.map((k, i) => (
                <View key={String(k.id ?? i)} style={[styles.childRow, i < kids.length - 1 && styles.childBorder]}>
                  {k.code ? (
                    <View style={styles.codeChip}>
                      <Text style={styles.codeChipText}>{String(k.code)}</Text>
                    </View>
                  ) : (
                    <Icon name="subdirectory-arrow-right" size={16} color={colors.textSubtle} style={styles.childArrow} />
                  )}
                  <Text style={styles.childName} numberOfLines={2}>{subName(k)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      </FadeInView>
    );
  };

  return (
    <View style={styles.root}>
      <GradientHeader title="Departments" subtitle="Tap a department to view its sub-departments" onBack={() => navigation.goBack()} />
      {firstLoad && loading ? (
        <Loading message="Loading departments…" fullscreen={false} />
      ) : (
        <FlatList
          data={roots}
          keyExtractor={(item, i) => String(item.id ?? i)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="office-building-outline" title="No departments" message="Nothing to show here yet." />}
        />
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },
    listContent: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl, flexGrow: 1 },
    card: { marginBottom: t.spacing.md, overflow: 'hidden' },

    parentRow: { flexDirection: 'row', alignItems: 'center', padding: t.spacing.lg },
    iconChip: {
      width: 40,
      height: 40,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    parentName: { flex: 1, fontSize: 15, fontWeight: '700', color: t.colors.text, letterSpacing: -0.2 },
    trailing: { flexDirection: 'row', alignItems: 'center', marginLeft: t.spacing.sm },
    countPill: { minWidth: 24, paddingHorizontal: 7, paddingVertical: 2, borderRadius: t.radius.pill, backgroundColor: t.colors.primarySoft, alignItems: 'center', marginRight: t.spacing.xs },
    countText: { fontSize: 12, fontWeight: '800', color: t.colors.primary },
    chevWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    chevWrapOpen: { backgroundColor: t.colors.primarySoft },

    childrenWrap: {
      backgroundColor: t.colors.surfaceAlt,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
    childRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: t.spacing.md, paddingHorizontal: t.spacing.lg },
    childBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border },
    childArrow: { marginRight: t.spacing.sm },
    codeChip: {
      minWidth: 40,
      height: 26,
      paddingHorizontal: 8,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.md,
    },
    codeChipText: { fontSize: 12, fontWeight: '800', color: t.colors.primary, letterSpacing: 0.2 },
    childName: { flex: 1, fontSize: 14, fontWeight: '600', color: t.colors.text },
  });

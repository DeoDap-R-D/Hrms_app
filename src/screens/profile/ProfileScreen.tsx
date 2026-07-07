import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FocusAwareStatusBar } from '../../components/ui';
import { ref } from '../../theme/refColors';
import { useAuth } from '../../context/AuthContext';
import { displayName, initials, lookupName, employeeImageUrl } from '../../utils/format';
import * as svc from '../../api/services';
import type { Employee } from '../../api/types';
import type { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface InfoItem {
  icon: string;
  label: string;
  value: string;
  color: string;
  soft: string;
}

/** First non-empty string from a set of candidate fields. */
function firstText(...vals: any[]): string {
  for (const v of vals) {
    if (v == null) continue;
    if (typeof v === 'object') {
      const n = v.name || v.title || v.label;
      if (n) return String(n);
      continue;
    }
    const s = String(v).trim();
    if (s) return s;
  }
  return '—';
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  // Pull the full /profile record too — it often carries the photo, company and
  // address fields that /me omits.
  const [profile, setProfile] = useState<Employee | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      svc.getProfile().then(p => { if (active) setProfile(p); }).catch(() => {});
      return () => { active = false; };
    }, []),
  );

  const src = { ...(user ?? {}), ...(profile ?? {}) } as Employee;
  const name = displayName(src);
  // Resolve the profile photo from either /me or /profile, handling relative
  // paths and any of the common image field names.
  const imageUrl = employeeImageUrl(profile) || employeeImageUrl(user);
  const role = firstText(lookupName(src?.designation), src?.role, 'User');
  const company = firstText(src?.company, src?.company_name, src?.organization, 'DEODAP');
  const address = firstText(src?.address, src?.current_address, src?.company_address, src?.location, 'Rajkot');

  // Fall back to initials if the photo is missing or fails to load.
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [imageUrl]);
  const showImage = !!imageUrl && !imgFailed;

  const contact: InfoItem[] = [
    { icon: 'email-outline', label: 'Email Id', value: firstText(src?.email), color: ref.blue, soft: ref.blueSoft },
    { icon: 'phone-outline', label: 'Mobile', value: firstText(src?.phone, src?.mobile), color: ref.green, soft: ref.greenSoft },
  ];
  const companyDetails: InfoItem[] = [
    { icon: 'office-building-outline', label: 'Company', value: company, color: ref.amber, soft: ref.amberSoft },
    { icon: 'map-marker-outline', label: 'Address', value: address, color: ref.red, soft: ref.redSoft },
  ];

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />

      {/* White page header */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Text style={styles.topTitle}>Profile</Text>
      </SafeAreaView>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Blue identity banner */}
        <View style={styles.banner}>
          <View style={styles.blobA} />
          <View style={styles.blobB} />

          <TouchableOpacity style={styles.editBtn} activeOpacity={0.85} onPress={() => navigation.navigate('EditProfile')}>
            <Icon name="square-edit-outline" size={16} color={ref.blue} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.avatarRing}>
            {showImage ? (
              <Image
                source={{ uri: imageUrl! }}
                style={styles.avatarImg}
                resizeMode="cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials(name)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.section}>CONTACT INFORMATION</Text>
          <View style={styles.card}>
            {contact.map((it, i) => (
              <InfoRow key={it.label} item={it} last={i === contact.length - 1} />
            ))}
          </View>

          <Text style={styles.section}>COMPANY DETAILS</Text>
          <View style={styles.card}>
            {companyDetails.map((it, i) => (
              <InfoRow key={it.label} item={it} last={i === companyDetails.length - 1} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ item, last }: { item: InfoItem; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={[styles.infoIcon, { backgroundColor: item.soft }]}>
        <Icon name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{item.label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{item.value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ref.pageBg },
  flex: { flex: 1 },
  scroll: { paddingBottom: 28 },

  // White header
  topBar: { backgroundColor: '#FFFFFF' },
  topTitle: { fontSize: 22, fontWeight: '700', color: ref.text, paddingHorizontal: 20, paddingVertical: 16, letterSpacing: -0.3 },

  // Banner
  banner: {
    backgroundColor: ref.blue,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  blobA: { position: 'absolute', top: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
  blobB: { position: 'absolute', bottom: -60, right: -20, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)' },

  editBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editText: { color: ref.blue, fontSize: 14, fontWeight: '600', marginLeft: 5 },

  avatarRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 104, height: 104, borderRadius: 52 },
  avatarFallback: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#FFFFFF', fontSize: 40, fontWeight: '700', letterSpacing: 1 },

  name: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginTop: 16, letterSpacing: -0.3 },
  rolePill: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 999,
  },
  roleText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },

  // Body
  body: { paddingHorizontal: 16, marginTop: 20 },
  section: { fontSize: 12.5, fontWeight: '700', color: ref.textMuted, letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: {
    backgroundColor: ref.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  infoRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ref.border },
  infoIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 13.5, color: ref.textMuted, fontWeight: '500' },
  infoValue: { fontSize: 16.5, color: ref.text, fontWeight: '700', marginTop: 3, letterSpacing: -0.2 },
});

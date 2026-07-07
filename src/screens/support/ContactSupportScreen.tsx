import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FocusAwareStatusBar } from '../../components/ui';
import { ref } from '../../theme/refColors';

const PHONE = '7984912360';
const EMAIL = 'deodap.3971@gmail.com';
const WHATSAPP = '917984912360'; // includes country code (91)

export default function ContactSupportScreen() {
  const navigation = useNavigation();

  const openDialer = () => {
    Linking.openURL(`tel:${PHONE}`).catch(() => Alert.alert('Call', `Call us at ${PHONE}.`));
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${EMAIL}`).catch(() => Alert.alert('Email', `Email us at ${EMAIL}.`));
  };

  const openWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${WHATSAPP}`).catch(() =>
      Linking.openURL(`https://wa.me/${WHATSAPP}`).catch(() =>
        Alert.alert('WhatsApp', `Message us on WhatsApp at ${PHONE}.`),
      ),
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
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Icon name="lifebuoy" size={26} color={ref.blue} />
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>How can we help?</Text>
            <Text style={styles.introSub}>Report a bug, an issue, or share feedback — our team will get back to you.</Text>
          </View>
        </View>

        <Text style={styles.section}>CONTACT US</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openEmail}>
            <View style={[styles.iconTile, { backgroundColor: ref.blueSoft }]}>
              <Icon name="email-outline" size={22} color={ref.blue} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{EMAIL}</Text>
            </View>
            <Icon name="chevron-right" size={22} color={ref.tabInactive} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openDialer}>
            <View style={[styles.iconTile, { backgroundColor: ref.greenSoft }]}>
              <Icon name="phone" size={22} color={ref.green} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Phone</Text>
              <Text style={styles.rowValue}>{PHONE}</Text>
            </View>
            <Icon name="phone-outgoing" size={20} color={ref.tabInactive} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating WhatsApp button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={openWhatsApp}>
        <Icon name="whatsapp" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ref.pageBg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  topBar: { backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: ref.text, marginLeft: 20, letterSpacing: -0.3 },

  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ref.blueSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  introIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  introText: { flex: 1 },
  introTitle: { fontSize: 16, fontWeight: '700', color: ref.text },
  introSub: { fontSize: 13, color: ref.textMuted, marginTop: 3, lineHeight: 18 },

  section: { fontSize: 12.5, fontWeight: '700', color: ref.textMuted, letterSpacing: 1, marginTop: 20, marginBottom: 12, marginLeft: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  iconTile: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 13, color: ref.textMuted, fontWeight: '500' },
  rowValue: { fontSize: 16, color: ref.blue, fontWeight: '700', marginTop: 2, letterSpacing: -0.1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: ref.border },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

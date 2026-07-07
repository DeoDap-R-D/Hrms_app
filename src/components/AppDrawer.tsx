import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { ref } from '../theme/refColors';
import { useAuth } from '../context/AuthContext';
import { displayName } from '../utils/format';
import { APP_VERSION } from '../config/version';

const REPORTS: { label: string; route: string }[] = [
  { label: 'Daily Report', route: 'DailyReport' },
  { label: 'Monthly Report', route: 'MonthlyReport' },
  { label: 'Periodic Report', route: 'PeriodicReport' },
  { label: 'Leave Report', route: 'Leave' },
  { label: 'Yearly Report', route: 'YearlyReport' },
];

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface DrawerItem {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
}

export default function AppDrawer({ visible, onClose }: AppDrawerProps) {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const PANEL_W = Math.min(width * 0.84, 360);

  const [rendered, setRendered] = useState(visible);
  const [reportOpen, setReportOpen] = useState(false);
  const tx = useRef(new Animated.Value(-PANEL_W)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(tx, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(tx, { toValue: -PANEL_W, duration: 200, useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setRendered(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Navigate first (the target screen mounts beneath the still-open drawer),
  // then close the drawer so it slides away to reveal the target directly —
  // avoids briefly flashing the Home screen in between.
  const go = (fn: () => void) => {
    fn();
    onClose();
  };

  const items: DrawerItem[] = [
    { key: 'apply', label: 'Apply Leave', icon: 'calendar-clock', onPress: () => go(() => navigation.navigate('Leave')) },
    { key: 'balances', label: 'Leave Balances', icon: 'chart-pie', onPress: () => go(() => navigation.navigate('Leave')) },
    { key: 'holidays', label: 'Holidays', icon: 'image-multiple-outline', onPress: () => go(() => navigation.navigate('Lookup', { kind: 'holidays', title: 'Holidays' })) },
  ];

  const onLogout = () => {
    onClose();
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <Modal visible={rendered} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.scrim, { opacity: scrim }]}>
        <Pressable style={styles.flex} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { width: PANEL_W, transform: [{ translateX: tx }] }]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
          {/* Profile header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Icon name="account" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {user?.code ? `${user.code} - ` : ''}{displayName(user)}
            </Text>
            {user?.email ? <Text style={styles.email} numberOfLines={1}>{user.email}</Text> : null}
          </View>
          <View style={styles.divider} />

          {/* Scrollable menu */}
          <ScrollView contentContainerStyle={styles.menu} showsVerticalScrollIndicator={false}>
            {items.map(it => (
              <Row key={it.key} icon={it.icon} label={it.label} onPress={it.onPress} />
            ))}

            {/* Report (expandable) */}
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setReportOpen(o => !o)}>
              <Icon name="trending-up" size={24} color={ref.blue} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Report</Text>
              <Icon name={reportOpen ? 'chevron-up' : 'chevron-down'} size={22} color={ref.textMuted} />
            </TouchableOpacity>
            {reportOpen
              ? REPORTS.map(r => (
                  <TouchableOpacity
                    key={r.label}
                    style={styles.subRow}
                    activeOpacity={0.7}
                    onPress={() => go(() => navigation.navigate(r.route))}>
                    <Text style={styles.subLabel}>{r.label}</Text>
                  </TouchableOpacity>
                ))
              : null}
          </ScrollView>

          {/* Footer */}
          <View style={styles.divider} />
          <Row icon="headset" label="Help & Support" onPress={() => go(() => navigation.navigate('ContactSupport'))} />
          <Row icon="login" label="Logout" onPress={onLogout} />
          <Text style={styles.version}>Version {APP_VERSION}</Text>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

function Row({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <Icon name={icon} size={24} color={ref.blue} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },

  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 14, paddingHorizontal: 20 },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: ref.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: '700', color: ref.text, textAlign: 'center', letterSpacing: -0.2 },
  email: { fontSize: 14, color: ref.textMuted, marginTop: 4, textAlign: 'center' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },

  menu: { paddingVertical: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 22 },
  rowIcon: { marginRight: 18 },
  rowLabel: { flex: 1, fontSize: 17, fontWeight: '500', color: ref.text },

  subRow: { paddingVertical: 6, paddingLeft: 62, paddingRight: 22 },
  subLabel: { fontSize: 15.5, fontWeight: '500', color: ref.textMuted },

  version: { textAlign: 'center', color: ref.textMuted, fontSize: 14, paddingVertical: 10 },
});

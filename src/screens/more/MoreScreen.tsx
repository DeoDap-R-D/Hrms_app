import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card, Avatar, Row, FadeInView, FocusAwareStatusBar } from '../../components/ui';
import { useTheme, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { displayName, lookupName } from '../../utils/format';
import type { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function MoreScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user, signOut } = useAuth();

  const confirmSignOut = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.userRow} activeOpacity={0.8} onPress={() => navigation.navigate('Profile')}>
          <Avatar name={displayName(user)} uri={user?.image || user?.avatar} size={56} border />
          <View style={styles.userText}>
            <Text style={styles.name}>{displayName(user)}</Text>
            <Text style={styles.role}>{lookupName(user?.designation)}</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Text style={styles.section}>Productivity</Text>
          <Card padded={false} style={styles.card}>
            <Pad styles={styles}>
              <Row icon="file-document-edit-outline" title="Work Reports" chevron onPress={() => navigation.navigate('WorkReports')} />
              <Divider styles={styles} />
              <Row icon="bell-outline" iconColor={colors.accent} iconBg={colors.accentSoft} title="Notifications" chevron onPress={() => navigation.navigate('Notifications')} />
            </Pad>
          </Card>

          <Text style={styles.section}>Company</Text>
          <Card padded={false} style={styles.card}>
            <Pad styles={styles}>
              <Row icon="clock-time-four-outline" title="Shifts" chevron onPress={() => navigation.navigate('Lookup', { kind: 'shifts', title: 'Shifts' })} />
              <Divider styles={styles} />
              <Row icon="beach" title="Holidays" chevron onPress={() => navigation.navigate('Lookup', { kind: 'holidays', title: 'Holidays' })} />
              <Divider styles={styles} />
              <Row icon="shield-check-outline" title="Policies" chevron onPress={() => navigation.navigate('Policies')} />
            </Pad>
          </Card>

          <Text style={styles.section}>Account</Text>
          <Card padded={false} style={styles.card}>
            <Pad styles={styles}>
              <Row icon="account-circle-outline" title="Profile" chevron onPress={() => navigation.navigate('Profile')} />
              <Divider styles={styles} />
              <Row icon="account-edit-outline" title="Edit Profile" chevron onPress={() => navigation.navigate('EditProfile')} />
              <Divider styles={styles} />
              <Row icon="logout" iconColor={colors.danger} iconBg={colors.dangerSoft} title="Sign Out" onPress={confirmSignOut} />
            </Pad>
          </Card>

          <Text style={styles.version}>ShiftPro · v1.0.0</Text>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

function Pad({ children, styles }: { children: React.ReactNode; styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.pad}>{children}</View>;
}
function Divider({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.divider} />;
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },
    flex: { flex: 1 },
    header: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.xl,
      borderBottomLeftRadius: t.radius.xl,
      borderBottomRightRadius: t.radius.xl,
    },
    userRow: { flexDirection: 'row', alignItems: 'center' },
    userText: { flex: 1, marginLeft: t.spacing.md },
    name: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    role: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
    scroll: { paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.xxxl, paddingTop: t.spacing.lg },
    section: { fontSize: 14, fontWeight: '700', color: t.colors.textMuted, marginTop: t.spacing.lg, marginBottom: t.spacing.sm, marginLeft: t.spacing.xs },
    card: { marginBottom: t.spacing.sm },
    pad: { paddingHorizontal: t.spacing.lg },
    divider: { height: 1, backgroundColor: t.colors.border },
    version: { textAlign: 'center', color: t.colors.textSubtle, fontSize: 12, marginTop: t.spacing.xl },
  });

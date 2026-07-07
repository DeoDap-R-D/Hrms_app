import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FocusAwareStatusBar } from '../../components/ui';
import { ref } from '../../theme/refColors';

/**
 * Leave tab — currently renders the "feature not subscribed" locked state that
 * matches the approved reference design.
 */
export default function LeavesScreen() {
  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />

      {/* White page header */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Text style={styles.topTitle}>My Leave</Text>
      </SafeAreaView>
      <View style={styles.divider} />

      {/* Locked / not-subscribed state */}
      <View style={styles.center}>
        <View style={styles.illustration}>
          <View style={styles.stopSign}>
            <View style={styles.stopIcon}>
              <Icon name="hand-back-right" size={54} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.bang1}>!</Text>
          <Text style={styles.bang2}>!</Text>
          <Text style={styles.bang3}>!</Text>
        </View>

        <Text style={styles.title}>You have not subscribed this feature.</Text>
        <Text style={styles.subtitle}>Kindly Contact System Administrator</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { backgroundColor: '#FFFFFF' },
  topTitle: { fontSize: 22, fontWeight: '700', color: ref.text, paddingHorizontal: 20, paddingVertical: 16, letterSpacing: -0.3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60 },

  illustration: { width: 220, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stopSign: {
    width: 150,
    height: 150,
    borderRadius: 32,
    backgroundColor: '#E9812F',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    borderWidth: 8,
    borderColor: '#F4A45C',
  },
  stopIcon: { transform: [{ rotate: '-45deg' }] },
  bang1: { position: 'absolute', top: 0, left: 40, fontSize: 26, fontWeight: '800', color: '#7C89C9' },
  bang2: { position: 'absolute', top: -6, alignSelf: 'center', fontSize: 34, fontWeight: '800', color: '#E9812F' },
  bang3: { position: 'absolute', top: 4, right: 34, fontSize: 26, fontWeight: '800', color: '#7C89C9' },

  title: { fontSize: 21, fontWeight: '700', color: ref.text, textAlign: 'center', letterSpacing: -0.3, lineHeight: 28 },
  subtitle: { fontSize: 15, color: ref.textMuted, textAlign: 'center', marginTop: 16, fontWeight: '500' },
});

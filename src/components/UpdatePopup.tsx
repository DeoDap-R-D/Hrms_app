import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { ref } from '../theme/refColors';
import type { UpdateState } from '../hooks/useAppUpdate';

interface Props {
  state: UpdateState;
  onDismiss: () => void;
}

export default function UpdatePopup({ state, onDismiss }: Props) {
  if (!state.visible) return null;

  const openStore = () => {
    const url = state.storeUrl || 'https://play.google.com/store/apps/details?id=in.deodap.trackpunch';
    Linking.openURL(url).catch(() => Alert.alert('Update', 'Please update the app from the Play Store.'));
    // Force updates keep the prompt up; optional updates close after tapping.
    if (!state.force) onDismiss();
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={state.force ? undefined : onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="rocket-launch-outline" size={34} color={ref.blue} />
          </View>

          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.body}>
            {state.message?.trim()
              ? state.message
              : `A new version${state.latest ? ` (${state.latest})` : ''} of the app is available. Please update to get the latest features and fixes.`}
          </Text>

          <TouchableOpacity style={styles.updateBtn} activeOpacity={0.9} onPress={openStore}>
            <Text style={styles.updateText}>Update Now</Text>
          </TouchableOpacity>

          {!state.force ? (
            <TouchableOpacity style={styles.laterBtn} activeOpacity={0.7} onPress={onDismiss}>
              <Text style={styles.laterText}>Later</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 16,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: ref.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 21, fontWeight: '800', color: ref.text, letterSpacing: -0.3 },
  body: { fontSize: 14.5, color: ref.textMuted, textAlign: 'center', lineHeight: 21, marginTop: 10, marginBottom: 22 },

  updateBtn: {
    width: '100%',
    backgroundColor: ref.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateText: { color: '#FFFFFF', fontSize: 16.5, fontWeight: '700', letterSpacing: 0.2 },

  laterBtn: { paddingVertical: 14, alignItems: 'center' },
  laterText: { color: ref.textMuted, fontSize: 15, fontWeight: '600' },
});

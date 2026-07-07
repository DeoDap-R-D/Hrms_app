import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FocusAwareStatusBar } from '../../components/ui';
import { ref } from '../../theme/refColors';
import { useAuth } from '../../context/AuthContext';
import * as svc from '../../api/services';
import { getErrorMessage } from '../../api/client';
import { displayName, initials, employeeImageUrl } from '../../utils/format';
import { pickPhoto, capturePhoto } from '../../utils/camera';

const str = (v: unknown): string => (v == null ? '' : String(v));

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser, refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const name = displayName(user);
  const email = str(user?.email);
  const phone = str(user?.phone || user?.mobile).replace(/^\+?91[\s-]?/, '').trim();

  const existingImage = employeeImageUrl(user);

  const [address, setAddress] = useState(() => str(user?.address || user?.current_address));
  const [photoUri, setPhotoUri] = useState<string | null>(existingImage);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close the sheet first, then launch the picker — on Android the camera /
  // gallery won't appear while the modal is still mounted.
  const choosePhoto = (mode: 'camera' | 'gallery') => {
    setSheetOpen(false);
    setTimeout(async () => {
      try {
        const img = mode === 'camera' ? await capturePhoto() : await pickPhoto();
        if (img) {
          setPhotoUri(img.uri);
          setPhotoData(img.base64 || null);
        }
      } catch (e) {
        Alert.alert('Could not change photo', getErrorMessage(e));
      }
    }, 250);
  };

  const onSave = async () => {
    setSubmitting(true);
    try {
      const payload: svc.ProfileUpdate = {
        address: address.trim(),
        current_address: address.trim(),
      };
      if (photoData) payload.image = photoData;

      const updated = await svc.updateProfile(payload);
      if (updated && Object.keys(updated).length) {
        setUser(updated);
      } else {
        try {
          await refreshUser();
        } catch {
          if (user) setUser({ ...user, address: address.trim() });
        }
      }
      Alert.alert('Profile updated', 'Your changes have been saved.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Update failed', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />

      {/* White header */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="arrow-left" size={24} color={ref.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Blue banner with avatar */}
          <View style={styles.banner}>
            <View style={styles.blobA} />
            <View style={styles.blobB} />

            <TouchableOpacity activeOpacity={0.85} onPress={() => setSheetOpen(true)} style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials(name)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Icon name="camera" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.changeText}>Tap to change photo</Text>
          </View>

          <View style={styles.body}>
            {/* Personal info */}
            <Text style={styles.section}>PERSONAL INFO</Text>
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <View style={[styles.iconTile, { backgroundColor: ref.blueSoft }]}>
                  <Icon name="account-outline" size={22} color={ref.blue} />
                </View>
                <TextInput style={styles.readonlyInput} value={name} editable={false} />
              </View>

              <View style={styles.hDivider} />

              <View style={styles.fieldRow}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <View style={styles.vDivider} />
                <TextInput style={styles.readonlyInput} value={phone} editable={false} />
              </View>
            </View>

            {/* Contact */}
            <Text style={styles.section}>CONTACT</Text>
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <View style={[styles.iconTile, { backgroundColor: ref.blueSoft }]}>
                  <Icon name="email-outline" size={22} color={ref.blue} />
                </View>
                <TextInput style={styles.readonlyInput} value={email} editable={false} />
              </View>
            </View>

            {/* Address */}
            <Text style={styles.section}>ADDRESS</Text>
            <View style={styles.card}>
              <View style={styles.fieldRowTop}>
                <View style={[styles.iconTile, { backgroundColor: ref.redSoft }]}>
                  <Icon name="map-marker-outline" size={22} color={ref.red} />
                </View>
                <TextInput
                  style={styles.addressInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your address"
                  placeholderTextColor={ref.textMuted}
                  multiline
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save button */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.9} onPress={onSave} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Photo source action sheet */}
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <SafeAreaView edges={['bottom']}>
              <TouchableOpacity style={styles.sheetRow} activeOpacity={0.6} onPress={() => choosePhoto('camera')}>
                <Text style={styles.sheetText}>Take a picture</Text>
              </TouchableOpacity>
              <View style={styles.sheetDivider} />
              <TouchableOpacity style={styles.sheetRow} activeOpacity={0.6} onPress={() => choosePhoto('gallery')}>
                <Text style={styles.sheetText}>Gallery</Text>
              </TouchableOpacity>
              <View style={styles.sheetDivider} />
              <TouchableOpacity style={styles.sheetRow} activeOpacity={0.6} onPress={() => setSheetOpen(false)}>
                <Text style={styles.sheetText}>Cancel</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ref.pageBg },
  flex: { flex: 1 },
  scroll: { paddingBottom: 24 },

  // Header
  topBar: { backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: ref.text, marginLeft: 20, letterSpacing: -0.3 },

  // Banner
  banner: { backgroundColor: ref.blue, alignItems: 'center', paddingTop: 28, paddingBottom: 26, overflow: 'hidden' },
  blobA: { position: 'absolute', top: -50, left: -30, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.08)' },
  blobB: { position: 'absolute', bottom: -60, right: -20, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.07)' },

  avatarWrap: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 116, height: 116, borderRadius: 58 },
  avatarFallback: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#FFFFFF', fontSize: 42, fontWeight: '700', letterSpacing: 1 },
  cameraBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ref.blue,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '500', marginTop: 14 },

  // Body
  body: { paddingHorizontal: 16, marginTop: 20 },
  section: { fontSize: 12.5, fontWeight: '700', color: ref.textMuted, letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: {
    backgroundColor: ref.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldRowTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconTile: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },

  readonlyInput: {
    flex: 1,
    backgroundColor: '#EEF1F8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: '#8A94A6',
    fontWeight: '500',
  },

  hDivider: { height: StyleSheet.hairlineWidth, backgroundColor: ref.border, marginVertical: 14 },
  prefixBox: { width: 52, alignItems: 'center', justifyContent: 'center' },
  prefixText: { fontSize: 17, fontWeight: '700', color: ref.text },
  vDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: ref.border, marginRight: 12 },

  addressInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: ref.text,
    minHeight: 110,
    textAlignVertical: 'top',
  },

  // Save footer
  footer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: ref.pageBg },
  saveBtn: {
    backgroundColor: ref.blue,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  saveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },

  // Photo source action sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF' },
  sheetRow: { paddingVertical: 22, paddingHorizontal: 24 },
  sheetText: { fontSize: 17, color: ref.text, fontWeight: '500' },
  sheetDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },
});

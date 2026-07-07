import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FocusAwareStatusBar } from '../../components/ui';
import { ref } from '../../theme/refColors';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';
import { APP_VERSION } from '../../config/version';

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!code.trim()) return setError('Please enter your employee code.');
    if (!password) return setError('Please enter your password.');

    setLoading(true);
    try {
      await signIn({ code: code.trim(), password });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onForgot = () => {
    Alert.alert('Forgot Password', 'Please contact your system administrator to reset your password.');
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Heading */}
            <View style={styles.heading}>
              <Text style={styles.welcome}>Welcome!</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle-outline" size={18} color={ref.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Employee Code */}
            <View style={styles.field}>
              <Icon name="card-account-details-outline" size={24} color={ref.tabInactive} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Employee Code"
                placeholderTextColor={ref.tabInactive}
                value={code}
                onChangeText={setCode}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Icon name="lock-outline" size={24} color={ref.tabInactive} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={ref.tabInactive}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity onPress={() => setShowPassword(s => !s)} hitSlop={hit}>
                <Icon name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={24} color={ref.tabInactive} />
              </TouchableOpacity>
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotWrap} activeOpacity={0.7} onPress={onForgot}>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login */}
            <TouchableOpacity style={styles.loginBtn} activeOpacity={0.9} onPress={onSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginText}>Login</Text>}
            </TouchableOpacity>
          </ScrollView>

          <Text style={styles.version}>Version {APP_VERSION}</Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },

  heading: { alignItems: 'center', marginTop: 90, marginBottom: 44 },
  welcome: { fontSize: 26, fontWeight: '800', color: ref.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 16, color: ref.textMuted, marginTop: 10, fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ref.redSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: { color: ref.red, fontSize: 13, marginLeft: 8, flex: 1, fontWeight: '600' },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 18 : 6,
    marginBottom: 18,
    minHeight: 60,
  },
  fieldIcon: { marginRight: 14 },
  input: { flex: 1, fontSize: 17, color: ref.text, fontWeight: '500', paddingVertical: 0 },

  forgotWrap: { alignSelf: 'flex-end', marginTop: 2, marginBottom: 24 },
  forgot: { color: ref.blue, fontSize: 15, fontWeight: '700' },

  loginBtn: {
    backgroundColor: ref.blue,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },

  version: { textAlign: 'center', color: ref.tabInactive, fontSize: 14, paddingVertical: 12 },
});

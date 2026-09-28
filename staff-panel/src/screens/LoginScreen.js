import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldCheck,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  CircleAlert,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAuthStore from '../store/authStore';
import { setApiBaseUrl, DEFAULT_BASE_URL } from '../api/axios';
import api from '../api/axios';

export const LoginScreen = () => {
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Host configuration modal
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customHost, setCustomHost] = useState(api.defaults.baseURL);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setError('Please enter both phone and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(phone.trim(), password);
      if (!res.success) {
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Network connection error. Check server host configuration.');
    } finally {
      setLoading(false);
    }
  };

  const fillLabAssistantCredentials = () => {
    setPhone('9876543210');
    setPassword('password123');
    setError('');
  };

  const fillDoctorCredentials = () => {
    setPhone('9876500001');
    setPassword('password123');
    setError('');
  };

  const saveCustomHost = async () => {
    try {
      await setApiBaseUrl(customHost);
      setServerModalVisible(false);
      Alert.alert('Server Host Updated', `API connected to: ${customHost}`);
    } catch (e) {
      Alert.alert('Error', 'Invalid API Host URL');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header / Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <ShieldCheck size={36} color={colors.primaryLight} />
          </View>
          <Text style={styles.brandTitle}>BioSyncAI</Text>
          <Text style={styles.portalSubtitle}>STAFF PORTAL</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <View style={{ height: 16 }} />

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="10-digit Phone"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (error) setError('');
                }}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError('');
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <CircleAlert size={15} color={colors.roseLight} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Credentials */}
          <View style={{ gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              style={styles.demoFillBtn}
              onPress={fillLabAssistantCredentials}
              activeOpacity={0.7}
            >
              <Sparkles size={14} color={colors.primaryLight} />
              <Text style={styles.demoFillText}>Lab Assistant (9876543210)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoFillBtn, { borderColor: colors.violet + '60', backgroundColor: colors.violet + '12' }]}
              onPress={fillDoctorCredentials}
              activeOpacity={0.7}
            >
              <Sparkles size={14} color={colors.violetLight} />
              <Text style={[styles.demoFillText, { color: colors.violetLight }]}>Doctor (9876500001)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Server Host Settings Footer */}
        <TouchableOpacity
          style={styles.serverHostBtn}
          onPress={() => setServerModalVisible(true)}
          activeOpacity={0.7}
        >
          <Server size={14} color={colors.textMuted} />
          <Text style={styles.serverHostText} numberOfLines={1}>
            API Endpoint: {api.defaults.baseURL}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Server URL Config Modal */}
      <Modal
        visible={serverModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>API Endpoint</Text>
            <Text style={styles.modalSubtitle}>
              Set backend server URL.
            </Text>

            <TextInput
              style={styles.serverInput}
              value={customHost}
              onChangeText={setCustomHost}
              placeholder="e.g. http://192.168.1.100:6446/api"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setServerModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={saveCustomHost}
              >
                <Text style={styles.modalSaveText}>Save Host</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  portalSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primaryLight,
    marginTop: 6,
  },
  card: {
    backgroundColor: 'rgba(12, 12, 12, 0.75)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: colors.textPrimary,
    fontSize: 14,
  },
  eyeBtn: {
    padding: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.roseLight,
    fontSize: 12,
    flex: 1,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 12,
  },
  demoFillText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  serverHostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    padding: 8,
  },
  serverHostText: {
    color: colors.textMuted,
    fontSize: 11,
    maxWidth: '85%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 17,
  },
  serverInput: {
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    color: colors.textPrimary,
    padding: 12,
    fontSize: 13,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default LoginScreen;

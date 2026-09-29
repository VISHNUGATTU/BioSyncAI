import React, { useState, useRef } from 'react';
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
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldCheck,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Server,
  CircleAlert,
  LockKeyhole,
  CheckCircle2,
  Check,
  Stethoscope,
  Info,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAuthStore from '../store/authStore';
import { setApiBaseUrl, DEFAULT_BASE_URL } from '../api/axios';
import api from '../api/axios';

export const LoginScreen = () => {
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Top-center toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState('Authenticated successfully');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-20)).current;
  const toastTimeoutRef = useRef(null);

  // Forgot password modal state
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  // Server host configuration modal
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customHost, setCustomHost] = useState(api.defaults.baseURL);

  const triggerTopToast = (message = 'Authenticated successfully') => {
    setToastText(message);
    setToastVisible(true);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(toastTranslateY, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    toastTimeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: -20,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToastVisible(false);
      });
    }, 3500);
  };

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setError('Please enter both your registered mobile number and password.');
      return;
    }

    if (phone.trim().replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit registered phone number.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
      const res = await login(cleanPhone, password);
      if (!res.success) {
        setError(res.message || 'Authentication failed. Please verify your credentials.');
      } else {
        triggerTopToast('Signed in successfully');
      }
    } catch (err) {
      setError('Cannot reach diagnostic gateway. Verify server host connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const saveCustomHost = async () => {
    try {
      await setApiBaseUrl(customHost);
      setServerModalVisible(false);
      triggerTopToast('Gateway Endpoint Updated');
    } catch (e) {
      setError('Invalid API Host URL provided.');
    }
  };

  const resetDefaultHost = async () => {
    setCustomHost(DEFAULT_BASE_URL);
    await setApiBaseUrl(DEFAULT_BASE_URL);
    setServerModalVisible(false);
    triggerTopToast('Default Gateway Restored');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#000000', '#05070a', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* FLOATING TOP-CENTER TOAST NOTIFICATION */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.topToastContainer,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <View style={styles.toastPill}>
            <View style={styles.toastGreenCircle}>
              <Check size={13} color="#ffffff" strokeWidth={3.5} />
            </View>
            <Text style={styles.toastText}>{toastText}</Text>
          </View>
        </Animated.View>
      )}

      {/* Top Utility Header */}
      <View style={styles.topUtilityRow}>
        <View style={styles.secureEnvironmentBadge}>
          <LockKeyhole size={11} color={colors.emeraldLight} />
          <Text style={styles.secureEnvironmentText}>SECURE CLINICAL ENVIRONMENT</Text>
        </View>

        <TouchableOpacity
          style={styles.hostConfigBtn}
          onPress={() => setServerModalVisible(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Server size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand & Clinic Identity */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.25)', 'rgba(6, 182, 212, 0.05)']}
              style={styles.logoGradient}
            >
              <ShieldCheck size={36} color={colors.primaryLight} />
            </LinearGradient>
          </View>
          <Text style={styles.brandTitle}>
            BioSync<Text style={{ color: colors.primaryLight }}>AI</Text>
          </Text>
          <View style={styles.portalTagWrapper}>
            <Stethoscope size={12} color={colors.primaryLight} style={{ marginRight: 5 }} />
            <Text style={styles.portalSubtitle}>CLINICAL & FIELD STAFF PORTAL</Text>
          </View>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Staff Sign In</Text>
            <Text style={styles.cardDescription}>
              Authorized access for Phlebotomists, Field Technicians & Clinical Pathologists
            </Text>
          </View>

          {/* Phone / Mobile ID Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>REGISTERED PHONE NUMBER</Text>
            <View
              style={[
                styles.inputWrapper,
                phoneFocused && styles.inputWrapperFocused,
              ]}
            >
              <Phone
                size={18}
                color={phoneFocused ? colors.primaryLight : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                onChangeText={(t) => {
                  setPhone(t);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.inputLabel}>SECURITY PASSWORD</Text>
              <TouchableOpacity onPress={() => setSupportModalVisible(true)} activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}
            >
              <Lock
                size={18}
                color={passwordFocused ? colors.primaryLight : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me Option */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <CheckCircle2 size={14} color="#000" />}
            </View>
            <Text style={styles.rememberText}>Keep this mobile device authenticated</Text>
          </TouchableOpacity>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <CircleAlert size={16} color={colors.roseLight} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#06b6d4', '#0891b2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#000" size="small" />
                  <Text style={styles.submitBtnText}>Authenticating Session...</Text>
                </View>
              ) : (
                <View style={styles.btnContentRow}>
                  <ShieldCheck size={18} color="#000" />
                  <Text style={styles.submitBtnText}>Sign In to Workstation</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Regulatory & Security Compliance Footer */}
        <View style={styles.securityFooter}>
          <View style={styles.complianceRow}>
            <Lock size={12} color={colors.textMuted} />
            <Text style={styles.complianceText}>
              256-BIT SSL ENCRYPTION • BIOMEDICAL AUDIT PROTOCOL
            </Text>
          </View>
          <Text style={styles.legalDisclaimer}>
            Access to this diagnostic portal is restricted strictly to authorized BioSync AI personnel.
            All collection events, patient records, and biomarker reviews are recorded with immutable audit logs.
          </Text>
        </View>
      </ScrollView>

      {/* Forgot Password / Support Modal */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Info size={20} color={colors.primaryLight} />
              <Text style={styles.modalTitle}>Staff Credential Support</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              For security and HIPAA compliance, staff password resets must be authorized directly by your Central Laboratory Administrator.
            </Text>
            <View style={styles.supportInfoBox}>
              <Text style={styles.supportLabel}>Central Lab Admin Email:</Text>
              <Text style={styles.supportValue}>admin@biosync.ai</Text>
              <Text style={[styles.supportLabel, { marginTop: 8 }]}>Internal Help Desk:</Text>
              <Text style={styles.supportValue}>+91 40 8822 4000</Text>
            </View>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => setSupportModalVisible(false)}
            >
              <Text style={styles.modalSaveText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Server URL Config Modal */}
      <Modal
        visible={serverModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Server size={20} color={colors.primaryLight} />
              <Text style={styles.modalTitle}>Gateway Host Configuration</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              Configure the clinical backend API endpoint address for local network or cloud deployments.
            </Text>

            <TextInput
              style={styles.serverInput}
              value={customHost}
              onChangeText={setCustomHost}
              placeholder="http://192.168.1.100:6446/api"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={resetDefaultHost}
              >
                <Text style={styles.modalResetText}>Reset Default</Text>
              </TouchableOpacity>

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
    backgroundColor: '#000000',
  },
  topToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 30,
    alignSelf: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.96)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  toastGreenCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  topUtilityRow: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  secureEnvironmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  secureEnvironmentText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.emeraldLight,
  },
  hostConfigBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  portalTagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  portalSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  card: {
    backgroundColor: 'rgba(12, 12, 12, 0.85)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.03)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    marginTop: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  rememberText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.roseLight,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  securityFooter: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  complianceText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  legalDisclaimer: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    lineHeight: 15,
  },
  supportInfoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
  },
  supportLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  supportValue: {
    fontSize: 14,
    color: colors.primaryLight,
    fontWeight: '800',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  serverInput: {
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalResetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default LoginScreen;

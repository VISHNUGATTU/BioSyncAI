import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Phone,
  Server,
  Lock,
  RotateCcw,
  CheckCircle2,
  Edit2,
  FileText,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAuthStore from '../store/authStore';
import userApi from '../api/userApi';
import api, { setCustomApiUrl, DEFAULT_BASE_URL } from '../api/axios';
import GlassCard from '../components/GlassCard';

export const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);

  // Real-time Resend countdown timer
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  // Server host configuration modal
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customHost, setCustomHost] = useState(api.defaults.baseURL);

  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (otpSent && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [otpSent, countdown]);

  const handleRequestOTP = async (numToUse) => {
    const rawNumber = (numToUse || phoneNumber).trim().replace(/\D/g, '');
    if (!rawNumber || rawNumber.length < 10) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number to receive your OTP.');
      return;
    }

    const cleanNumber = rawNumber.slice(-10);

    try {
      setLoading(true);
      const res = await userApi.requestOTP(cleanNumber);
      if (res.success) {
        setOtpSent(true);
        setOtp('');
        setCountdown(30);
        setCanResend(false);
        Alert.alert(
          'Security OTP Generated',
          `A real-time 6-digit verification code was dispatched for +91 ${cleanNumber}.\n\nPlease check your server terminal or SMS to obtain your code.`
        );
      } else {
        Alert.alert('Authentication Notice', res.message || 'Unable to generate verification OTP. Please try again.');
      }
    } catch (err) {
      Alert.alert(
        'Connection Error',
        err.response?.data?.message || err.message || 'Unable to connect to the BioSync diagnostic gateway. Please check your network or server host setting.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    const cleanNumber = phoneNumber.trim().replace(/\D/g, '').slice(-10);

    try {
      setLoading(true);
      const res = await login(cleanNumber, cleanOtp);
      if (!res.success) {
        Alert.alert('Verification Failed', res.message || 'Invalid or expired OTP. Please re-check the code.');
      }
    } catch (err) {
      Alert.alert('Authentication Error', err.response?.data?.message || err.message || 'Failed to authenticate session.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToPhoneStep = () => {
    setOtpSent(false);
    setOtp('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const saveCustomHost = async () => {
    try {
      await setCustomApiUrl(customHost);
      setServerModalVisible(false);
      Alert.alert('Host Updated', `API endpoint connected to: ${customHost}`);
    } catch (e) {
      Alert.alert('Configuration Error', 'Invalid API host URL provided.');
    }
  };

  const resetDefaultHost = async () => {
    setCustomHost(DEFAULT_BASE_URL);
    await setCustomApiUrl(DEFAULT_BASE_URL);
    setServerModalVisible(false);
    Alert.alert('Host Reset', `Reverted to default gateway: ${DEFAULT_BASE_URL}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#000000', '#05070a', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Utility Header */}
      <View style={styles.topUtilityRow}>
        <View style={styles.secureBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.secureBadgeText}>ENCRYPTED HEALTH PORTAL</Text>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Identity */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <LinearGradient
                colors={['rgba(6, 182, 212, 0.25)', 'rgba(6, 182, 212, 0.05)']}
                style={styles.logoGradient}
              >
                <Activity size={32} color={colors.cyanLight} />
              </LinearGradient>
            </View>
            <Text style={styles.brandTitle}>
              BioSync<Text style={{ color: colors.cyanLight }}>AI</Text>
            </Text>
            <Text style={styles.brandTagline}>
              Precision Diagnostics & Personalized Metabolic Health
            </Text>
          </View>

          {/* Interactive Authentication Card */}
          <GlassCard style={styles.card}>
            {!otpSent ? (
              // STEP 1: MOBILE NUMBER ENTRY
              <View>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeading}>Patient Sign In</Text>
                  <Text style={styles.cardSub}>
                    Enter your registered mobile number to access diagnostic records, biomarker trends, and home collection visits.
                  </Text>
                </View>

                {/* Mobile Number Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>REGISTERED MOBILE NUMBER</Text>
                  <View
                    style={[
                      styles.phoneInputRow,
                      phoneFocused && styles.inputRowFocused,
                    ]}
                  >
                    <View style={styles.countryCodeBox}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="Enter 10-digit mobile"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={10}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                      editable={!loading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Primary CTA: Request OTP */}
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={() => handleRequestOTP(phoneNumber)}
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
                      <View style={styles.btnContentRow}>
                        <ActivityIndicator size="small" color="#000" />
                        <Text style={styles.primaryBtnText}>Generating Secure OTP...</Text>
                      </View>
                    ) : (
                      <View style={styles.btnContentRow}>
                        <Text style={styles.primaryBtnText}>Get Verification Code</Text>
                        <ArrowRight size={18} color="#000" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.realtimeNoticeRow}>
                  <ShieldCheck size={13} color={colors.textMuted} />
                  <Text style={styles.realtimeNoticeText}>
                    A secure 6-digit one-time code will be dispatched in real time.
                  </Text>
                </View>
              </View>
            ) : (
              // STEP 2: OTP VERIFICATION
              <View>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeading}>Enter Verification Code</Text>
                  <View style={styles.phoneDisplayRow}>
                    <Text style={styles.phoneDisplayText}>
                      Code sent to <Text style={{ color: colors.cyanLight, fontWeight: '800' }}>+91 {phoneNumber}</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={handleResetToPhoneStep}
                      style={styles.editPhoneBtn}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={11} color={colors.cyanLight} />
                      <Text style={styles.editPhoneText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* OTP Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>6-DIGIT VERIFICATION CODE</Text>
                  <View
                    style={[
                      styles.otpInputRow,
                      otpFocused && styles.inputRowFocused,
                    ]}
                  >
                    <KeyRound size={18} color={colors.cyanLight} style={{ marginLeft: 14 }} />
                    <TextInput
                      style={[styles.textInput, styles.otpTextInput]}
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="• • • • • •"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      onFocus={() => setOtpFocused(true)}
                      onBlur={() => setOtpFocused(false)}
                      editable={!loading}
                      autoFocus
                    />
                  </View>
                </View>

                {/* Primary CTA: Verify OTP */}
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {loading ? (
                      <View style={styles.btnContentRow}>
                        <ActivityIndicator size="small" color="#000" />
                        <Text style={styles.primaryBtnText}>Authenticating Session...</Text>
                      </View>
                    ) : (
                      <View style={styles.btnContentRow}>
                        <ShieldCheck size={18} color="#000" />
                        <Text style={styles.primaryBtnText}>Verify & Open Health Portal</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Resend Actions */}
                <View style={styles.resendContainer}>
                  {!canResend ? (
                    <Text style={styles.countdownText}>
                      Resend code in <Text style={{ color: colors.cyanLight, fontWeight: '700' }}>{countdown}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleRequestOTP(phoneNumber)}
                      style={styles.resendActionBtn}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <RotateCcw size={13} color={colors.cyanLight} />
                      <Text style={styles.resendActionText}>Resend Real-Time Code</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handleResetToPhoneStep}
                    style={styles.changeNumberBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeNumberText}>Use different mobile number</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </GlassCard>

          {/* Privacy & Regulatory Trust Footer */}
          <View style={styles.trustFooter}>
            <View style={styles.trustBadgeRow}>
              <Lock size={12} color={colors.textMuted} />
              <Text style={styles.trustBadgeText}>
                HIPAA & DISHA STANDARDS • 256-BIT ENCRYPTION
              </Text>
            </View>
            <Text style={styles.trustDisclaimer}>
              Your clinical biomarkers and health records are encrypted at rest and in transit.
              By signing in, you agree to the BioSync AI Terms of Clinical Service and Medical Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
              <Server size={20} color={colors.cyanLight} />
              <Text style={styles.modalTitle}>Gateway Host Configuration</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              Configure the patient portal API endpoint for your local network or live cloud deployment.
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topUtilityRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emeraldLight,
  },
  secureBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.cyanLight,
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
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    marginBottom: 12,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(12, 12, 12, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 22,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: 18,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  phoneDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  phoneDisplayText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  editPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editPhoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyanLight,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    overflow: 'hidden',
    height: 52,
  },
  inputRowFocused: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(6, 182, 212, 0.03)',
  },
  countryCodeBox: {
    paddingHorizontal: 14,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.cyanLight,
  },
  otpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    height: 54,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    height: '100%',
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  otpTextInput: {
    letterSpacing: 8,
    fontWeight: '900',
    fontSize: 20,
    color: colors.cyanLight,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
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
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  realtimeNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  realtimeNoticeText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  countdownText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  resendActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  resendActionText: {
    fontSize: 12,
    color: colors.cyanLight,
    fontWeight: '800',
  },
  changeNumberBtn: {
    paddingVertical: 4,
  },
  changeNumberText: {
    fontSize: 11,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  trustFooter: {
    marginTop: 26,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  trustBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  trustDisclaimer: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    lineHeight: 15,
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
    backgroundColor: colors.cyan,
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

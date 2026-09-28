import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, ShieldCheck, ArrowRight, Sparkles, KeyRound, Phone } from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAuthStore from '../store/authStore';
import userApi from '../api/userApi';
import GlassCard from '../components/GlassCard';

export const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  // Demo Patients seeded in MongoDB
  const DEMO_PATIENTS = [
    { name: 'Priya Sharma', phone: '9876512345', note: 'Active Trip (OTP: 4829)' },
    { name: 'Vikram Malhotra', phone: '9988776655', note: 'Lab Received (Scenario 2)' },
    { name: 'Rahul Verma', phone: '9123456780', note: 'Doctor Review (Scenario 3)' },
  ];

  const handleRequestOTP = async (numToUse) => {
    const target = (numToUse || phoneNumber).trim();
    if (!target || target.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await userApi.requestOTP(target);
      if (res.success) {
        setOtpSent(true);
        // Pre-fill default dev OTP or 123456
        Alert.alert(
          'OTP Generated',
          `Verification OTP sent for +91 ${target}.\nIn local development, any 6-digit code or generated code will verify.`
        );
      } else {
        Alert.alert('OTP Error', res.message || 'Failed to request OTP');
      }
    } catch (err) {
      Alert.alert('Connection Error', err.response?.data?.message || err.message || 'Cannot reach server at port 6446');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.trim().length === 0) {
      Alert.alert('OTP Required', 'Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(phoneNumber, otp.trim());
      if (!res.success) {
        Alert.alert('Verification Failed', res.message || 'Invalid OTP code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (patient) => {
    setPhoneNumber(patient.phone);
    try {
      setLoading(true);
      await userApi.requestOTP(patient.phone);
      setOtpSent(true);
      // Automatically attempt login or allow user to type OTP
      setOtp('123456');
    } catch (e) {
      console.log('Demo login init err:', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Activity size={28} color={colors.cyan} />
            </View>
            <Text style={styles.brandTitle}>BioSync AI</Text>
            <Text style={styles.brandTagline}>Next-Gen Clinical Diagnostics & Precision Health</Text>
          </View>

          {/* Login Card */}
          <GlassCard style={styles.card}>
            <Text style={styles.cardHeading}>Patient Login</Text>
            <Text style={styles.cardSub}>Sign in to view real-time OTP & home collection status</Text>

            {/* Mobile Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>MOBILE PHONE NUMBER</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!loading}
                />
              </View>
            </View>

            {/* OTP Input (Shown after request) */}
            {otpSent && (
              <View style={[styles.inputContainer, { marginTop: 14 }]}>
                <Text style={styles.inputLabel}>6-DIGIT VERIFICATION CODE</Text>
                <View style={styles.otpInputRow}>
                  <KeyRound size={18} color={colors.cyan} style={{ marginLeft: 12 }} />
                  <TextInput
                    style={[styles.textInput, { letterSpacing: 4, fontWeight: '900', fontSize: 18 }]}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="• • • • • •"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            {/* Main Action Button */}
            {!otpSent ? (
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={() => handleRequestOTP(phoneNumber)}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Request Secure OTP</Text>
                    <ArrowRight size={18} color="#000" />
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.emeraldLight }, loading && styles.btnDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <ShieldCheck size={18} color="#000" />
                    <Text style={styles.primaryBtnText}>Verify OTP & Enter</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {otpSent && (
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => handleRequestOTP(phoneNumber)}
                disabled={loading}
              >
                <Text style={styles.resendText}>Change number / Resend OTP</Text>
              </TouchableOpacity>
            )}
          </GlassCard>

          {/* Demo Quick Login Chips */}
          <View style={styles.demoSection}>
            <View style={styles.demoHeaderRow}>
              <Sparkles size={14} color={colors.cyan} />
              <Text style={styles.demoSectionTitle}>ONE-TAP DEMO PATIENT ACCESS</Text>
            </View>
            <View style={styles.demoChipsList}>
              {DEMO_PATIENTS.map((p) => (
                <TouchableOpacity
                  key={p.phone}
                  style={styles.demoChip}
                  onPress={() => handleQuickDemoLogin(p)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoChipName}>{p.name}</Text>
                    <Text style={styles.demoChipNote}>{p.note}</Text>
                  </View>
                  <Text style={styles.demoChipPhone}>+91 {p.phone.slice(-4)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
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
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 20,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  cardSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 18,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCodeBox: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.cyan,
  },
  otpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 12,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
  resendText: {
    fontSize: 12,
    color: colors.cyan,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 24,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  demoChipsList: {
    gap: 8,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0e0e0e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 12,
  },
  demoChipName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  demoChipNote: {
    fontSize: 10.5,
    color: colors.cyan,
    marginTop: 2,
  },
  demoChipPhone: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
});

export default LoginScreen;

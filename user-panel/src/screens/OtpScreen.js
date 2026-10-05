import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Check,
  Edit2,
  CircleAlert,
  ArrowLeft,
  Lock,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAuthStore from '../store/authStore';
import userApi from '../api/userApi';
import GlassCard from '../components/GlassCard';

export const OtpScreen = ({ navigation, route }) => {
  const phoneNumber = route?.params?.phoneNumber || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpFocused, setOtpFocused] = useState(false);

  // Top-center toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState('OTP sent successfully');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-20)).current;
  const toastTimeoutRef = useRef(null);

  // 30-Second live resend countdown timer
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  const login = useAuthStore((state) => state.login);

  const triggerTopToast = (message = 'OTP sent successfully') => {
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

  // Trigger toast on screen entry if navigated from Login
  useEffect(() => {
    triggerTopToast('OTP sent successfully');

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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleResendOTP = async () => {
    if (!phoneNumber) {
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const res = await userApi.requestOTP(phoneNumber);
      if (res.success) {
        setOtp('');
        setCountdown(30);
        setCanResend(false);

        // Restart timer
        if (timerRef.current) clearInterval(timerRef.current);
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

        triggerTopToast('OTP sent successfully');
      } else {
        setErrorMessage(res.message || 'Unable to resend OTP. Please try again.');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Gateway unreachable. Check network connectivity.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const res = await login(phoneNumber, cleanOtp);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid verification code. Please check and re-enter.');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to authenticate session. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

      {/* Top Header Navigation Bar */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleChangeNumber}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.secureBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.secureBadgeText}>FIREBASE VERIFIED</Text>
        </View>

        <View style={{ width: 38 }} />
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
          {/* Badge & Screen Title */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <LinearGradient
                colors={['rgba(6, 182, 212, 0.25)', 'rgba(6, 182, 212, 0.05)']}
                style={styles.logoGradient}
              >
                <KeyRound size={32} color={colors.cyanLight} />
              </LinearGradient>
            </View>
            <Text style={styles.screenHeading}>Firebase Phone Verification</Text>
            <Text style={styles.screenSub}>
              Enter the 6-digit code authenticated via Google Firebase to
            </Text>

            {/* Mobile Pill with CHANGE NUMBER option */}
            <View style={styles.phonePillRow}>
              <Text style={styles.phonePillText}>+91 {phoneNumber}</Text>
              <TouchableOpacity
                onPress={handleChangeNumber}
                style={styles.changeNumberPill}
                activeOpacity={0.7}
              >
                <Edit2 size={12} color={colors.cyanLight} />
                <Text style={styles.changeNumberPillText}>Change Number</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* OTP Input Card */}
          <GlassCard style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>6-DIGIT FIREBASE VERIFICATION CODE</Text>
              <View
                style={[
                  styles.otpInputRow,
                  otpFocused && styles.inputRowFocused,
                ]}
              >
                <KeyRound size={18} color={colors.cyanLight} style={{ marginLeft: 14 }} />
                <TextInput
                  style={styles.otpTextInput}
                  value={otp}
                  onChangeText={(t) => {
                    setOtp(t);
                    if (errorMessage) setErrorMessage('');
                  }}
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

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <CircleAlert size={15} color={colors.roseLight} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Primary Action Button */}
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
                    <Text style={styles.primaryBtnText}>Authenticating with Firebase...</Text>
                  </View>
                ) : (
                  <View style={styles.btnContentRow}>
                    <ShieldCheck size={18} color="#000" />
                    <Text style={styles.primaryBtnText}>Verify with Firebase Google</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend & Change Number Actions */}
            <View style={styles.resendContainer}>
              {!canResend ? (
                <Text style={styles.countdownText}>
                  Resend code in <Text style={{ color: colors.cyanLight, fontWeight: '700' }}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOTP}
                  style={styles.resendActionBtn}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <RotateCcw size={13} color={colors.cyanLight} />
                  <Text style={styles.resendActionText}>Resend Real-Time Code</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleChangeNumber}
                style={styles.changeNumberBottomBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.changeNumberBottomText}>Entered wrong number? Change here</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Security Guarantee Footer */}
          <View style={styles.trustFooter}>
            <View style={styles.trustBadgeRow}>
              <Lock size={12} color={colors.textMuted} />
              <Text style={styles.trustBadgeText}>
                SECURED BY GOOGLE FIREBASE · 256-BIT ENCRYPTION
              </Text>
            </View>
            <Text style={styles.trustDisclaimer}>
              Your clinical biomarkers and health records are encrypted at rest and in transit.
              By signing in, you agree to the BioSync AI Terms of Clinical Service.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  topNavRow: {
    paddingHorizontal: 18,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    marginBottom: 14,
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
  screenHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  screenSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  phonePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phonePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  changeNumberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  changeNumberPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.cyanLight,
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
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  otpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    height: 56,
  },
  inputRowFocused: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(6, 182, 212, 0.03)',
  },
  otpTextInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    letterSpacing: 8,
    fontWeight: '900',
    fontSize: 22,
    color: colors.cyanLight,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: colors.roseLight,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: colors.emerald,
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
  resendContainer: {
    alignItems: 'center',
    marginTop: 18,
    gap: 12,
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
  changeNumberBottomBtn: {
    paddingVertical: 4,
  },
  changeNumberBottomText: {
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
});

export default OtpScreen;

import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Modal, Animated, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Phone, Lock, Eye, EyeOff, CircleAlert, Check, Info, Sun, Moon, ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../theme/colors';
import useAuthStore from '../store/authStore';

const { width } = Dimensions.get('window');

export const LoginScreen = () => {
  const { isDark, colors, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { login } = useAuthStore();

  const [phone,           setPhone]           = useState('');
  const [password,        setPassword]        = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [rememberMe,      setRememberMe]      = useState(true);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [phoneFocused,    setPhoneFocused]    = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [toastVisible,    setToastVisible]    = useState(false);
  const [supportVisible,  setSupportVisible]  = useState(false);

  const toastOpacity    = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-16)).current;
  const toastTimeoutRef = useRef(null);

  const showToast = () => {
    setToastVisible(true);
    Animated.parallel([
      Animated.timing(toastOpacity,    { toValue: 1,  duration: 280, useNativeDriver: true }),
      Animated.spring(toastTranslateY, { toValue: 0,  friction: 8,   tension: 50, useNativeDriver: true }),
    ]).start();
    toastTimeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity,    { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(toastTranslateY, { toValue: -16, duration: 220, useNativeDriver: true }),
      ]).start(() => setToastVisible(false));
    }, 3000);
  };

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setError('Enter your mobile number and password.');
      return;
    }
    const clean = phone.trim().replace(/\D/g, '').slice(-10);
    if (clean.length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }

    try {
      setLoading(true);
      setError('');
      const res = await login(clean, password);
      if (!res.success) {
        setError(res.message || 'Authentication failed. Check your credentials.');
      } else {
        showToast();
      }
    } catch {
      setError('Cannot connect to server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background */}
      <LinearGradient
        colors={isDark ? ['#030712', '#070E1A', '#030712'] : ['#F8FAFC', '#EFF6FF', '#F1F5F9']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.orb, styles.orbTL]} />
      <View style={[styles.orb, styles.orbBR]} />

      {/* Top Corner Theme Toggle */}
      <View style={styles.topBar}>
        <View style={styles.securityBadge}>
          <ShieldCheck size={13} color={colors.emeraldLight} />
          <Text style={styles.securityBadgeText}>HIPAA ENCRYPTED</Text>
        </View>
        <TouchableOpacity
          style={styles.themeToggleBtn}
          onPress={toggleTheme}
          activeOpacity={0.8}
          accessibilityLabel="Toggle color theme"
        >
          {isDark ? (
            <Sun size={15} color={colors.amberLight} />
          ) : (
            <Moon size={15} color={colors.primary} />
          )}
          <Text style={styles.themeToggleText}>
            {isDark ? 'Light' : 'Dark'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Toast */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, transform: [{ translateY: toastTranslateY }] }]}>
          <View style={styles.toastCheck}>
            <Check size={13} color="#FFFFFF" strokeWidth={3.5} />
          </View>
          <Text style={styles.toastText}>Signed in successfully</Text>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoBadge}>
            <LinearGradient
              colors={isDark ? ['rgba(6,182,212,0.22)', 'rgba(6,182,212,0.04)'] : ['rgba(8,145,178,0.14)', 'rgba(8,145,178,0.03)']}
              style={styles.logoGrad}
            >
              <Image source={require('../../assets/Logo.png')} style={styles.logoImage} resizeMode="contain" />
            </LinearGradient>
          </View>
          <Text style={styles.brandTitle}>
            BioSync<Text style={{ color: colors.primaryLight }}>AI</Text>
          </Text>
          <Text style={styles.brandSub}>CENTRAL LABORATORY FIELD PORTAL</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Staff Sign In</Text>
          <Text style={styles.cardSubtitle}>Authenticate with your registered clinical credentials</Text>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
            <View style={[styles.inputBox, phoneFocused && styles.inputBoxFocused]}>
              <Phone size={18} color={phoneFocused ? colors.primaryLight : colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                onChangeText={(t) => { setPhone(t); if (error) setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <TouchableOpacity onPress={() => setSupportVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.forgot}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputBox, passwordFocused && styles.inputBoxFocused]}>
              <Lock size={18} color={passwordFocused ? colors.primaryLight : colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showPassword
                  ? <EyeOff size={18} color={colors.textMuted} />
                  : <Eye size={18} color={colors.textMuted} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember me */}
          <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.8}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Check size={11} color="#FFFFFF" strokeWidth={4} />}
            </View>
            <Text style={styles.rememberText}>Keep my clinical session signed in</Text>
          </TouchableOpacity>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <CircleAlert size={16} color={colors.roseLight} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.75 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGrad}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.btnText}>Signing in…</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>Sign In to Portal</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Support modal */}
      <Modal visible={supportVisible} transparent animationType="fade" onRequestClose={() => setSupportVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <Info size={20} color={colors.primaryLight} />
              </View>
              <Text style={styles.modalTitle}>Password Reset</Text>
            </View>
            <Text style={styles.modalBody}>
              For security, contact your central lab administrator to reset staff credentials.
            </Text>
            <View style={styles.supportBox}>
              <Text style={styles.supportLabel}>Admin Email</Text>
              <Text style={styles.supportValue}>admin@biosync.ai</Text>
              <View style={styles.supportDivider} />
              <Text style={styles.supportLabel}>IT Help Desk</Text>
              <Text style={styles.supportValue}>+91 40 8822 4000</Text>
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setSupportVisible(false)} activeOpacity={0.8}>
              <Text style={styles.modalBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgDark,
    },

    // Top bar with security badge + theme toggle
    topBar: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 54 : 34,
      left: 20,
      right: 20,
      zIndex: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    securityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.borderEmerald,
      borderWidth: 1,
      borderColor: colors.borderEmeraldStrong,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    securityBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.emeraldLight,
      letterSpacing: 0.7,
    },
    themeToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? colors.bgCardElevated : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? colors.borderDefault : colors.borderSubtle,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    themeToggleText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },

    // Ambient orbs
    orb: {
      position: 'absolute',
      width: width * 0.75,
      height: width * 0.75,
      borderRadius: width * 0.375,
      opacity: isDark ? 0.12 : 0.08,
    },
    orbTL: { backgroundColor: '#06b6d4', top: -(width * 0.2), left: -(width * 0.2) },
    orbBR: { backgroundColor: '#3b82f6', bottom: -(width * 0.2), right: -(width * 0.25) },

    // Toast
    toast: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 98 : 78,
      alignSelf: 'center',
      zIndex: 999,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.bgCardElevated : '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.borderEmeraldStrong,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 100,
      gap: 10,
      shadowColor: colors.emerald,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 8,
    },
    toastCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.emerald,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toastText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.1,
    },

    // Scroll
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      paddingTop: Platform.OS === 'ios' ? 96 : 80,
      paddingBottom: 40,
    },

    // Brand
    brand: { alignItems: 'center', marginBottom: 28 },
    logoBadge: {
      width: 78,
      height: 78,
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.borderCyanStrong,
      backgroundColor: isDark ? colors.bgCard : '#FFFFFF',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.35 : 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    logoGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logoImage: { width: 52, height: 52 },
    brandTitle: {
      fontSize: 30,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    brandSub: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      marginTop: 5,
      letterSpacing: 1.2,
    },

    // Card
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDefault : colors.borderSubtle,
      padding: 24,
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: isDark ? 0.65 : 0.08,
      shadowRadius: 24,
      elevation: 10,
    },
    cardTitle: {
      fontSize: 21,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.4,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: 22,
    },

    // Inputs
    fieldGroup: { marginBottom: 18 },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      marginBottom: 8,
      letterSpacing: 0.7,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    forgot: { fontSize: 12, color: colors.primaryLight, fontWeight: '800' },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.bgCardSoft : '#F8FAFC',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDefault : colors.borderSubtle,
      paddingHorizontal: 14,
      height: 52,
    },
    inputBoxFocused: {
      borderColor: colors.primary,
      backgroundColor: isDark ? 'rgba(6,182,212,0.06)' : '#FFFFFF',
    },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1,
      height: '100%',
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    eyeBtn: { padding: 6 },

    // Remember me
    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 20,
      marginTop: 2,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.bgCardSoft : '#F8FAFC',
    },
    checkboxActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    rememberText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },

    // Error
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.borderRose,
      borderWidth: 1,
      borderColor: colors.borderRoseStrong,
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
    },
    errorText: {
      color: colors.roseLight,
      fontSize: 13,
      fontWeight: '700',
      flex: 1,
      lineHeight: 18,
    },

    // Submit button
    submitBtn: {
      height: 52,
      borderRadius: 14,
      overflow: 'hidden',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.22,
      shadowRadius: 14,
      elevation: 8,
    },
    btnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    btnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.bgOverlay,
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      backgroundColor: colors.bgCardElevated,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isDark ? colors.borderDefault : colors.borderSubtle,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDark ? 0.50 : 0.15,
      shadowRadius: 24,
      elevation: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    modalIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.borderCyan,
      borderWidth: 1,
      borderColor: colors.borderCyanStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
      flex: 1,
    },
    modalBody: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
      lineHeight: 21,
    },
    supportBox: {
      backgroundColor: colors.bgCardSoft,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      marginBottom: 20,
    },
    supportDivider: {
      height: 1,
      backgroundColor: colors.borderSubtle,
      marginVertical: 12,
    },
    supportLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    supportValue: {
      fontSize: 15,
      color: colors.textPrimary,
      fontWeight: '800',
      marginTop: 3,
    },
    modalBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    modalBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
  });

export default LoginScreen;

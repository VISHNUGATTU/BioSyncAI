import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Modal, Animated, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Lock, Eye, EyeOff, CircleAlert, Check, Info } from 'lucide-react-native';
import { colors, useTheme } from '../theme/colors';
import useAuthStore from '../store/authStore';

const { width } = Dimensions.get('window');

export const LoginScreen = () => {
  const { isDark } = useTheme();
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
      style={[styles.container, { backgroundColor: colors.bgDark }]}
    >
      {/* Background */}
      <LinearGradient colors={isDark ? ['#000000', '#030712', '#000000'] : ['#F8FAFC', '#F1F5F9', '#FFFFFF']} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.orb, styles.orbTL]} />
      <View style={[styles.orb, styles.orbBR]} />

      {/* Toast */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, transform: [{ translateY: toastTranslateY }] }]}>
          <View style={styles.toastCheck}>
            <Check size={13} color="#000" strokeWidth={3.5} />
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
            <LinearGradient colors={['rgba(6,182,212,0.22)', 'rgba(6,182,212,0.04)']} style={styles.logoGrad}>
              <Image source={require('../../assets/Logo.png')} style={styles.logoImage} resizeMode="contain" />
            </LinearGradient>
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            BioSync<Text style={{ color: colors.primaryLight }}>AI</Text>
          </Text>
          <Text style={styles.brandSub}>Central Laboratory Portal</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle, shadowColor: isDark ? '#000000' : '#64748B', shadowOpacity: isDark ? 0.75 : 0.08 }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Staff Sign In</Text>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: phoneFocused ? colors.primary : colors.borderSubtle }, phoneFocused && styles.inputBoxFocused]}>
              <Phone size={18} color={phoneFocused ? colors.primaryLight : colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="10-digit mobile"
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
              <Text style={styles.fieldLabel}>Password</Text>
              <TouchableOpacity onPress={() => setSupportVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.forgot}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: passwordFocused ? colors.primary : colors.borderSubtle }, passwordFocused && styles.inputBoxFocused]}>
              <Lock size={18} color={passwordFocused ? colors.primaryLight : colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Password"
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
              {rememberMe && <Check size={11} color="#000" strokeWidth={4} />}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
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
                  <ActivityIndicator color="#000" size="small" />
                  <Text style={styles.btnText}>Signing in…</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Support modal */}
      <Modal visible={supportVisible} transparent animationType="fade" onRequestClose={() => setSupportVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <Info size={20} color={colors.primaryLight} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Password Reset</Text>
            </View>
            <Text style={styles.modalBody}>
              For security, contact your central lab administrator to reset staff credentials.
            </Text>
            <View style={[styles.supportBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.borderSubtle }]}>
              <Text style={styles.supportLabel}>Admin Email</Text>
              <Text style={[styles.supportValue, { color: colors.textPrimary }]}>admin@biosync.ai</Text>
              <View style={styles.supportDivider} />
              <Text style={styles.supportLabel}>IT Help Desk</Text>
              <Text style={[styles.supportValue, { color: colors.textPrimary }]}>+91 40 8822 4000</Text>
            </View>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={() => setSupportVisible(false)} activeOpacity={0.8}>
              <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Ambient orbs
  orb:   { position: 'absolute', width: width * 0.75, height: width * 0.75, borderRadius: width * 0.375, opacity: 0.12 },
  orbTL: { backgroundColor: '#06b6d4', top: -(width * 0.2), left: -(width * 0.2) },
  orbBR: { backgroundColor: '#3b82f6', bottom: -(width * 0.2), right: -(width * 0.25) },

  // Toast
  toast: {
    position:        'absolute',
    top:             Platform.OS === 'ios' ? 56 : 36,
    alignSelf:       'center',
    zIndex:          999,
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: 'rgba(14, 14, 18, 0.94)',
    borderWidth:     1,
    borderColor:     'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderRadius:    100,
    gap:             10,
    shadowColor:     '#10b981',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.22,
    shadowRadius:    14,
    elevation:       8,
  },
  toastCheck: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },

  // Scroll
  scroll: {
    flexGrow:        1,
    justifyContent:  'center',
    padding:         24,
    paddingTop:      Platform.OS === 'ios' ? 64 : 48,
    paddingBottom:   40,
  },

  // Brand
  brand:       { alignItems: 'center', marginBottom: 32 },
  logoBadge: {
    width: 76, height: 76, borderRadius: 24,
    overflow: 'hidden', marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)',
    shadowColor: '#06b6d4', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  logoGrad:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoImage:   { width: 52, height: 52 },
  brandTitle:  { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  brandSub:    { fontSize: 13, color: colors.textMuted, marginTop: 4, letterSpacing: 0.4 },

  // Card
  card: {
    backgroundColor: 'rgba(14, 14, 18, 0.65)',
    borderRadius:    28,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.06)',
    padding:         24,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 20 },
    shadowOpacity:   0.75,
    shadowRadius:    28,
    elevation:       12,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginBottom: 22 },

  // Inputs
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8, letterSpacing: 0.1 },
  labelRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgot:     { fontSize: 12, color: colors.primaryLight, fontWeight: '700' },
  inputBox: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    height:          52,
  },
  inputBoxFocused: {
    borderColor:   'rgba(6,182,212,0.50)',
    backgroundColor: 'rgba(6,182,212,0.04)',
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex:       1,
    height:     '100%',
    color:      '#fff',
    fontSize:   15,
    fontWeight: '500',
  },
  eyeBtn: { padding: 6 },

  // Remember me
  rememberRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 2 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  checkboxActive:  { backgroundColor: colors.primary, borderColor: colors.primary },
  rememberText:    { fontSize: 13, color: colors.textMuted, fontWeight: '500' },

  // Error
  errorBox: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: 'rgba(244,63,94,0.10)',
    borderWidth:     1,
    borderColor:     'rgba(244,63,94,0.25)',
    padding:         12,
    borderRadius:    12,
    marginBottom:    20,
  },
  errorText: { color: colors.roseLight, fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },

  // Submit button
  submitBtn: {
    height:       52,
    borderRadius: 14,
    overflow:     'hidden',
    shadowColor:  '#06b6d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius:  14,
    elevation:     8,
  },
  btnGrad:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText:  { color: '#000', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: '#0e0e12',
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
    padding:         24,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 16 },
    shadowOpacity:   0.50,
    shadowRadius:    24,
    elevation:       20,
  },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  modalIconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(6,182,212,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle:  { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1 },
  modalBody:   { fontSize: 14, color: colors.textMuted, marginBottom: 20, lineHeight: 21 },
  supportBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius:    14,
    padding:         18,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.05)',
    marginBottom:    20,
  },
  supportDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  supportLabel:   { fontSize: 11, color: colors.textDisabled, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  supportValue:   { fontSize: 15, color: '#fff', fontWeight: '700', marginTop: 3 },
  modalBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical:  14,
    borderRadius:     14,
    alignItems:       'center',
  },
  modalBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});

export default LoginScreen;
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Server, ShieldCheck, CircleAlert } from 'lucide-react-native';
import { colors } from '../theme/colors';
import userApi from '../api/userApi';
import api, { setCustomApiUrl, DEFAULT_BASE_URL } from '../api/axios';

export const LoginScreen = ({ navigation }) => {
  const [phoneNumber,        setPhoneNumber]        = useState('');
  const [loading,            setLoading]            = useState(false);
  const [errorMessage,       setErrorMessage]       = useState('');
  const [phoneFocused,       setPhoneFocused]       = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customHost,         setCustomHost]         = useState(api.defaults.baseURL);

  const handleRequestOTP = async () => {
    const rawNumber = phoneNumber.trim().replace(/\D/g, '');
    if (!rawNumber || rawNumber.length < 10) {
      setErrorMessage('Enter a valid 10-digit mobile number.');
      return;
    }
    const cleanNumber = rawNumber.slice(-10);
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await userApi.requestOTP(cleanNumber);
      if (res.success) {
        navigation.navigate('OtpScreen', { phoneNumber: cleanNumber });
      } else {
        setErrorMessage(res.message || 'Unable to send verification code. Please retry.');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Server unreachable. Check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const saveCustomHost = async () => {
    try {
      await setCustomApiUrl(customHost);
      setServerModalVisible(false);
    } catch {
      setErrorMessage('Invalid gateway URL.');
    }
  };

  const resetDefaultHost = async () => {
    setCustomHost(DEFAULT_BASE_URL);
    await setCustomApiUrl(DEFAULT_BASE_URL);
    setServerModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Background gradient */}
      <LinearGradient colors={['#000000', '#040812', '#000000']} style={StyleSheet.absoluteFillObject} />

      {/* Ambient orbs */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.securePill}>
          <View style={styles.pulseDot} />
          <Text style={styles.securePillText}>ENCRYPTED SESSION</Text>
        </View>
        <TouchableOpacity
          style={styles.serverBtn}
          onPress={() => setServerModalVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Server size={15} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoBadge}>
              <LinearGradient
                colors={['rgba(6,182,212,0.20)', 'rgba(6,182,212,0.04)']}
                style={styles.logoGrad}
              >
                <Image source={require('../../assets/Logo.png')} style={styles.logoImage} resizeMode="contain" />
              </LinearGradient>
            </View>
            <Text style={styles.brandTitle}>
              BioSync<Text style={{ color: colors.cyanLight }}>AI</Text>
            </Text>
            <Text style={styles.brandTagline}>Precision Diagnostics & Metabolic Health</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Patient Sign In</Text>
            <Text style={styles.cardSub}>
              Enter your registered mobile number to access your diagnostic records and home visits.
            </Text>

            {/* Phone input */}
            <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
            <View style={[styles.phoneRow, phoneFocused && styles.phoneRowFocused]}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={phoneNumber}
                onChangeText={(t) => { setPhoneNumber(t); if (errorMessage) setErrorMessage(''); }}
                placeholder="10-digit mobile"
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

            {/* Error */}
            {!!errorMessage && (
              <View style={styles.errorBox}>
                <CircleAlert size={15} color={colors.roseLight} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaBtn, loading && { opacity: 0.75 }]}
              onPress={handleRequestOTP}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#06b6d4', '#0891b2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGrad}
              >
                {loading ? (
                  <View style={styles.ctaRow}>
                    <ActivityIndicator size="small" color="#000" />
                    <Text style={styles.ctaText}>Sending…</Text>
                  </View>
                ) : (
                  <View style={styles.ctaRow}>
                    <Text style={styles.ctaText}>Get Verification Code</Text>
                    <ArrowRight size={17} color="#000" strokeWidth={2.5} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* OTP info */}
            <View style={styles.otpNote}>
              <ShieldCheck size={13} color={colors.textMuted} />
              <Text style={styles.otpNoteText}>A secure 6-digit OTP will be sent instantly.</Text>
            </View>
          </View>

          {/* Trust footer */}
          <View style={styles.trustFooter}>
            <View style={styles.trustRow}>
              <View style={styles.trustDot} />
              <Text style={styles.trustText}>HIPAA & DISHA STANDARDS · 256-BIT ENCRYPTION</Text>
            </View>
            <Text style={styles.trustDisclaimer}>
              By signing in, you agree to BioSyncAI's Terms of Service and Medical Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Server config modal */}
      <Modal
        visible={serverModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Server size={18} color={colors.cyanLight} />
              <Text style={styles.modalTitle}>Gateway Configuration</Text>
            </View>
            <Text style={styles.modalSub}>Configure the API endpoint for your deployment.</Text>
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
              <TouchableOpacity style={styles.modalBtnGhost} onPress={resetDefaultHost}>
                <Text style={styles.modalBtnGhostText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setServerModalVisible(false)}>
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={saveCustomHost}>
                <Text style={styles.modalBtnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },

  // Ambient orbs
  orbTopRight: {
    position: 'absolute', top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(6,182,212,0.10)',
  },
  orbBottomLeft: {
    position: 'absolute', bottom: -80, left: -80,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  securePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.22)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emeraldLight },
  securePillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.9, color: colors.cyanLight },
  serverBtn: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  // Scroll
  scrollContent: { flexGrow: 1, padding: 22, paddingTop: 12, paddingBottom: 36, justifyContent: 'center' },

  // Brand
  brand: { alignItems: 'center', marginBottom: 28 },
  logoBadge: {
    width: 72, height: 72, borderRadius: 22, overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.28)',
    shadowColor: '#06b6d4', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  logoGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 48, height: 48 },
  brandTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  brandTagline: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: 'rgba(10,10,14,0.75)',
    borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65, shadowRadius: 24, elevation: 10,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 6 },
  cardSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 20 },

  // Input
  inputLabel: {
    fontSize: 10, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 0.8, marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14, overflow: 'hidden', height: 52, marginBottom: 14,
  },
  phoneRowFocused: { borderColor: colors.cyan, backgroundColor: 'rgba(6,182,212,0.04)' },
  countryCode: {
    paddingHorizontal: 14, height: '100%', alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  countryCodeText: { fontSize: 14, fontWeight: '800', color: colors.cyanLight },
  textInput: { flex: 1, paddingHorizontal: 14, height: '100%', fontSize: 15, color: '#fff', fontWeight: '500' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(244,63,94,0.10)',
    borderWidth: 1, borderColor: 'rgba(244,63,94,0.24)',
    padding: 12, borderRadius: 12, marginBottom: 14,
  },
  errorText: { color: colors.roseLight, fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 17 },

  // CTA
  ctaBtn: {
    height: 52, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#06b6d4', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30, shadowRadius: 12, elevation: 6,
  },
  ctaGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { fontSize: 14, fontWeight: '800', color: '#000', letterSpacing: 0.2 },

  // OTP note
  otpNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 14,
  },
  otpNoteText: { fontSize: 11, color: colors.textMuted },

  // Trust footer
  trustFooter: { marginTop: 24, alignItems: 'center', paddingHorizontal: 8 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  trustDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.textMuted },
  trustText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.9, color: colors.textMuted },
  trustDisclaimer: { fontSize: 10, color: 'rgba(255,255,255,0.30)', textAlign: 'center', lineHeight: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#0a0a0e', borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 22,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalTitle:  { fontSize: 17, fontWeight: '800', color: '#fff' },
  modalSub:    { fontSize: 12, color: colors.textSecondary, marginBottom: 16, lineHeight: 18 },
  serverInput: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.30)',
    color: '#fff', paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, marginBottom: 18,
  },
  modalActions:       { flexDirection: 'row', gap: 8 },
  modalBtnGhost: {
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  modalBtnGhostText:  { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  modalBtnPrimary: {
    flex: 1, backgroundColor: colors.cyan, paddingVertical: 12,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  modalBtnPrimaryText: { color: '#000', fontSize: 13, fontWeight: '800' },
});

export default LoginScreen;

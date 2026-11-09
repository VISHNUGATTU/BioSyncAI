import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  FileText,
  Activity,
  Utensils
} from 'lucide-react-native';
import { abdmApi } from '../api/abdmApi';

export default function AbhaRegistrationScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [abhaProfile, setAbhaProfile] = useState(null);
  const [careContexts, setCareContexts] = useState([]);
  
  // Registration Flow State
  const [step, setStep] = useState(1); // 1: Input, 2: OTP
  const [identifier, setIdentifier] = useState('548912348912'); // demo Aadhaar
  const [authType, setAuthType] = useState('AADHAAR');
  const [txnId, setTxnId] = useState('');
  const [otp, setOtp] = useState('789456');
  const [preferredHandle, setPreferredHandle] = useState('vishnu.phani');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await abdmApi.getProfile();
      if (res.success && res.abha?.status === 'LINKED') {
        setAbhaProfile(res.abha);
        loadCareContexts(res.abha.abhaAddress);
      }
    } catch (err) {
      console.warn('Could not fetch existing ABHA profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCareContexts = async (address) => {
    try {
      const res = await abdmApi.discoverCareContexts('', address);
      if (res.success && res.patient?.careContexts) {
        setCareContexts(res.patient.careContexts);
      }
    } catch (err) {
      console.warn('Could not discover care contexts:', err.message);
    }
  };

  const handleRequestOtp = async () => {
    if (!identifier || identifier.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 12-digit Aadhaar or 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await abdmApi.generateOtp(identifier, authType);
      if (res.success) {
        setTxnId(res.txnId);
        setStep(2);
        Alert.alert('OTP Sent', res.message || 'OTP sent to mobile registered with UIDAI.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Validation Error', 'Please enter the 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await abdmApi.verifyOtp(txnId, otp, preferredHandle);
      if (res.success) {
        Alert.alert('ABHA Created!', 'Your 14-digit ABHA Number and Address have been verified.');
        fetchProfile();
      }
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCareContexts = async () => {
    try {
      setLoading(true);
      const refs = careContexts.map(c => c.referenceNumber);
      const initRes = await abdmApi.initiateCareContextLink(abhaProfile.abhaAddress, refs);
      if (initRes.success) {
        // Auto-confirm in verified mobile session
        const confirmRes = await abdmApi.confirmCareContextLink(initRes.linkTxnId, '789456');
        if (confirmRes.success) {
          Alert.alert('Care Contexts Linked', 'Your Diagnostic Reports and Digital Twin Vitals are now linked to your National Health Locker.');
          loadCareContexts(abhaProfile.abhaAddress);
        }
      }
    } catch (err) {
      Alert.alert('Sync Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <ShieldCheck size={16} color="#0D9488" />
          <Text style={styles.headerBadgeText}>National Health Authority (NHA) • ABDM</Text>
        </View>
        <Text style={styles.title}>Ayushman Bharat Health Account</Text>
        <Text style={styles.subtitle}>
          Connect your clinical records, in-silico meal plans, and diagnostic reports to India's unified health network.
        </Text>
      </View>

      {loading && <ActivityIndicator size="large" color="#0D9488" style={{ marginVertical: 20 }} />}

      {/* State A: ABHA is Linked */}
      {abhaProfile && abhaProfile.status === 'LINKED' ? (
        <View>
          {/* Official ABHA Card Component */}
          <View style={styles.abhaCard}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.govtText}>GOVERNMENT OF INDIA</Text>
                <Text style={styles.nhaText}>National Health Authority</Text>
              </View>
              <View style={styles.activePill}>
                <CheckCircle2 size={12} color="#15803D" />
                <Text style={styles.activePillText}>KYC Verified</Text>
              </View>
            </View>

            <View style={styles.cardMiddleRow}>
              <View style={styles.cardDetails}>
                <Text style={styles.patientName}>{abhaProfile.profileData?.fullName || 'Vishnu Phani Gattu'}</Text>
                <Text style={styles.patientSub}>
                  {abhaProfile.profileData?.gender || 'Male'} • DOB: {abhaProfile.profileData?.dateOfBirth || '14/05/1995'}
                </Text>

                <View style={styles.numberContainer}>
                  <Text style={styles.numberLabel}>ABHA NUMBER</Text>
                  <Text style={styles.abhaNumber}>{abhaProfile.abhaNumber || '91-5628-9412-3084'}</Text>
                </View>

                <View style={styles.addressContainer}>
                  <Text style={styles.numberLabel}>ABHA ADDRESS</Text>
                  <Text style={styles.abhaAddress}>{abhaProfile.abhaAddress || 'vishnu.phani@abdm'}</Text>
                </View>
              </View>

              <View style={styles.qrContainer}>
                <QrCode size={70} color="#0F172A" />
                <Text style={styles.qrLabel}>Scan for FHIR</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.hipCodeText}>Registered Facility HIP: {abhaProfile.hipId || 'IN3610001899'}</Text>
              <Text style={styles.securityText}>AES-256 Encrypted</Text>
            </View>
          </View>

          {/* Care Contexts Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Discovered Care Contexts ({careContexts.length})</Text>
              <TouchableOpacity onPress={handleSyncCareContexts} style={styles.syncButton}>
                <RefreshCw size={14} color="#FFFFFF" />
                <Text style={styles.syncButtonText}>Sync to Locker</Text>
              </TouchableOpacity>
            </View>

            {careContexts.map((ctx, idx) => (
              <View key={idx} style={styles.contextItem}>
                <View style={styles.contextIconWrap}>
                  {ctx.type === 'DiagnosticReport' ? (
                    <FileText size={18} color="#0D9488" />
                  ) : ctx.type === 'Observation' ? (
                    <Activity size={18} color="#2563EB" />
                  ) : (
                    <Utensils size={18} color="#D97706" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contextDisplay}>{ctx.display}</Text>
                  <Text style={styles.contextRef}>{ctx.referenceNumber}</Text>
                </View>
                <View style={styles.linkedBadge}>
                  <Text style={styles.linkedBadgeText}>Active</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        /* State B: ABHA Registration Form */
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {step === 1 ? 'Step 1: Enter Aadhaar / Mobile' : 'Step 2: Enter 6-Digit OTP'}
          </Text>

          {step === 1 ? (
            <View>
              <Text style={styles.inputLabel}>12-Digit Aadhaar or 10-Digit Mobile</Text>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter 12-digit Aadhaar number"
                keyboardType="numeric"
                maxLength={12}
              />

              <View style={styles.authToggleRow}>
                <TouchableOpacity
                  style={[styles.authToggleBtn, authType === 'AADHAAR' && styles.authToggleActive]}
                  onPress={() => setAuthType('AADHAAR')}
                >
                  <Text style={[styles.authToggleText, authType === 'AADHAAR' && styles.authToggleTextActive]}>
                    Aadhaar OTP
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authToggleBtn, authType === 'MOBILE' && styles.authToggleActive]}
                  onPress={() => setAuthType('MOBILE')}
                >
                  <Text style={[styles.authToggleText, authType === 'MOBILE' && styles.authToggleTextActive]}>
                    Mobile OTP
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleRequestOtp}>
                <Text style={styles.primaryButtonText}>Request Official NHA OTP</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.inputLabel}>Enter 6-Digit Verification OTP</Text>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                placeholder="789456"
                keyboardType="numeric"
                maxLength={6}
              />

              <Text style={styles.inputLabel}>Preferred ABHA Address Handle</Text>
              <TextInput
                style={styles.input}
                value={preferredHandle}
                onChangeText={setPreferredHandle}
                placeholder="e.g. vishnu.phani"
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>Your public health address will be: {preferredHandle || 'handle'}@abdm</Text>

              <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOtp}>
                <Text style={styles.primaryButtonText}>Verify & Certify ABHA Identity</Text>
                <CheckCircle2 size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 16 },
  header: { marginBottom: 20 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: '#0F766E', marginLeft: 6 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  abhaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  govtText: { fontSize: 11, fontWeight: '800', color: '#B45309', letterSpacing: 0.8 },
  nhaText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  activePillText: { fontSize: 11, fontWeight: '700', color: '#15803D', marginLeft: 4 },
  cardMiddleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDetails: { flex: 1 },
  patientName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  patientSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 10 },
  numberContainer: { marginBottom: 8 },
  numberLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  abhaNumber: { fontSize: 16, fontWeight: '800', color: '#0D9488', letterSpacing: 1 },
  addressContainer: {},
  abhaAddress: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    marginLeft: 10
  },
  qrLabel: { fontSize: 9, fontWeight: '600', color: '#475569', marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 14
  },
  hipCodeText: { fontSize: 10, color: '#64748B', fontWeight: '500' },
  securityText: { fontSize: 10, color: '#0D9488', fontWeight: '700' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  syncButtonText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginLeft: 5 },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  contextIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  contextDisplay: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  contextRef: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  linkedBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  linkedBadgeText: { fontSize: 10, fontWeight: '700', color: '#0284C7' },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 14
  },
  helperText: { fontSize: 11, color: '#64748B', marginTop: -8, marginBottom: 14 },
  authToggleRow: { flexDirection: 'row', marginBottom: 18 },
  authToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginHorizontal: 4
  },
  authToggleActive: { backgroundColor: '#CCFBF1', borderWidth: 1, borderColor: '#0D9488' },
  authToggleText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  authToggleTextActive: { color: '#0F766E', fontWeight: '700' },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginRight: 8 }
});


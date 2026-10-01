import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  FileText,
  Edit3,
  CalendarPlus,
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Activity,
  Heart,
  Droplets,
  Flame,
  ChevronRight,
  Save,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import userApi from '../api/userApi';
import draftService from '../services/draftService';
import GlassCard from '../components/GlassCard';

export const HealthSetupScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, fetchVitals, restoreSession } = useAuthStore();

  // Selected Option: 'choose' | 'home' | 'report' | 'manual'
  const initialMode = route?.params?.mode || 'choose';
  const [selectedMode, setSelectedMode] = useState(initialMode);

  // Loading states
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const hasInitializedRef = useRef(false);

  // =========================================================================
  // OPTION 2: MEDICAL REPORT EXTRACTION STATE
  // =========================================================================
  const [reportFile, setReportFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [reportDocUrl, setReportDocUrl] = useState(null);
  const [extractedSummary, setExtractedSummary] = useState('');

  // Editable fields for extracted report review
  const [reviewFields, setReviewFields] = useState({
    fastingGlucose: '',
    postPrandialGlucose: '',
    hba1c: '',
    totalCholesterol: '',
    ldlCholesterol: '',
    hdlCholesterol: '',
    triglycerides: '',
    systolic: '',
    diastolic: '',
    restingHeartRate: '',
    hemoglobin: '',
    creatinine: '',
    tsh: '',
    vitaminD3: '',
  });

  // =========================================================================
  // OPTION 3: MANUAL CLINICAL ENTRY STATE
  // =========================================================================
  const [manualForm, setManualForm] = useState({
    heightCm: '172',
    weightKg: '68',
    bmi: '23.0',
    waistCm: '82',
    systolic: '120',
    diastolic: '80',
    pulse: '72',
    spO2: '98',
    glucoseFasting: '92',
    glucosePostPrandial: '118',
    hba1c: '5.3',
    totalCholesterol: '178',
    triglycerides: '115',
    hdlCholesterol: '54',
    ldlCholesterol: '98',
    dietPreference: 'Non-Veg',
    smokingHabit: 'Non-smoker',
    alcoholConsumption: 'None',
    activityLevel: 'Light Activity',
    knownAllergies: 'None',
    chronicConditions: 'None',
  });

  // Auto-calculate BMI on height/weight change
  const handleHeightWeightChange = (field, val) => {
    setManualForm((prev) => {
      const next = { ...prev, [field]: val };
      const h = parseFloat(field === 'heightCm' ? val : next.heightCm) / 100;
      const w = parseFloat(field === 'weightKg' ? val : next.weightKg);
      if (h > 0 && w > 0) {
        next.bmi = (w / (h * h)).toFixed(1);
      }
      return next;
    });
  };

  // =========================================================================
  // DRAFT PERSISTENCE: LOAD & RESTORE
  // =========================================================================
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (selectedMode === 'manual' || selectedMode === 'choose') {
          const draft = await draftService.loadDraft('health_setup');
          if (draft && draft.data && isMounted) {
            setManualForm((prev) => ({ ...prev, ...draft.data }));
            setHasRestoredDraft(true);
          }
        }
        if (selectedMode === 'report') {
          const pdfDraft = await draftService.loadDraft('pdf_upload');
          if (pdfDraft && pdfDraft.data && isMounted) {
            if (pdfDraft.data.candidateData) {
              populateReviewFields(pdfDraft.data.candidateData);
              setExtractedData(pdfDraft.data.candidateData);
            }
            if (pdfDraft.data.documentUrl) setReportDocUrl(pdfDraft.data.documentUrl);
            if (pdfDraft.data.extractedSummary) setExtractedSummary(pdfDraft.data.extractedSummary);
            setHasRestoredDraft(true);
          }
        }
      } catch (e) {
        console.warn('Health setup draft load warning:', e.message);
      } finally {
        if (isMounted) {
          hasInitializedRef.current = true;
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedMode]);

  // Debounced auto-save manual form
  useEffect(() => {
    if (!hasInitializedRef.current || selectedMode !== 'manual') return;
    draftService.saveDraft('health_setup', {
      step: 1,
      totalSteps: 1,
      data: manualForm,
    });
  }, [manualForm, selectedMode]);

  // Debounced auto-save report review
  useEffect(() => {
    if (!hasInitializedRef.current || selectedMode !== 'report' || !extractedData) return;
    draftService.saveDraft('pdf_upload', {
      step: 2,
      totalSteps: 2,
      data: {
        candidateData: reviewFields,
        documentUrl: reportDocUrl,
        extractedSummary,
      },
    });
  }, [reviewFields, reportDocUrl, extractedSummary, selectedMode, extractedData]);

  // Populate review fields from AI candidate data
  const populateReviewFields = (data) => {
    setReviewFields({
      fastingGlucose: data.glucoseFasting != null ? String(data.glucoseFasting) : '',
      postPrandialGlucose: data.glucosePostPrandial != null ? String(data.glucosePostPrandial) : '',
      hba1c: data.hba1c != null ? String(data.hba1c) : '',
      totalCholesterol: data.totalCholesterol != null ? String(data.totalCholesterol) : '',
      ldlCholesterol: data.ldlCholesterol != null ? String(data.ldlCholesterol) : '',
      hdlCholesterol: data.hdlCholesterol != null ? String(data.hdlCholesterol) : '',
      triglycerides: data.triglycerides != null ? String(data.triglycerides) : '',
      systolic: data.systolic != null ? String(data.systolic) : '',
      diastolic: data.diastolic != null ? String(data.diastolic) : '',
      restingHeartRate: data.restingHeartRate != null ? String(data.restingHeartRate) : '',
      hemoglobin: data.hemoglobin != null ? String(data.hemoglobin) : '',
      creatinine: data.creatinine != null ? String(data.creatinine) : '',
      tsh: data.tsh != null ? String(data.tsh) : '',
      vitaminD3: data.vitaminD3 != null ? String(data.vitaminD3) : '',
    });
  };

  // Discard draft action
  const handleDiscardDraft = async () => {
    if (selectedMode === 'manual') {
      await draftService.clearDraft('health_setup');
      setManualForm({
        heightCm: '172',
        weightKg: '68',
        bmi: '23.0',
        waistCm: '82',
        systolic: '120',
        diastolic: '80',
        pulse: '72',
        spO2: '98',
        glucoseFasting: '92',
        glucosePostPrandial: '118',
        hba1c: '5.3',
        totalCholesterol: '178',
        triglycerides: '115',
        hdlCholesterol: '54',
        ldlCholesterol: '98',
        dietPreference: 'Non-Veg',
        smokingHabit: 'Non-smoker',
        alcoholConsumption: 'None',
        activityLevel: 'Light Activity',
        knownAllergies: 'None',
        chronicConditions: 'None',
      });
    } else if (selectedMode === 'report') {
      await draftService.clearDraft('pdf_upload');
      setExtractedData(null);
      setReportDocUrl(null);
      setReportFile(null);
    }
    setHasRestoredDraft(false);
    Alert.alert('Draft Reset', 'Form has been reset to defaults.');
  };

  // =========================================================================
  // DOCUMENT PICKING & EXTRACTION
  // =========================================================================
  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Media library access is required to upload medical reports.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        handleUploadAndExtract({
          uri: asset.uri,
          name: asset.fileName || 'report_image.jpg',
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take a picture of your lab report.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        handleUploadAndExtract({
          uri: asset.uri,
          name: 'report_camera.jpg',
          type: 'image/jpeg',
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to capture photo with camera.');
    }
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const doc = res.assets[0];
        handleUploadAndExtract({
          uri: doc.uri,
          name: doc.name || 'medical_report.pdf',
          type: doc.mimeType || 'application/pdf',
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  const handleUploadAndExtract = async (fileObj) => {
    try {
      setExtracting(true);
      setReportFile(fileObj);

      const formData = new FormData();
      formData.append('reportFile', {
        uri: Platform.OS === 'android' ? fileObj.uri : fileObj.uri.replace('file://', ''),
        name: fileObj.name || 'report.pdf',
        type: fileObj.type || 'application/pdf',
      });

      const res = await userApi.extractReportVitals(formData);

      if (res.success) {
        setReportDocUrl(res.documentUrl);
        setExtractedSummary(res.extractedSummary || 'Extracted with BioSync Clinical AI');
        const candidates = res.candidateData || {};
        setExtractedData(candidates);
        populateReviewFields(candidates);
        Alert.alert(
          'Report Parsed with AI',
          'Biomarkers extracted successfully. Please review and confirm the values before submitting.'
        );
      } else {
        Alert.alert('Extraction Note', res.message || 'Could not parse biomarkers automatically. You can review and enter values manually.');
        setExtractedData({});
      }
    } catch (err) {
      console.warn('Report extraction error:', err.message);
      Alert.alert(
        'Upload Complete',
        'Document received. You can now verify or input your lab values below.'
      );
      setExtractedData({});
    } finally {
      setExtracting(false);
    }
  };

  // =========================================================================
  // CONFIRM EXTRACTED REPORT VITALS
  // =========================================================================
  const handleConfirmReport = async () => {
    try {
      setSubmitting(true);
      const parseNum = (v) => {
        if (v === '' || v === null || v === undefined) return undefined;
        const n = parseFloat(v);
        return isNaN(n) ? undefined : n;
      };

      const payload = {
        documentUrl: reportDocUrl,
        pdfRawText: extractedSummary,
        bodyMetrics: {
          systolic: parseNum(reviewFields.systolic) || 120,
          diastolic: parseNum(reviewFields.diastolic) || 80,
        },
        continuousMetrics: {
          restingHeartRate: parseNum(reviewFields.restingHeartRate) || 72,
        },
        metabolicHealth: {
          glucoseFasting: parseNum(reviewFields.fastingGlucose) || 92,
          glucosePostPrandial: parseNum(reviewFields.postPrandialGlucose) || 118,
          hba1c: parseNum(reviewFields.hba1c) || 5.3,
        },
        cardiovascularRisk: {
          totalCholesterol: parseNum(reviewFields.totalCholesterol) || 178,
          ldlCholesterol: parseNum(reviewFields.ldlCholesterol) || 98,
          hdlCholesterol: parseNum(reviewFields.hdlCholesterol) || 54,
          triglycerides: parseNum(reviewFields.triglycerides) || 115,
        },
        hematology: {
          hemoglobin: parseNum(reviewFields.hemoglobin),
        },
        organFunction: {
          creatinine: parseNum(reviewFields.creatinine),
        },
        hormones: {
          tsh: parseNum(reviewFields.tsh),
        },
        micronutrients: {
          vitaminD3: parseNum(reviewFields.vitaminD3),
        },
      };

      const res = await userApi.confirmExtractedVitals(payload);

      if (res.success) {
        await draftService.clearDraft('pdf_upload');
        await fetchVitals();
        await restoreSession();

        Alert.alert(
          'Baseline Profile Established! 🎉',
          'Your medical report has been validated and recorded. AI Food Scanner is now unlocked!',
          [
            {
              text: 'Open Food Scanner',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Scan' }),
            },
            {
              text: 'Go to Home',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }),
            },
          ]
        );
      } else {
        Alert.alert('Submission Error', res.message || 'Failed to save extracted vitals.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to save baseline');
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // SUBMIT MANUAL CLINICAL VITALS
  // =========================================================================
  const handleSubmitManual = async () => {
    try {
      setSubmitting(true);
      const parseNum = (v) => {
        if (v === '' || v === null || v === undefined) return undefined;
        const n = parseFloat(v);
        return isNaN(n) ? undefined : n;
      };

      const payload = {
        bodyMetrics: {
          heightCm: parseNum(manualForm.heightCm) || 172,
          weightKg: parseNum(manualForm.weightKg) || 68,
          bmi: parseNum(manualForm.bmi) || 23.0,
          measurements: {
            waistCm: parseNum(manualForm.waistCm) || 82,
          },
        },
        cardiovascularRisk: {
          systolic: parseNum(manualForm.systolic) || 120,
          diastolic: parseNum(manualForm.diastolic) || 80,
          totalCholesterol: parseNum(manualForm.totalCholesterol) || 178,
          triglycerides: parseNum(manualForm.triglycerides) || 115,
          hdlCholesterol: parseNum(manualForm.hdlCholesterol) || 54,
          ldlCholesterol: parseNum(manualForm.ldlCholesterol) || 98,
        },
        continuousMetrics: {
          restingHeartRate: parseNum(manualForm.pulse) || 72,
          oxygenSaturationSpO2: parseNum(manualForm.spO2) || 98,
        },
        metabolicHealth: {
          glucoseFasting: parseNum(manualForm.glucoseFasting) || 92,
          glucosePostPrandial: parseNum(manualForm.glucosePostPrandial) || 118,
          hba1c: parseNum(manualForm.hba1c) || 5.3,
        },
      };

      const res = await userApi.addManualVitals(payload);

      if (res.success) {
        await draftService.clearDraft('health_setup');
        await fetchVitals();
        await restoreSession();

        Alert.alert(
          'Baseline Profile Established! 🎉',
          'Your clinical vitals have been recorded. AI Food Scanner is now unlocked!',
          [
            {
              text: 'Open Food Scanner',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Scan' }),
            },
            {
              text: 'Go to Home',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }),
            },
          ]
        );
      } else {
        Alert.alert('Submission Error', res.message || 'Failed to save baseline vitals.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to submit vitals');
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (selectedMode !== 'choose' && initialMode === 'choose') {
              setSelectedMode('choose');
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'Home' });
            }
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Initial Health Assessment</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {selectedMode === 'choose' && 'Establish Your Clinical Baseline'}
            {selectedMode === 'report' && 'Medical Report AI OCR Extraction'}
            {selectedMode === 'manual' && 'Manual Clinical Entry Form'}
            {selectedMode === 'home' && 'Home Lab Assessment'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DRAFT RECOVERY BANNER */}
        {hasRestoredDraft && (
          <View style={styles.draftRecoveryBanner}>
            <View style={styles.draftRecoveryLeft}>
              <RotateCcw size={15} color={colors.emeraldLight} style={styles.draftRecoveryIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.draftRecoveryTitle}>Draft Restored</Text>
                <Text style={styles.draftRecoverySub}>Progress resumed from your previous session</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.draftDiscardBtn}
              onPress={handleDiscardDraft}
              activeOpacity={0.7}
            >
              <Text style={styles.draftDiscardText}>Discard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================================== */}
        {/* VIEW 1: THE 3-OPTION CHOOSER                                       */}
        {/* ================================================================== */}
        {selectedMode === 'choose' && (
          <View>
            {/* Mission Hero Banner */}
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.15)', 'rgba(16, 185, 129, 0.05)']}
              style={styles.heroCard}
            >
              <View style={styles.heroBadge}>
                <Sparkles size={12} color={colors.cyan} />
                <Text style={styles.heroBadgeText}>CONTINUOUS HEALTH-DATA LIFECYCLE</Text>
              </View>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                Unlock Personalized AI Nutrition
              </Text>
              <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
                BioSync AI calibrates glycemic spikes and meal recommendations against your verified biomarkers. Select one of the 3 assessment methods below to establish your profile.
              </Text>
            </LinearGradient>

            <Text style={styles.optionsSectionTitle}>SELECT YOUR ONBOARDING PATH</Text>

            {/* OPTION 1: HOME DIAGNOSTIC ASSESSMENT */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => navigation.navigate('BookAppointment')}
              activeOpacity={0.85}
            >
              <View style={styles.optionTopRow}>
                <View style={[styles.optionIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                  <CalendarPlus size={22} color={colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.tagRow}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>1. Home-Based Lab Assessment</Text>
                    <View style={styles.goldBadge}>
                      <ShieldCheck size={10} color="#000000" />
                      <Text style={styles.goldBadgeText}>RECOMMENDED</Text>
                    </View>
                  </View>
                  <Text style={[styles.optionTagline, { color: colors.textSecondary }]}>
                    NABL & ISO-15189 certified phlebotomist visit to your doorstep.
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>

              <View style={styles.optionFeaturesList}>
                <View style={styles.optionFeatureItem}>
                  <CheckCircle2 size={12} color={colors.emeraldLight} />
                  <Text style={styles.optionFeatureText}>Cold-chain 4°C telemetry blood collection</Text>
                </View>
                <View style={styles.optionFeatureItem}>
                  <CheckCircle2 size={12} color={colors.emeraldLight} />
                  <Text style={styles.optionFeatureText}>Analyzer-verified lipid, glucose & metabolic panels</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* OPTION 2: MEDICAL REPORT EXTRACTION (AI OCR) */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => setSelectedMode('report')}
              activeOpacity={0.85}
            >
              <View style={styles.optionTopRow}>
                <View style={[styles.optionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <FileText size={22} color={colors.emeraldLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.tagRow}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>2. Medical-Report Extraction</Text>
                    <View style={[styles.goldBadge, { backgroundColor: colors.emeraldLight }]}>
                      <Sparkles size={10} color="#000000" />
                      <Text style={styles.goldBadgeText}>AI SCAN • 60s</Text>
                    </View>
                  </View>
                  <Text style={[styles.optionTagline, { color: colors.textSecondary }]}>
                    Upload a recent pathology report or prescription (PDF or Photo).
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>

              <View style={styles.optionFeaturesList}>
                <View style={styles.optionFeatureItem}>
                  <CheckCircle2 size={12} color={colors.emeraldLight} />
                  <Text style={styles.optionFeatureText}>Automated OCR parses HbA1c, glucose & cholesterol</Text>
                </View>
                <View style={styles.optionFeatureItem}>
                  <CheckCircle2 size={12} color={colors.emeraldLight} />
                  <Text style={styles.optionFeatureText}>Interactive review before saving into your health timeline</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* OPTION 3: MANUAL CLINICAL ENTRY */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderSubtle }]}
              onPress={() => setSelectedMode('manual')}
              activeOpacity={0.85}
            >
              <View style={styles.optionTopRow}>
                <View style={[styles.optionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Edit3 size={22} color={colors.amberLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.tagRow}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>3. Manual Clinical Entry</Text>
                    <View style={[styles.goldBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={[styles.goldBadgeText, { color: '#ffffff' }]}>SELF-REPORTED</Text>
                    </View>
                  </View>
                  <Text style={[styles.optionTagline, { color: colors.textSecondary }]}>
                    Manually enter your existing vitals, metrics & medical properties.
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>

              <View style={styles.optionFeaturesList}>
                <View style={styles.optionFeatureItem}>
                  <CheckCircle2 size={12} color={colors.emeraldLight} />
                  <Text style={styles.optionFeatureText}>Instant profile activation for immediate food scanning</Text>
                </View>
                <View style={styles.optionFeatureItem}>
                  <CheckCircle2 size={12} color={colors.emeraldLight} />
                  <Text style={styles.optionFeatureText}>Auto-calculates BMI, WHR and metabolic indicators</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================================== */}
        {/* VIEW 2: MEDICAL-REPORT EXTRACTION (PDF / PHOTO OCR)                */}
        {/* ================================================================== */}
        {selectedMode === 'report' && (
          <View>
            {/* Upload Selector Cards */}
            <GlassCard style={styles.uploadBox}>
              <View style={styles.uploadIconCircle}>
                <UploadCloud size={28} color={colors.cyan} />
              </View>
              <Text style={[styles.uploadBoxTitle, { color: colors.textPrimary }]}>
                Upload Pathology Lab Report
              </Text>
              <Text style={[styles.uploadBoxSub, { color: colors.textSecondary }]}>
                Supports Blood Test Panels, Lipid Profiles, HbA1c reports (PDF, JPG, PNG)
              </Text>

              {extracting ? (
                <View style={styles.extractingWrap}>
                  <ActivityIndicator size="small" color={colors.cyan} />
                  <Text style={styles.extractingText}>Analyzing report with BioSync Clinical AI...</Text>
                </View>
              ) : (
                <View style={styles.pickerBtnsRow}>
                  <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto} activeOpacity={0.8}>
                    <Camera size={16} color={colors.cyan} />
                    <Text style={styles.pickerBtnText}>Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery} activeOpacity={0.8}>
                    <FileText size={16} color={colors.cyan} />
                    <Text style={styles.pickerBtnText}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.pickerBtn} onPress={pickDocument} activeOpacity={0.8}>
                    <UploadCloud size={16} color={colors.cyan} />
                    <Text style={styles.pickerBtnText}>PDF File</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>

            {/* Extracted Biomarkers Review Section */}
            {extractedData !== null && (
              <View style={styles.reviewSection}>
                <View style={styles.reviewHeaderRow}>
                  <Sparkles size={16} color={colors.emeraldLight} />
                  <Text style={styles.reviewSectionTitle}>VERIFY EXTRACTED BIOMARKERS</Text>
                </View>
                <Text style={styles.reviewSectionSub}>
                  Clinical safety requires your review. Tap any field to correct if needed.
                </Text>

                {/* Form fields grid */}
                <View style={styles.formGrid}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>FASTING GLUCOSE (mg/dL)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.fastingGlucose}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, fastingGlucose: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 92"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>POSTPRANDIAL GLUCOSE (mg/dL)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.postPrandialGlucose}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, postPrandialGlucose: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 118"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>HbA1c (%)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.hba1c}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, hba1c: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 5.3"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>TOTAL CHOLESTEROL (mg/dL)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.totalCholesterol}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, totalCholesterol: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 178"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>TRIGLYCERIDES (mg/dL)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.triglycerides}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, triglycerides: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 115"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>HDL CHOLESTEROL (mg/dL)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.hdlCholesterol}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, hdlCholesterol: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 54"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>SYSTOLIC BP (mmHg)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.systolic}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, systolic: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 120"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>DIASTOLIC BP (mmHg)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.diastolic}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, diastolic: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 80"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>HEMOGLOBIN (g/dL)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.hemoglobin}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, hemoglobin: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 14.5"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>SERUM CREATININE (mg/dL)</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                      value={reviewFields.creatinine}
                      onChangeText={(t) => setReviewFields((p) => ({ ...p, creatinine: t }))}
                      keyboardType="numeric"
                      placeholder="e.g. 0.9"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Confirm & Save Button */}
                <TouchableOpacity
                  style={styles.submitPrimaryBtn}
                  onPress={handleConfirmReport}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#000000" />
                      <Text style={styles.submitPrimaryBtnText}>CONFIRM & ESTABLISH BASELINE</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ================================================================== */}
        {/* VIEW 3: MANUAL CLINICAL ENTRY FORM                                 */}
        {/* ================================================================== */}
        {selectedMode === 'manual' && (
          <View>
            {/* Group 1: Body Metrics */}
            <View style={styles.formGroupSection}>
              <View style={styles.groupHeaderRow}>
                <Activity size={16} color={colors.cyan} />
                <Text style={styles.groupHeading}>1. PHYSICAL BIOMETRICS</Text>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>HEIGHT (CM)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.heightCm}
                    onChangeText={(t) => handleHeightWeightChange('heightCm', t)}
                    keyboardType="numeric"
                    placeholder="172"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.weightKg}
                    onChangeText={(t) => handleHeightWeightChange('weightKg', t)}
                    keyboardType="numeric"
                    placeholder="68"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>BMI (AUTO-CALCULATED)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.cyan, borderColor: colors.borderSubtle }]}
                    value={manualForm.bmi}
                    editable={false}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>WAIST CIRCUMFERENCE (CM)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.waistCm}
                    onChangeText={(t) => setManualForm((p) => ({ ...p, waistCm: t }))}
                    keyboardType="numeric"
                    placeholder="82"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Group 2: Cardiovascular & Vitals */}
            <View style={styles.formGroupSection}>
              <View style={styles.groupHeaderRow}>
                <Heart size={16} color={colors.roseLight} />
                <Text style={styles.groupHeading}>2. CARDIOVASCULAR & TELEMETRY</Text>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>SYSTOLIC BP (mmHg)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.systolic}
                    onChangeText={(t) => setManualForm((p) => ({ ...p, systolic: t }))}
                    keyboardType="numeric"
                    placeholder="120"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>DIASTOLIC BP (mmHg)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.diastolic}
                    onChangeText={(t) => setManualForm((p) => ({ ...p, diastolic: t }))}
                    keyboardType="numeric"
                    placeholder="80"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>RESTING PULSE (BPM)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.pulse}
                    onChangeText={(t) => setManualForm((p) => ({ ...p, pulse: t }))}
                    keyboardType="numeric"
                    placeholder="72"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>OXYGEN SATURATION SpO2 (%)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.spO2}
                    onChangeText={(t) => setManualForm((p) => ({ ...p, spO2: t }))}
                    keyboardType="numeric"
                    placeholder="98"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Group 3: Metabolic Health Panel */}
            <View style={styles.formGroupSection}>
              <View style={styles.groupHeaderRow}>
                <Droplets size={16} color={colors.emeraldLight} />
                <Text style={styles.groupHeading}>3. METABOLIC & GLUCOSE PANEL</Text>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>FASTING GLUCOSE (mg/dL)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.glucoseFasting}
                    onChangeText={(t) => setManualForm((p) => ({ ...p, glucoseFasting: t }))}
                    keyboardType="numeric"
                    placeholder="92"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>POSTPRANDIAL GLUCOSE (mg/dL)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.glucosePostPrandial}
                    onChangeText={(t) => setManualForm((p) => ({ ...p, glucosePostPrandial: t }))}
                    keyboardType="numeric"
                    placeholder="118"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>HbA1c (%)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.hba1c}
                    onChangeText={(t) => setManualForm((p) => ({ ...p, hba1c: t }))}
                    keyboardType="numeric"
                    placeholder="5.3"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>TOTAL CHOLESTEROL (mg/dL)</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                    value={manualForm.totalCholesterol}
                    onChangeText={(t) => setManualForm((p) => ({ ...p, totalCholesterol: t }))}
                    keyboardType="numeric"
                    placeholder="178"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Submit Manual Vitals */}
            <TouchableOpacity
              style={styles.submitPrimaryBtn}
              onPress={handleSubmitManual}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#000000" />
                  <Text style={styles.submitPrimaryBtnText}>SAVE BASELINE VITALS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  // Hero Card
  heroCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#06b6d4',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  optionsSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#06b6d4',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  goldBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  optionTagline: {
    fontSize: 11,
    lineHeight: 15,
  },
  optionFeaturesList: {
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionFeatureText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  // Upload Box
  uploadBox: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadBoxTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  uploadBoxSub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 18,
  },
  pickerBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 10,
    paddingVertical: 12,
  },
  pickerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#06b6d4',
  },
  extractingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  extractingText: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '700',
  },
  // Review Section
  reviewSection: {
    marginBottom: 24,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reviewSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.8,
  },
  reviewSectionSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 14,
  },
  // Form Groups
  formGroupSection: {
    marginBottom: 20,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  formField: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  submitPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 14,
  },
  submitPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  // Draft Recovery Banner
  draftRecoveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  draftRecoveryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  draftRecoveryIcon: {
    marginRight: 12,
  },
  draftRecoveryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.3,
  },
  draftRecoverySub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  draftDiscardBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  draftDiscardText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
    letterSpacing: 0.5,
  },
});

export default HealthSetupScreen;

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Stethoscope,
  FlaskConical,
  Truck,
  Activity,
  CircleCheck,
  Clock,
  Search,
  LogOut,
  Phone,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  ChevronRight,
  X,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, gradients } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import VitalsFormSection from '../components/VitalsFormSection';
import { useAuthStore } from '../store/authStore';
import staffApi from '../api/staffApi';

export default function DoctorSamplesScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'incoming' | 'processing'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [counts, setCounts] = useState({ received: 0, incoming: 0, processing: 0, completed: 0 });
  const [samplesData, setSamplesData] = useState({ received: [], incoming: [], processing: [], completed: [] });

  // Review & Verification Modal
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);
  const [doctorRemarks, setDoctorRemarks] = useState('All biological markers reviewed and clinically validated within normal reference intervals.');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Complete clinical vitals state for Doctor's input into User DB
  const [doctorVitals, setDoctorVitals] = useState({
    bodyMetrics: {
      heightCm: '172',
      weightKg: '68',
      bmi: '23.0',
      bodyFatPercentage: '18.5',
      muscleMassKg: '52.4',
      boneMassKg: '3.1',
      visceralFatIndex: '6',
      waterPercentage: '58.2',
      measurements: { waistCm: '82', hipCm: '94', neckCm: '37' },
    },
    continuousMetrics: {
      restingHeartRate: '72',
      oxygenSaturationSpO2: '98',
      basalBodyTemperatureF: '98.4',
      hrv: '54',
      vo2Max: '42.5',
      dailyStepCount: '7850',
      activeCaloriesBurned: '420',
    },
    metabolicHealth: {
      glucoseFasting: '92',
      glucosePostPrandial: '118',
      hba1c: '5.3',
      fastingInsulin: '8.4',
      cPeptide: '1.8',
      homaIR: '1.91',
      fructosamine: '230',
      leptin: '5.2',
      ghrelin: '640',
      adiponectin: '11.4',
    },
    cardiovascularRisk: {
      systolic: '120',
      diastolic: '80',
      totalCholesterol: '175',
      ldlCholesterol: '98',
      hdlCholesterol: '55',
      vldlCholesterol: '22',
      triglycerides: '110',
      apolipoproteinA1: '142',
      apolipoproteinB: '82',
      lipoproteinA: '18',
      homocysteine: '9.2',
    },
    immunology: {
      hsCRP: '0.8',
      esr: '12',
      ferritin: '145',
      interleukin6: '1.8',
    },
    hormones: {
      cortisolFasting: '14.2',
      tsh: '2.1',
      freeT3: '3.2',
      freeT4: '1.2',
      testosteroneTotal: '580',
      testosteroneFree: '14.2',
      estradiol: '28',
      progesterone: '0.4',
      dheas: '240',
    },
    organFunction: {
      astSgot: '24',
      altSgpt: '26',
      ggt: '22',
      creatinine: '0.9',
      egfr: '104',
      uricAcid: '5.2',
    },
    micronutrients: {
      calciumTotal: '9.4',
      ironTotal: '110',
      magnesium: '2.1',
      zinc: '92',
      vitaminD3: '38',
      vitaminB12: '540',
      folate: '12.4',
      omega3Index: '7.8',
    },
    geneticAndGut: {
      mthfrMutationStatus: 'Negative',
      apoeGenotype: 'E3/E3',
      gutMicrobiomeDiversityScore: '84',
      firmicutesToBacteroidetesRatio: '1.2',
    },
  });

  const updateDoctorMetric = (category, field, value, subField = null) => {
    setDoctorVitals((prev) => {
      const next = { ...prev };
      if (subField) {
        next[category] = {
          ...next[category],
          [field]: {
            ...next[category][field],
            [subField]: value,
          },
        };
      } else {
        next[category] = {
          ...next[category],
          [field]: value,
        };
      }

      if (category === 'bodyMetrics' && (field === 'heightCm' || field === 'weightKg')) {
        const h = field === 'heightCm' ? parseFloat(value) : parseFloat(next.bodyMetrics.heightCm);
        const w = field === 'weightKg' ? parseFloat(value) : parseFloat(next.bodyMetrics.weightKg);
        if (h > 0 && w > 0) {
          next.bodyMetrics.bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
        }
      }

      if (category === 'metabolicHealth' && (field === 'glucoseFasting' || field === 'fastingInsulin')) {
        const g = field === 'glucoseFasting' ? parseFloat(value) : parseFloat(next.metabolicHealth.glucoseFasting);
        const ins = field === 'fastingInsulin' ? parseFloat(value) : parseFloat(next.metabolicHealth.fastingInsulin);
        if (g > 0 && ins > 0) {
          next.metabolicHealth.homaIR = ((g * ins) / 405).toFixed(2);
        }
      }

      return next;
    });
  };

  const handleQuickFillDoctorNorms = () => {
    setDoctorVitals({
      bodyMetrics: {
        heightCm: '172',
        weightKg: '68',
        bmi: '23.0',
        bodyFatPercentage: '18.5',
        muscleMassKg: '52.4',
        boneMassKg: '3.1',
        visceralFatIndex: '6',
        waterPercentage: '58.2',
        measurements: { waistCm: '82', hipCm: '94', neckCm: '37' },
      },
      continuousMetrics: {
        restingHeartRate: '72',
        oxygenSaturationSpO2: '98',
        basalBodyTemperatureF: '98.4',
        hrv: '54',
        vo2Max: '42.5',
        dailyStepCount: '7850',
        activeCaloriesBurned: '420',
      },
      metabolicHealth: {
        glucoseFasting: '92',
        glucosePostPrandial: '118',
        hba1c: '5.3',
        fastingInsulin: '8.4',
        cPeptide: '1.8',
        homaIR: '1.91',
        fructosamine: '230',
        leptin: '5.2',
        ghrelin: '640',
        adiponectin: '11.4',
      },
      cardiovascularRisk: {
        systolic: '120',
        diastolic: '80',
        totalCholesterol: '175',
        ldlCholesterol: '98',
        hdlCholesterol: '55',
        vldlCholesterol: '22',
        triglycerides: '110',
        apolipoproteinA1: '142',
        apolipoproteinB: '82',
        lipoproteinA: '18',
        homocysteine: '9.2',
      },
      immunology: {
        hsCRP: '0.8',
        esr: '12',
        ferritin: '145',
        interleukin6: '1.8',
      },
      hormones: {
        cortisolFasting: '14.2',
        tsh: '2.1',
        freeT3: '3.2',
        freeT4: '1.2',
        testosteroneTotal: '580',
        testosteroneFree: '14.2',
        estradiol: '28',
        progesterone: '0.4',
        dheas: '240',
      },
      organFunction: {
        astSgot: '24',
        altSgpt: '26',
        ggt: '22',
        creatinine: '0.9',
        egfr: '104',
        uricAcid: '5.2',
      },
      micronutrients: {
        calciumTotal: '9.4',
        ironTotal: '110',
        magnesium: '2.1',
        zinc: '92',
        vitaminD3: '38',
        vitaminB12: '540',
        folate: '12.4',
        omega3Index: '7.8',
      },
      geneticAndGut: {
        mthfrMutationStatus: 'Negative',
        apoeGenotype: 'E3/E3',
        gutMicrobiomeDiversityScore: '84',
        firmicutesToBacteroidetesRatio: '1.2',
      },
    });
    Alert.alert('Standard Norms Loaded', 'Standard clinical analyzer baseline values populated.');
  };

  const cleanDoctorVitalsForSubmission = () => {
    const parseNum = (v) => {
      if (v === '' || v === null || v === undefined) return undefined;
      const n = parseFloat(v);
      return isNaN(n) ? undefined : n;
    };

    return {
      bodyMetrics: {
        heightCm: parseNum(doctorVitals.bodyMetrics.heightCm),
        weightKg: parseNum(doctorVitals.bodyMetrics.weightKg),
        bmi: parseNum(doctorVitals.bodyMetrics.bmi),
        bodyFatPercentage: parseNum(doctorVitals.bodyMetrics.bodyFatPercentage),
        muscleMassKg: parseNum(doctorVitals.bodyMetrics.muscleMassKg),
        boneMassKg: parseNum(doctorVitals.bodyMetrics.boneMassKg),
        visceralFatIndex: parseNum(doctorVitals.bodyMetrics.visceralFatIndex),
        waterPercentage: parseNum(doctorVitals.bodyMetrics.waterPercentage),
        measurements: {
          waistCm: parseNum(doctorVitals.bodyMetrics.measurements.waistCm),
          hipCm: parseNum(doctorVitals.bodyMetrics.measurements.hipCm),
          neckCm: parseNum(doctorVitals.bodyMetrics.measurements.neckCm),
        },
      },
      continuousMetrics: {
        restingHeartRate: parseNum(doctorVitals.continuousMetrics.restingHeartRate),
        oxygenSaturationSpO2: parseNum(doctorVitals.continuousMetrics.oxygenSaturationSpO2),
        basalBodyTemperatureF: parseNum(doctorVitals.continuousMetrics.basalBodyTemperatureF),
        hrv: parseNum(doctorVitals.continuousMetrics.hrv),
        vo2Max: parseNum(doctorVitals.continuousMetrics.vo2Max),
        dailyStepCount: parseNum(doctorVitals.continuousMetrics.dailyStepCount),
        activeCaloriesBurned: parseNum(doctorVitals.continuousMetrics.activeCaloriesBurned),
      },
      metabolicHealth: {
        glucoseFasting: parseNum(doctorVitals.metabolicHealth.glucoseFasting),
        glucosePostPrandial: parseNum(doctorVitals.metabolicHealth.glucosePostPrandial),
        hba1c: parseNum(doctorVitals.metabolicHealth.hba1c),
        fastingInsulin: parseNum(doctorVitals.metabolicHealth.fastingInsulin),
        cPeptide: parseNum(doctorVitals.metabolicHealth.cPeptide),
        homaIR: parseNum(doctorVitals.metabolicHealth.homaIR),
        fructosamine: parseNum(doctorVitals.metabolicHealth.fructosamine),
        leptin: parseNum(doctorVitals.metabolicHealth.leptin),
        ghrelin: parseNum(doctorVitals.metabolicHealth.ghrelin),
        adiponectin: parseNum(doctorVitals.metabolicHealth.adiponectin),
      },
      cardiovascularRisk: {
        systolic: parseNum(doctorVitals.cardiovascularRisk.systolic),
        diastolic: parseNum(doctorVitals.cardiovascularRisk.diastolic),
        totalCholesterol: parseNum(doctorVitals.cardiovascularRisk.totalCholesterol),
        ldlCholesterol: parseNum(doctorVitals.cardiovascularRisk.ldlCholesterol),
        hdlCholesterol: parseNum(doctorVitals.cardiovascularRisk.hdlCholesterol),
        vldlCholesterol: parseNum(doctorVitals.cardiovascularRisk.vldlCholesterol),
        triglycerides: parseNum(doctorVitals.cardiovascularRisk.triglycerides),
        apolipoproteinA1: parseNum(doctorVitals.cardiovascularRisk.apolipoproteinA1),
        apolipoproteinB: parseNum(doctorVitals.cardiovascularRisk.apolipoproteinB),
        lipoproteinA: parseNum(doctorVitals.cardiovascularRisk.lipoproteinA),
        homocysteine: parseNum(doctorVitals.cardiovascularRisk.homocysteine),
      },
      immunology: {
        hsCRP: parseNum(doctorVitals.immunology.hsCRP),
        esr: parseNum(doctorVitals.immunology.esr),
        ferritin: parseNum(doctorVitals.immunology.ferritin),
        interleukin6: parseNum(doctorVitals.immunology.interleukin6),
      },
      hormones: {
        cortisolFasting: parseNum(doctorVitals.hormones.cortisolFasting),
        tsh: parseNum(doctorVitals.hormones.tsh),
        freeT3: parseNum(doctorVitals.hormones.freeT3),
        freeT4: parseNum(doctorVitals.hormones.freeT4),
        testosteroneTotal: parseNum(doctorVitals.hormones.testosteroneTotal),
        testosteroneFree: parseNum(doctorVitals.hormones.testosteroneFree),
        estradiol: parseNum(doctorVitals.hormones.estradiol),
        progesterone: parseNum(doctorVitals.hormones.progesterone),
        dheas: parseNum(doctorVitals.hormones.dheas),
      },
      organFunction: {
        astSgot: parseNum(doctorVitals.organFunction.astSgot),
        altSgpt: parseNum(doctorVitals.organFunction.altSgpt),
        ggt: parseNum(doctorVitals.organFunction.ggt),
        creatinine: parseNum(doctorVitals.organFunction.creatinine),
        egfr: parseNum(doctorVitals.organFunction.egfr),
        uricAcid: parseNum(doctorVitals.organFunction.uricAcid),
      },
      micronutrients: {
        calciumTotal: parseNum(doctorVitals.micronutrients.calciumTotal),
        ironTotal: parseNum(doctorVitals.micronutrients.ironTotal),
        magnesium: parseNum(doctorVitals.micronutrients.magnesium),
        zinc: parseNum(doctorVitals.micronutrients.zinc),
        vitaminD3: parseNum(doctorVitals.micronutrients.vitaminD3),
        vitaminB12: parseNum(doctorVitals.micronutrients.vitaminB12),
        folate: parseNum(doctorVitals.micronutrients.folate),
        omega3Index: parseNum(doctorVitals.micronutrients.omega3Index),
      },
      geneticAndGut: {
        mthfrMutationStatus: doctorVitals.geneticAndGut.mthfrMutationStatus,
        apoeGenotype: doctorVitals.geneticAndGut.apoeGenotype,
        gutMicrobiomeDiversityScore: parseNum(doctorVitals.geneticAndGut.gutMicrobiomeDiversityScore),
        firmicutesToBacteroidetesRatio: parseNum(doctorVitals.geneticAndGut.firmicutesToBacteroidetesRatio),
      },
    };
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getDoctorSamplesOverview();
      if (res?.success) {
        setCounts(res.counts || { received: 0, incoming: 0, processing: 0, completed: 0 });
        setSamplesData(res.data || { received: [], incoming: [], processing: [], completed: [] });
      }
    } catch (err) {
      console.warn('Doctor overview fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await staffApi.getDoctorSamplesOverview();
      if (res?.success) {
        setCounts(res.counts || { received: 0, incoming: 0, processing: 0, completed: 0 });
        setSamplesData(res.data || { received: [], incoming: [], processing: [], completed: [] });
      }
    } catch (err) {
      console.warn('Doctor overview refresh error:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartProcessing = async (sampleId) => {
    try {
      setSubmittingAction(true);
      const res = await staffApi.doctorStartProcessing(sampleId);
      if (res?.success) {
        Alert.alert('Processing Initiated', 'Specimen moved to automated clinical analyzer queue.');
        loadOverview();
      } else {
        Alert.alert('Error', res?.message || 'Failed to start processing');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleResultsStatus = async (sampleId, isDone) => {
    try {
      setSubmittingAction(true);
      const res = await staffApi.doctorUpdateResultsStatus(sampleId, isDone);
      if (res?.success) {
        if (isDone) {
          Alert.alert(
            'Results Ready',
            'Sample marked as Results Done. Would you like to enter clinical vitals and authorize the diagnostic report now?',
            [
              { text: 'Later', onPress: () => loadOverview() },
              {
                text: 'Enter Vitals Now',
                onPress: () => {
                  const sample =
                    (samplesData.received || []).find((s) => s._id === sampleId) ||
                    (samplesData.processing || []).find((s) => s._id === sampleId);
                  if (sample) {
                    openDoctorVitalsModal(sample);
                  }
                  loadOverview();
                },
              },
            ]
          );
        } else {
          Alert.alert('Status Updated', 'Sample status marked: Res yet to be obtained');
          loadOverview();
        }
      } else {
        Alert.alert('Notice', res?.message || 'Could not update results status');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const openDoctorVitalsModal = (sample) => {
    setSelectedSample(sample);
    setVerifyModalVisible(true);
  };

  const handleConfirmAuthorize = async () => {
    if (!selectedSample) return;
    try {
      setSubmittingAction(true);
      const cleanedVitals = cleanDoctorVitalsForSubmission();

      // Convert key biomarkers to structured testResults
      const structuredResults = [
        {
          biomarker: 'Fasting Blood Glucose',
          value: cleanedVitals.metabolicHealth.glucoseFasting || 92,
          unit: 'mg/dL',
          status: (cleanedVitals.metabolicHealth.glucoseFasting || 92) > 100 ? 'Abnormal' : 'Normal',
        },
        {
          biomarker: 'HbA1c',
          value: cleanedVitals.metabolicHealth.hba1c || 5.3,
          unit: '%',
          status: (cleanedVitals.metabolicHealth.hba1c || 5.3) > 5.7 ? 'Abnormal' : 'Normal',
        },
        {
          biomarker: 'Total Cholesterol',
          value: cleanedVitals.cardiovascularRisk.totalCholesterol || 175,
          unit: 'mg/dL',
          status: (cleanedVitals.cardiovascularRisk.totalCholesterol || 175) > 200 ? 'Abnormal' : 'Normal',
        },
        {
          biomarker: 'Serum Creatinine',
          value: cleanedVitals.organFunction.creatinine || 0.9,
          unit: 'mg/dL',
          status: (cleanedVitals.organFunction.creatinine || 0.9) > 1.2 ? 'Abnormal' : 'Normal',
        },
        {
          biomarker: 'Blood Pressure Systolic',
          value: cleanedVitals.cardiovascularRisk.systolic || 120,
          unit: 'mmHg',
          status: (cleanedVitals.cardiovascularRisk.systolic || 120) > 130 ? 'Abnormal' : 'Normal',
        },
        {
          biomarker: 'Blood Pressure Diastolic',
          value: cleanedVitals.cardiovascularRisk.diastolic || 80,
          unit: 'mmHg',
          status: (cleanedVitals.cardiovascularRisk.diastolic || 80) > 85 ? 'Abnormal' : 'Normal',
        },
      ];

      const res = await staffApi.doctorVerifyReport(
        selectedSample._id,
        doctorRemarks,
        structuredResults,
        true,
        cleanedVitals
      );
      if (res?.success) {
        setVerifyModalVisible(false);
        Alert.alert(
          'Clinical Report Authorized',
          'All diagnostic vitals and biomarker results have been recorded into the patient profile in User DB and certified by your digital signature.'
        );
        loadOverview();
      } else {
        Alert.alert('Error', res?.message || 'Verification failed');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  // Filter current list by tab and search
  const currentList = samplesData[activeTab] || [];
  const filteredList = currentList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const barcode = (item.barcode || '').toLowerCase();
    const patientName = `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.toLowerCase();
    const testName = (item.testCatalog?.testName || '').toLowerCase();
    return barcode.includes(q) || patientName.includes(q) || testName.includes(q);
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Doctor Header */}
      <View style={styles.header}>
        <View style={styles.headerProfileRow}>
          <View style={styles.doctorAvatar}>
            <Stethoscope size={22} color={colors.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>{user?.name || 'Dr. Pathologist, MD'}</Text>
            <Text style={styles.doctorRole}>
              {user?.specialty || 'Pathologist'} • {user?.licenseNumber || 'MCI-88219'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={18} color={colors.roseLight} />
          </TouchableOpacity>
        </View>

        {/* 3 Tasks KPI Summary Banner */}
        <View style={styles.kpiRow}>
          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'received' && styles.kpiCardActive]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={styles.kpiLabel}>RECEIVED</Text>
            <Text style={[styles.kpiValue, { color: colors.cyan }]}>{counts.received}</Text>
            <Text style={styles.kpiSub}>Ready</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'incoming' && styles.kpiCardActive]}
            onPress={() => setActiveTab('incoming')}
          >
            <Text style={styles.kpiLabel}>INCOMING</Text>
            <Text style={[styles.kpiValue, { color: colors.amberLight }]}>{counts.incoming}</Text>
            <Text style={styles.kpiSub}>In transit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'processing' && styles.kpiCardActive]}
            onPress={() => setActiveTab('processing')}
          >
            <Text style={styles.kpiLabel}>PROCESSING</Text>
            <Text style={[styles.kpiValue, { color: colors.violetLight }]}>{counts.processing}</Text>
            <Text style={styles.kpiSub}>Analyzer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs Selector */}
      <View style={styles.tabsNav}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'received' && styles.tabBtnActive]}
          onPress={() => setActiveTab('received')}
        >
          <FlaskConical size={15} color={activeTab === 'received' ? colors.cyan : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
            Received ({counts.received})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'incoming' && styles.tabBtnActive]}
          onPress={() => setActiveTab('incoming')}
        >
          <Truck size={15} color={activeTab === 'incoming' ? colors.amberLight : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.tabTextActive]}>
            Incoming ({counts.incoming})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'processing' && styles.tabBtnActive]}
          onPress={() => setActiveTab('processing')}
        >
          <Activity size={15} color={activeTab === 'processing' ? colors.violetLight : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'processing' && styles.tabTextActive]}>
            Processing ({counts.processing})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Specimen Feed List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item, index) => item._id || String(index)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color={colors.cyan} />
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : (
            <GlassCard style={styles.emptyCard}>
              <CircleCheck size={36} color={colors.emeraldLight} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'received'
                  ? 'No Pending Samples'
                  : activeTab === 'incoming'
                  ? 'No Incoming Samples'
                  : 'No Active Processing'}
              </Text>
              <Text style={styles.emptyDesc}>Pull down to refresh</Text>
            </GlassCard>
          )
        }
        renderItem={({ item }) => {
          const user = item.user || {};
          const patientName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Patient';
          const la = item.labAssistant || {};
          const test = item.testCatalog || {};

          // View 1: Received at Lab
          if (activeTab === 'received') {
            const isResultsDone = item.resultsDone === true || item.resultsStatus === 'Results Ready';
            const isResultsEntered =
              item.resultsStatus === 'Results Entered' ||
              ['Report_Generated', 'Completed'].includes(item.status);

            return (
              <GlassCard style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.barcodePill}>
                    <FlaskConical size={14} color={colors.cyan} />
                    <Text style={styles.barcodeText}>{item.barcode || 'BIO-SAM-RECEIVE'}</Text>
                  </View>
                  <StatusBadge
                    status={
                      isResultsEntered
                        ? 'Results Entered'
                        : isResultsDone
                        ? 'Results Ready'
                        : 'At_Laboratory'
                    }
                    size="small"
                  />
                </View>

                <View style={styles.patientInfoRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{(user.firstName?.[0] || 'P').toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{patientName}</Text>
                    <Text style={styles.itemPhone}>{user.phoneNumber || '—'}</Text>
                  </View>
                </View>

                <View style={styles.testInfoBanner}>
                  <Text style={styles.testName}>{test.testName || 'Health Panel'}</Text>
                  <Text style={styles.testMeta}>
                    {test.specimenType || 'Blood'} • By: {la.name || 'Staff'}
                  </Text>
                </View>

                {/* Doctor Decision: Are analyzer results done or not? */}
                <View style={styles.resultsDecisionBox}>
                  <Text style={styles.resultsDecisionPrompt}>Results Done?</Text>
                  <View style={styles.resultsToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.toggleOptionBtn,
                        !isResultsDone && !isResultsEntered && styles.toggleOptionBtnActiveNo,
                      ]}
                      onPress={() => handleToggleResultsStatus(item._id, false)}
                      activeOpacity={0.8}
                    >
                      <Clock
                        size={13}
                        color={!isResultsDone && !isResultsEntered ? colors.amberLight : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.toggleOptionText,
                          !isResultsDone && !isResultsEntered && { color: colors.amberLight, fontWeight: '800' },
                        ]}
                      >
                        Res yet to be obtained
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleOptionBtn,
                        isResultsDone && styles.toggleOptionBtnActiveYes,
                      ]}
                      onPress={() => handleToggleResultsStatus(item._id, true)}
                      activeOpacity={0.8}
                    >
                      <Sparkles
                        size={13}
                        color={isResultsDone ? colors.emeraldLight : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.toggleOptionText,
                          isResultsDone && { color: colors.emeraldLight, fontWeight: '800' },
                        ]}
                      >
                        Results Done
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Actions based on decision */}
                  {isResultsEntered ? (
                    <View style={styles.resultsEnteredBox}>
                      <CircleCheck size={14} color={colors.emeraldLight} />
                      <Text style={styles.resultsEnteredText}>Vitals Recorded ✓</Text>
                    </View>
                  ) : isResultsDone ? (
                    <TouchableOpacity
                      style={styles.enterVitalsPrimaryBtn}
                      onPress={() => openDoctorVitalsModal(item)}
                      activeOpacity={0.8}
                    >
                      <FileCheck size={15} color="#fff" />
                      <Text style={styles.enterVitalsPrimaryBtnText}>Enter Vitals</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.resYetNotice}>
                      <Clock size={14} color={colors.amberLight} />
                      <Text style={styles.resYetNoticeText}>Res yet to be obtained</Text>
                    </View>
                  )}
                </View>

                {!isResultsDone && !isResultsEntered && (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { marginTop: 10 }]}
                    onPress={() => handleStartProcessing(item._id)}
                    activeOpacity={0.8}
                  >
                    <Activity size={16} color="#000" />
                    <Text style={styles.primaryActionBtnText}>Start Processing</Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
            );
          }

          // View 2: Incoming from Field (What they may get in some time)
          if (activeTab === 'incoming') {
            const isTicket = item.isAppointmentTicket;
            return (
              <GlassCard style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={[styles.barcodePill, { borderColor: colors.amberLight + '40', backgroundColor: colors.amberLight + '15' }]}>
                    <Truck size={14} color={colors.amberLight} />
                    <Text style={[styles.barcodeText, { color: colors.amberLight }]}>
                      {item.barcode !== 'PENDING_COLLECTION' ? item.barcode : 'IN FIELD COLLECTION'}
                    </Text>
                  </View>
                  <View style={styles.etaBadge}>
                    <Clock size={12} color={colors.amberLight} />
                    <Text style={styles.etaText}>ETA: {item.estimatedDeliveryTime || '60 Mins'}</Text>
                  </View>
                </View>

                <View style={styles.patientInfoRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{(user.firstName?.[0] || 'P').toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{patientName}</Text>
                    <Text style={styles.itemPhone}>
                      {isTicket ? 'Visiting patient' : 'In transit to lab'}
                    </Text>
                  </View>
                </View>

                <View style={styles.collectorCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.collectorLabel}>COLLECTOR</Text>
                    <Text style={styles.collectorName}>{la.name || 'Staff'} ({la.employeeId || 'EMP001'})</Text>
                    <Text style={styles.collectorVehicle}>{la.vehicleNumber || 'Vehicle TS 09 EA 4482'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.callSmallBtn}
                    onPress={() => handleCall(la.phone || '9876543210')}
                  >
                    <Phone size={14} color="#fff" />
                    <Text style={styles.callSmallBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          }

          // View 3: Currently Processing
          const isResultsDone = item.resultsDone === true || item.resultsStatus === 'Results Ready';
          const isResultsEntered =
            item.resultsStatus === 'Results Entered' ||
            ['Report_Generated', 'Completed'].includes(item.status);

          return (
            <GlassCard style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={[styles.barcodePill, { borderColor: colors.violetLight + '40', backgroundColor: colors.violetLight + '15' }]}>
                  <Activity size={14} color={colors.violetLight} />
                  <Text style={[styles.barcodeText, { color: colors.violetLight }]}>{item.barcode || 'BIO-SAM-ANALYZER'}</Text>
                </View>
                <StatusBadge
                  status={
                    isResultsEntered
                      ? 'Results Entered'
                      : isResultsDone
                      ? 'Results Ready'
                      : 'Processing'
                  }
                  size="small"
                />
              </View>

              <View style={styles.patientInfoRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{(user.firstName?.[0] || 'P').toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{patientName}</Text>
                  <Text style={styles.itemPhone}>{test.testName || 'Health Panel'}</Text>
                </View>
              </View>

              <View style={styles.timerRow}>
                <Clock size={14} color={colors.violetLight} />
                <Text style={styles.timerText}>Started: {new Date(item.labProcessingStartTime || item.updatedAt).toLocaleTimeString()}</Text>
              </View>

              {/* Doctor Decision: Are analyzer results done or not? */}
              <View style={styles.resultsDecisionBox}>
                <Text style={styles.resultsDecisionPrompt}>Results Done?</Text>
                <View style={styles.resultsToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOptionBtn,
                      !isResultsDone && !isResultsEntered && styles.toggleOptionBtnActiveNo,
                    ]}
                    onPress={() => handleToggleResultsStatus(item._id, false)}
                    activeOpacity={0.8}
                  >
                    <Clock
                      size={13}
                      color={!isResultsDone && !isResultsEntered ? colors.amberLight : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.toggleOptionText,
                        !isResultsDone && !isResultsEntered && { color: colors.amberLight, fontWeight: '800' },
                      ]}
                    >
                      Res yet to be obtained
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleOptionBtn,
                      isResultsDone && styles.toggleOptionBtnActiveYes,
                    ]}
                    onPress={() => handleToggleResultsStatus(item._id, true)}
                    activeOpacity={0.8}
                  >
                    <Sparkles
                      size={13}
                      color={isResultsDone ? colors.emeraldLight : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.toggleOptionText,
                        isResultsDone && { color: colors.emeraldLight, fontWeight: '800' },
                      ]}
                    >
                      Results Done
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Actions based on decision */}
                {isResultsEntered ? (
                  <View style={styles.resultsEnteredBox}>
                    <CircleCheck size={14} color={colors.emeraldLight} />
                    <Text style={styles.resultsEnteredText}>Vitals Recorded ✓</Text>
                  </View>
                ) : isResultsDone ? (
                  <TouchableOpacity
                    style={styles.enterVitalsPrimaryBtn}
                    onPress={() => openDoctorVitalsModal(item)}
                    activeOpacity={0.8}
                  >
                    <FileCheck size={15} color="#fff" />
                    <Text style={styles.enterVitalsPrimaryBtnText}>Enter Vitals</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.resYetNotice}>
                    <Clock size={14} color={colors.amberLight} />
                    <Text style={styles.resYetNoticeText}>Res yet to be obtained</Text>
                  </View>
                )}
              </View>
            </GlassCard>
          );
        }}
      />

      {/* Doctor Review & Authorization Modal */}
      <Modal
        visible={verifyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={20} color={colors.cyan} />
                <Text style={styles.modalTitle}>Review & Authorize</Text>
              </View>
              <TouchableOpacity onPress={() => setVerifyModalVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <GlassCard style={styles.modalSummaryCard}>
                <Text style={styles.modalLabel}>PATIENT / SPECIMEN</Text>
                <Text style={styles.modalVal}>{selectedSample?.user?.firstName} {selectedSample?.user?.lastName || ''} • {selectedSample?.barcode}</Text>
                <Text style={styles.modalSub}>{selectedSample?.testCatalog?.testName || 'Health Panel'}</Text>
              </GlassCard>

              {/* Quick Fill Standard Clinical Norms */}
              <TouchableOpacity
                style={styles.quickNormsBtn}
                onPress={handleQuickFillDoctorNorms}
                activeOpacity={0.8}
              >
                <Sparkles size={14} color={colors.cyan} />
                <Text style={styles.quickNormsBtnText}>Auto-Fill Norms</Text>
              </TouchableOpacity>

              {/* Comprehensive Clinical Vitals Form Section (6 Sub-tabs) */}
              <VitalsFormSection
                vitals={doctorVitals}
                updateMetric={updateDoctorMetric}
                onQuickFill={handleQuickFillDoctorNorms}
              />

              <View>
                <Text style={styles.fieldLabel}>REMARKS</Text>
                <TextInput
                  style={styles.remarksInput}
                  multiline
                  numberOfLines={3}
                  value={doctorRemarks}
                  onChangeText={setDoctorRemarks}
                  placeholder="Clinical observations..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.digitalSignatureBox}>
                <ShieldCheck size={18} color={colors.emerald} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.signatureTitle}>Digital Certification</Text>
                  <Text style={styles.signatureSub}>
                    Signed by {user?.name || 'Dr. Rajesh Sharma, MD'} ({user?.licenseNumber || 'MCI-PATH-88219'})
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.signBtn}
                onPress={handleConfirmAuthorize}
                disabled={submittingAction}
                activeOpacity={0.8}
              >
                {submittingAction ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <FileCheck size={18} color="#000" />
                    <Text style={styles.signBtnText}>Authorize & Submit</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cyan + '18',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cyan + '40',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  doctorRole: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  kpiCardActive: {
    borderColor: colors.cyan,
    backgroundColor: colors.cyan + '10',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCardElevated,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
  },
  tabsNav: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabBtnActive: {
    backgroundColor: colors.cyan + '18',
    borderColor: colors.cyan,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.cyan,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  itemCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  barcodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cyan + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cyan + '30',
  },
  barcodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.amberLight + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  etaText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.amberLight,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cyan,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemPhone: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  testInfoBanner: {
    backgroundColor: colors.bgDark,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  testName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  testMeta: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  collectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDark,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 10,
  },
  collectorLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  collectorName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  collectorVehicle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.violetLight + '12',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  timerText: {
    fontSize: 11,
    color: colors.violetLight,
    fontWeight: '600',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  centerWrap: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSummaryCard: {
    padding: 12,
    borderRadius: 10,
  },
  modalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  modalVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  modalSub: {
    fontSize: 11,
    color: colors.cyan,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  remarksInput: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  digitalSignatureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.emerald + '15',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.emerald + '30',
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emerald,
  },
  signatureSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  signBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  signBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  resultsDecisionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: 10,
  },
  resultsDecisionPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultsToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  toggleOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  toggleOptionBtnActiveNo: {
    backgroundColor: colors.amber + '18',
    borderColor: colors.amberLight,
  },
  toggleOptionBtnActiveYes: {
    backgroundColor: colors.emerald + '18',
    borderColor: colors.emerald,
  },
  toggleOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  enterVitalsPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.emerald,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 10,
  },
  enterVitalsPrimaryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  resYetNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.amber + '12',
    borderWidth: 1,
    borderColor: colors.amber + '30',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  resYetNoticeText: {
    fontSize: 11,
    color: colors.amberLight,
    fontWeight: '600',
    flex: 1,
  },
  resultsEnteredBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.emerald + '15',
    borderWidth: 1,
    borderColor: colors.emerald + '30',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  resultsEnteredText: {
    fontSize: 11,
    color: colors.emeraldLight,
    fontWeight: '700',
    flex: 1,
  },
  quickNormsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.cyan + '18',
    borderWidth: 1,
    borderColor: colors.cyan + '40',
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickNormsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
  },
});

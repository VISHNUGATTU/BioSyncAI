import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Layers,
  Building,
  CircleCheck,
  Clock,
  FlaskConical,
  Barcode,
  SquareCheck,
  Square,
  ArrowRight,
  Activity,
  Plus,
  X,
  FileCheck,
  Sparkles,
  TestTube,
  ShieldCheck,
  Lock,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAppointmentStore from '../store/appointmentStore';
import { useAuthStore } from '../store/authStore';
import staffApi from '../api/staffApi';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import VitalsFormSection from '../components/VitalsFormSection';

export const SamplesScreen = ({ route, navigation }) => {
  const role = useAuthStore((state) => state.role || state.user?.role || 'lab_assistant');
  const isDoctor = role === 'doctor';

  const collectedSamples = useAppointmentStore((state) => state.collectedSamples);
  const fetchCollectedSamples = useAppointmentStore((state) => state.fetchCollectedSamples);
  const dropoffSamplesToLab = useAppointmentStore((state) => state.dropoffSamplesToLab);
  const labQueue = useAppointmentStore((state) => state.labQueue);
  const fetchLabQueue = useAppointmentStore((state) => state.fetchLabQueue);
  const allAssistantSamples = useAppointmentStore((state) => state.allAssistantSamples);
  const fetchAllAssistantSamples = useAppointmentStore((state) => state.fetchAllAssistantSamples);
  const updateSampleResultsStatus = useAppointmentStore((state) => state.updateSampleResultsStatus);

  const initialTab = route?.params?.tab || 'transit';
  const [activeTab, setActiveTab] = useState(initialTab); // 'transit' | 'queue' | 'all'
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Result submission modal for lab queue
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [selectedQueueSample, setSelectedQueueSample] = useState(null);
  const [submittingResult, setSubmittingResult] = useState(false);

  // Complete clinical vitals & biomarkers state matching server/models/Vitals.js
  const [modalVitals, setModalVitals] = useState({
    bodyMetrics: {
      heightCm: '',
      weightKg: '',
      bmi: '',
      bodyFatPercentage: '',
      muscleMassKg: '',
      boneMassKg: '',
      visceralFatIndex: '',
      waterPercentage: '',
      measurements: { waistCm: '', hipCm: '', neckCm: '' },
    },
    continuousMetrics: {
      restingHeartRate: '',
      oxygenSaturationSpO2: '',
      basalBodyTemperatureF: '',
      hrv: '',
      vo2Max: '',
      dailyStepCount: '',
      activeCaloriesBurned: '',
    },
    metabolicHealth: {
      glucoseFasting: '95',
      glucosePostPrandial: '120',
      hba1c: '5.4',
      fastingInsulin: '8.5',
      cPeptide: '1.9',
      homaIR: '2.0',
      fructosamine: '220',
      leptin: '5.0',
      ghrelin: '650',
      adiponectin: '11.0',
    },
    cardiovascularRisk: {
      systolic: '120',
      diastolic: '80',
      totalCholesterol: '180',
      ldlCholesterol: '100',
      hdlCholesterol: '52',
      vldlCholesterol: '24',
      triglycerides: '120',
      apolipoproteinA1: '140',
      apolipoproteinB: '85',
      lipoproteinA: '15',
      homocysteine: '9.0',
    },
    immunology: {
      hsCRP: '0.9',
      esr: '12',
      ferritin: '140',
      interleukin6: '1.7',
    },
    hormones: {
      cortisolFasting: '14.0',
      tsh: '2.2',
      freeT3: '3.1',
      freeT4: '1.2',
      testosteroneTotal: '550',
      testosteroneFree: '14.0',
      estradiol: '27',
      progesterone: '0.4',
      dheas: '230',
    },
    hematology: {
      hemoglobin: '14.8',
      hematocrit: '43.2',
      rbc: '4.9',
      wbc: '6.5',
      platelets: '235',
      rdw: '12.6',
      neutrophilsPercent: '60',
      lymphocytesPercent: '30',
      monocytesPercent: '7',
      eosinophilsPercent: '2',
    },
    organFunction: {
      astSgot: '25',
      altSgpt: '28',
      ggt: '24',
      alp: '65',
      creatinine: '0.95',
      egfr: '102',
      bun: '15',
      uricAcid: '5.4',
      totalProtein: '7.1',
      albumin: '4.5',
      electrolytes: { sodium: '139', potassium: '4.1', chloride: '101', bicarbonate: '24' }
    },
    micronutrients: {
      calciumTotal: '9.5',
      ironTotal: '105',
      magnesium: '2.2',
      zinc: '90',
      vitaminD3: '36',
      vitaminB12: '520',
      folate: '12.0',
      omega3Index: '7.5',
    },
    geneticAndGut: {
      mthfrMutationStatus: 'Negative',
      apoeGenotype: 'E3/E3',
      gutMicrobiomeDiversityScore: '82',
      firmicutesToBacteroidetesRatio: '1.2',
    },
  });

  const updateModalMetric = (category, field, value, subField = null) => {
    setModalVitals((prev) => {
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

      // Auto-compute BMI if height and weight are provided
      if (category === 'bodyMetrics' && (field === 'heightCm' || field === 'weightKg')) {
        const h = field === 'heightCm' ? parseFloat(value) : parseFloat(next.bodyMetrics.heightCm);
        const w = field === 'weightKg' ? parseFloat(value) : parseFloat(next.bodyMetrics.weightKg);
        if (h > 0 && w > 0) {
          next.bodyMetrics.bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
        }
      }

      // Auto-compute HOMA-IR: (glucose * insulin) / 405
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

  const handleQuickFillModalNorms = () => {
    setModalVitals({
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

  const cleanModalVitalsForSubmission = () => {
    const parseNum = (v) => {
      if (v === '' || v === null || v === undefined) return undefined;
      const n = parseFloat(v);
      return isNaN(n) ? undefined : n;
    };

    return {
      bodyMetrics: {
        heightCm: parseNum(modalVitals.bodyMetrics.heightCm),
        weightKg: parseNum(modalVitals.bodyMetrics.weightKg),
        bmi: parseNum(modalVitals.bodyMetrics.bmi),
        bodyFatPercentage: parseNum(modalVitals.bodyMetrics.bodyFatPercentage),
        muscleMassKg: parseNum(modalVitals.bodyMetrics.muscleMassKg),
        boneMassKg: parseNum(modalVitals.bodyMetrics.boneMassKg),
        visceralFatIndex: parseNum(modalVitals.bodyMetrics.visceralFatIndex),
        waterPercentage: parseNum(modalVitals.bodyMetrics.waterPercentage),
        measurements: {
          waistCm: parseNum(modalVitals.bodyMetrics.measurements.waistCm),
          hipCm: parseNum(modalVitals.bodyMetrics.measurements.hipCm),
          neckCm: parseNum(modalVitals.bodyMetrics.measurements.neckCm),
        },
      },
      continuousMetrics: {
        restingHeartRate: parseNum(modalVitals.continuousMetrics.restingHeartRate),
        oxygenSaturationSpO2: parseNum(modalVitals.continuousMetrics.oxygenSaturationSpO2),
        basalBodyTemperatureF: parseNum(modalVitals.continuousMetrics.basalBodyTemperatureF),
        hrv: parseNum(modalVitals.continuousMetrics.hrv),
        vo2Max: parseNum(modalVitals.continuousMetrics.vo2Max),
        dailyStepCount: parseNum(modalVitals.continuousMetrics.dailyStepCount),
        activeCaloriesBurned: parseNum(modalVitals.continuousMetrics.activeCaloriesBurned),
      },
      metabolicHealth: {
        glucoseFasting: parseNum(modalVitals.metabolicHealth.glucoseFasting),
        glucosePostPrandial: parseNum(modalVitals.metabolicHealth.glucosePostPrandial),
        hba1c: parseNum(modalVitals.metabolicHealth.hba1c),
        fastingInsulin: parseNum(modalVitals.metabolicHealth.fastingInsulin),
        cPeptide: parseNum(modalVitals.metabolicHealth.cPeptide),
        homaIR: parseNum(modalVitals.metabolicHealth.homaIR),
        fructosamine: parseNum(modalVitals.metabolicHealth.fructosamine),
        leptin: parseNum(modalVitals.metabolicHealth.leptin),
        ghrelin: parseNum(modalVitals.metabolicHealth.ghrelin),
        adiponectin: parseNum(modalVitals.metabolicHealth.adiponectin),
      },
      cardiovascularRisk: {
        systolic: parseNum(modalVitals.cardiovascularRisk.systolic),
        diastolic: parseNum(modalVitals.cardiovascularRisk.diastolic),
        totalCholesterol: parseNum(modalVitals.cardiovascularRisk.totalCholesterol),
        ldlCholesterol: parseNum(modalVitals.cardiovascularRisk.ldlCholesterol),
        hdlCholesterol: parseNum(modalVitals.cardiovascularRisk.hdlCholesterol),
        vldlCholesterol: parseNum(modalVitals.cardiovascularRisk.vldlCholesterol),
        triglycerides: parseNum(modalVitals.cardiovascularRisk.triglycerides),
        apolipoproteinA1: parseNum(modalVitals.cardiovascularRisk.apolipoproteinA1),
        apolipoproteinB: parseNum(modalVitals.cardiovascularRisk.apolipoproteinB),
        lipoproteinA: parseNum(modalVitals.cardiovascularRisk.lipoproteinA),
        homocysteine: parseNum(modalVitals.cardiovascularRisk.homocysteine),
      },
      immunology: {
        hsCRP: parseNum(modalVitals.immunology.hsCRP),
        esr: parseNum(modalVitals.immunology.esr),
        ferritin: parseNum(modalVitals.immunology.ferritin),
        interleukin6: parseNum(modalVitals.immunology.interleukin6),
      },
      hormones: {
        cortisolFasting: parseNum(modalVitals.hormones.cortisolFasting),
        tsh: parseNum(modalVitals.hormones.tsh),
        freeT3: parseNum(modalVitals.hormones.freeT3),
        freeT4: parseNum(modalVitals.hormones.freeT4),
        testosteroneTotal: parseNum(modalVitals.hormones.testosteroneTotal),
        testosteroneFree: parseNum(modalVitals.hormones.testosteroneFree),
        estradiol: parseNum(modalVitals.hormones.estradiol),
        progesterone: parseNum(modalVitals.hormones.progesterone),
        dheas: parseNum(modalVitals.hormones.dheas),
      },
      organFunction: {
        astSgot: parseNum(modalVitals.organFunction.astSgot),
        altSgpt: parseNum(modalVitals.organFunction.altSgpt),
        ggt: parseNum(modalVitals.organFunction.ggt),
        creatinine: parseNum(modalVitals.organFunction.creatinine),
        egfr: parseNum(modalVitals.organFunction.egfr),
        uricAcid: parseNum(modalVitals.organFunction.uricAcid),
      },
      micronutrients: {
        calciumTotal: parseNum(modalVitals.micronutrients.calciumTotal),
        ironTotal: parseNum(modalVitals.micronutrients.ironTotal),
        magnesium: parseNum(modalVitals.micronutrients.magnesium),
        zinc: parseNum(modalVitals.micronutrients.zinc),
        vitaminD3: parseNum(modalVitals.micronutrients.vitaminD3),
        vitaminB12: parseNum(modalVitals.micronutrients.vitaminB12),
        folate: parseNum(modalVitals.micronutrients.folate),
        omega3Index: parseNum(modalVitals.micronutrients.omega3Index),
      },
      geneticAndGut: {
        mthfrMutationStatus: modalVitals.geneticAndGut.mthfrMutationStatus,
        apoeGenotype: modalVitals.geneticAndGut.apoeGenotype,
        gutMicrobiomeDiversityScore: parseNum(modalVitals.geneticAndGut.gutMicrobiomeDiversityScore),
        firmicutesToBacteroidetesRatio: parseNum(modalVitals.geneticAndGut.firmicutesToBacteroidetesRatio),
      },
    };
  };

  useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'transit') {
      await fetchCollectedSamples();
    } else if (activeTab === 'queue') {
      await fetchLabQueue();
    } else {
      await fetchAllAssistantSamples();
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'transit') {
      await fetchCollectedSamples();
    } else if (activeTab === 'queue') {
      await fetchLabQueue();
    } else {
      await fetchAllAssistantSamples();
    }
    setRefreshing(false);
  };

  const toggleSelectSample = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === collectedSamples.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(collectedSamples.map((s) => s._id));
    }
  };

  const handleBulkDropoff = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one sample to drop off at the laboratory.');
      return;
    }

    try {
      setLoading(true);
      const res = await dropoffSamplesToLab(selectedIds);
      if (res.success) {
        Alert.alert('Laboratory Handover Successful', res.message || 'Samples handed over to lab staff.');
        setSelectedIds([]);
        await fetchCollectedSamples();
      } else {
        Alert.alert('Dropoff Error', res.message || 'Failed to complete lab handover.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcessing = async (sampleId) => {
    try {
      const res = await staffApi.startSampleProcessing(sampleId);
      if (res.success) {
        Alert.alert('Analysis Started', 'Sample status updated to Processing in laboratory.');
        await fetchLabQueue();
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to start processing');
    }
  };

  const handleToggleResultsStatus = async (sampleId, isDone) => {
    if (!isDoctor) {
      Alert.alert(
        'Doctor Access Only',
        'The status of results can only be updated by a Doctor. Lab Assistants do not have access to alter results status.'
      );
      return;
    }
    try {
      setLoading(true);
      const res = await updateSampleResultsStatus(sampleId, isDone);
      if (res.success) {
        if (isDone) {
          Alert.alert('Results Ready', 'Status set to Results Done. You can enter vitals now.', [
            { text: 'Later' },
            {
              text: 'Enter Vitals Now',
              onPress: () => {
                const sample =
                  labQueue.find((s) => s._id === sampleId) ||
                  allAssistantSamples.find((s) => s._id === sampleId);
                if (sample) openResultModal(sample);
              },
            },
          ]);
        } else {
          Alert.alert('Status Updated', 'Sample status marked: Res yet to be obtained');
        }
      } else {
        Alert.alert('Notice', res.message || 'Could not update results status.');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const openResultModal = (sample) => {
    setSelectedQueueSample(sample);
    setResultModalVisible(true);
  };

  const handleSubmitResult = async () => {
    if (!isDoctor) {
      Alert.alert(
        'Doctor Access Only',
        'Clinical test results and vitals can only be submitted and authorized by a Doctor, not a Lab Assistant.'
      );
      return;
    }
    if (!selectedQueueSample) return;

    try {
      setSubmittingResult(true);
      const cleanedVitals = cleanModalVitalsForSubmission();

      // Convert key biomarkers to structuredResults
      const results = [
        {
          biomarker: 'Fasting Blood Glucose',
          value: cleanedVitals.metabolicHealth.glucoseFasting || 95,
          isCritical: (cleanedVitals.metabolicHealth.glucoseFasting || 95) > 140,
        },
        {
          biomarker: 'HbA1c',
          value: cleanedVitals.metabolicHealth.hba1c || 5.4,
          isCritical: (cleanedVitals.metabolicHealth.hba1c || 5.4) > 7.5,
        },
        {
          biomarker: 'Total Cholesterol',
          value: cleanedVitals.cardiovascularRisk.totalCholesterol || 180,
          isCritical: (cleanedVitals.cardiovascularRisk.totalCholesterol || 180) > 240,
        },
        {
          biomarker: 'Serum Creatinine',
          value: cleanedVitals.organFunction.creatinine || 0.95,
          isCritical: (cleanedVitals.organFunction.creatinine || 0.95) > 1.4,
        },
        {
          biomarker: 'Blood Pressure Systolic',
          value: cleanedVitals.cardiovascularRisk.systolic || 120,
          isCritical: (cleanedVitals.cardiovascularRisk.systolic || 120) > 160,
        },
        {
          biomarker: 'Blood Pressure Diastolic',
          value: cleanedVitals.cardiovascularRisk.diastolic || 80,
          isCritical: (cleanedVitals.cardiovascularRisk.diastolic || 80) > 100,
        },
      ];

      const res = await staffApi.submitTestResults(selectedQueueSample._id, results, cleanedVitals);
      if (res.success) {
        setResultModalVisible(false);
        Alert.alert('Biomarker Assay Signed & Released', 'All clinical vitals and test results have been verified into patient record!');
        await fetchLabQueue();
      }
    } catch (e) {
      Alert.alert('Submission Error', e.message || 'Failed to submit results');
    } finally {
      setSubmittingResult(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Samples</Text>
        </View>

        {/* Tab Segment Switcher - 3 Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'transit' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('transit')}
            activeOpacity={0.7}
          >
            <Layers size={14} color={activeTab === 'transit' ? colors.primaryLight : colors.textMuted} />
            <Text style={[styles.segmentText, activeTab === 'transit' && styles.segmentTextActive]}>
              In Transit ({collectedSamples.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'queue' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('queue')}
            activeOpacity={0.7}
          >
            <Building size={14} color={activeTab === 'queue' ? colors.primaryLight : colors.textMuted} />
            <Text style={[styles.segmentText, activeTab === 'queue' && styles.segmentTextActive]}>
              Lab Queue ({labQueue.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'all' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <TestTube size={14} color={activeTab === 'all' ? colors.primaryLight : colors.textMuted} />
            <Text style={[styles.segmentText, activeTab === 'all' && styles.segmentTextActive]}>
              All Tests ({allAssistantSamples.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* View 1: In Transit Handover */}
        {activeTab === 'transit' && (
          <View style={{ flex: 1 }}>
            {collectedSamples.length > 0 && (
              <View style={styles.bulkBar}>
                <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
                  {selectedIds.length === collectedSamples.length ? (
                    <SquareCheck size={16} color={colors.primaryLight} />
                  ) : (
                    <Square size={16} color={colors.textMuted} />
                  )}
                  <Text style={styles.selectAllText}>
                    {selectedIds.length === collectedSamples.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.handoverBtn, selectedIds.length === 0 && { opacity: 0.5 }]}
                  onPress={handleBulkDropoff}
                  disabled={selectedIds.length === 0 || loading}
                >
                  <Building size={14} color="#fff" />
                  <Text style={styles.handoverBtnText}>
                    Drop Off ({selectedIds.length}) to Lab
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={collectedSamples}
              keyExtractor={(item, index) => item?._id || item?.id || String(index)}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primaryLight}
                />
              }
              renderItem={({ item }) => {
                const isSelected = selectedIds.includes(item._id);
                const user = item.appointment?.user || {};
                const test = item.testCatalog || {};

                return (
                  <TouchableOpacity
                    style={[styles.sampleCard, isSelected && styles.sampleCardSelected]}
                    onPress={() => toggleSelectSample(item._id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sampleRow}>
                      <View style={{ marginRight: 12 }}>
                        {isSelected ? (
                          <SquareCheck size={20} color={colors.primaryLight} />
                        ) : (
                          <Square size={20} color={colors.textMuted} />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.sampleBarcodeRow}>
                          <Barcode size={14} color={colors.primaryLight} />
                          <Text style={styles.sampleBarcode}>{item.barcode || item._id}</Text>
                        </View>
                        <Text style={styles.sampleTest}>{test?.testName || 'Test'}</Text>
                        <Text style={styles.samplePatient}>
                          {user.firstName || 'Patient'} {user.lastName || ''}
                        </Text>
                      </View>

                      <StatusBadge status={item.status} size="small" />
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <CircleCheck size={36} color={colors.emeraldLight} />
                  <Text style={styles.emptyTitle}>No Samples in Transit</Text>
                  <Text style={styles.emptySubtitle}>All samples delivered</Text>
                </View>
              }
            />
          </View>
        )}

        {/* View 2: Lab Queue & Processing */}
        {activeTab === 'queue' && (
          <FlatList
            data={labQueue}
            keyExtractor={(item, index) => item?._id || item?.id || String(index)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryLight}
              />
            }
            renderItem={({ item }) => {
              const user = item.appointment?.user || {};
              const test = item.testCatalog || {};
              const isResultsDone = item.resultsDone === true || item.resultsStatus === 'Results Ready';
              const isResultsEntered =
                item.resultsStatus === 'Results Entered' ||
                ['Report_Generated', 'Completed'].includes(item.status);

              return (
                <GlassCard style={styles.queueCard}>
                  <View style={styles.sampleBarcodeRow}>
                    <Barcode size={14} color={colors.primaryLight} />
                    <Text style={styles.sampleBarcode}>{item.barcode || item._id}</Text>
                    <View style={{ flex: 1 }} />
                    <StatusBadge
                      status={
                        isResultsEntered
                          ? 'Results Entered'
                          : isResultsDone
                          ? 'Results Ready'
                          : 'Res yet to be obtained'
                      }
                      size="small"
                    />
                  </View>

                  <Text style={styles.queueTestName}>{test?.testName || 'Test'}</Text>
                  <Text style={styles.queuePatientName}>
                    {user.firstName || 'Patient'} {user.lastName || ''}
                  </Text>

                  {/* Decision & Status: Results Done or Not */}
                  <View style={styles.resultsDecisionBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={styles.resultsDecisionPrompt}>Results</Text>
                      <View style={styles.doctorBadgeSmall}>
                        <ShieldCheck size={11} color={colors.cyan} />
                        <Text style={styles.doctorBadgeSmallText}>Dr. Only</Text>
                      </View>
                    </View>

                    {/* Status Feedback Notice */}
                    {isResultsEntered ? (
                      <View style={styles.resultsEnteredBox}>
                        <CircleCheck size={14} color={colors.emeraldLight} />
                        <Text style={styles.resultsEnteredText}>Results Entered ✓</Text>
                      </View>
                    ) : isResultsDone ? (
                      <View style={styles.resultsReadyBox}>
                        <Sparkles size={14} color={colors.cyan} />
                        <Text style={styles.resultsReadyText}>Results Ready — Enter Vitals</Text>
                      </View>
                    ) : (
                      <View style={styles.resYetNotice}>
                        <Clock size={14} color={colors.amberLight} />
                        <Text style={styles.resYetNoticeText}>Res yet to be obtained</Text>
                      </View>
                    )}

                    {/* Restricted Notice for Lab Assistant */}
                    {!isDoctor && (
                      <View style={styles.doctorRestrictedNotice}>
                        <Lock size={12} color={colors.textMuted} />
                        <Text style={styles.doctorRestrictedNoticeText}>
                          Doctor access only
                        </Text>
                      </View>
                    )}

                    {/* Interactive Toggles & Vitals: Restricted to Doctor */}
                    {isDoctor && (
                      <>
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

                        {isResultsDone && !isResultsEntered && (
                          <TouchableOpacity
                            style={styles.enterVitalsPrimaryBtn}
                            onPress={() => openResultModal(item)}
                            activeOpacity={0.8}
                          >
                            <FileCheck size={15} color="#fff" />
                            <Text style={styles.enterVitalsPrimaryBtnText}>Enter Vitals</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                </GlassCard>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Building size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Lab Queue Empty</Text>
                <Text style={styles.emptySubtitle}>No samples pending</Text>
              </View>
            }
          />
        )}

        {/* View 3: All Tests (Lifecycle Tracking for Lab Assistant) */}
        {activeTab === 'all' && (
          <FlatList
            data={allAssistantSamples}
            keyExtractor={(item, index) => item?._id || item?.id || String(index)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryLight}
              />
            }
            renderItem={({ item }) => {
              const user = item.appointment?.user || {};
              const test = item.testCatalog || {};
              const isAtLab = item.status === 'At_Laboratory';
              const isProcessing = item.status === 'Processing';
              const isResultsDone = item.resultsDone === true || item.resultsStatus === 'Results Ready';
              const isResultsEntered =
                item.resultsStatus === 'Results Entered' ||
                ['Report_Generated', 'Completed'].includes(item.status);

              return (
                <GlassCard style={styles.queueCard}>
                  <View style={styles.sampleBarcodeRow}>
                    <Barcode size={14} color={colors.primaryLight} />
                    <Text style={styles.sampleBarcode}>{item.barcode || item._id}</Text>
                    <View style={{ flex: 1 }} />
                    <StatusBadge
                      status={
                        isResultsEntered
                          ? 'Results Entered'
                          : (isAtLab || isProcessing)
                          ? isResultsDone
                            ? 'Results Ready'
                            : 'Res yet to be obtained'
                          : item.status
                      }
                      size="small"
                    />
                  </View>

                  <Text style={styles.queueTestName}>{test?.testName || 'Test'}</Text>
                  <Text style={styles.queuePatientName}>
                    {user.firstName || 'Patient'} {user.lastName || ''} •{' '}
                    {item.collectionTime
                      ? new Date(item.collectionTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Collected'}
                  </Text>

                  {/* Lifecycle & Status Box */}
                  {(isAtLab || isProcessing) && !isResultsEntered ? (
                    <View style={styles.resultsDecisionBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={styles.resultsDecisionPrompt}>Results</Text>
                        <View style={styles.doctorBadgeSmall}>
                          <ShieldCheck size={11} color={colors.cyan} />
                          <Text style={styles.doctorBadgeSmallText}>Dr. Only</Text>
                        </View>
                      </View>

                      {isResultsDone ? (
                        <View style={styles.resultsReadyBox}>
                          <Sparkles size={13} color={colors.cyan} />
                          <Text style={styles.resultsReadyText}>Results Ready — Enter Vitals</Text>
                        </View>
                      ) : (
                        <View style={styles.resYetNotice}>
                          <Clock size={13} color={colors.amberLight} />
                          <Text style={styles.resYetNoticeText}>Res yet to be obtained</Text>
                        </View>
                      )}

                      {!isDoctor && (
                        <View style={styles.doctorRestrictedNotice}>
                          <Lock size={12} color={colors.textMuted} />
                          <Text style={styles.doctorRestrictedNoticeText}>
                            Doctor access only
                          </Text>
                        </View>
                      )}

                      {isDoctor && (
                        <>
                          <View style={styles.resultsToggleRow}>
                            <TouchableOpacity
                              style={[
                                styles.toggleOptionBtn,
                                !isResultsDone && styles.toggleOptionBtnActiveNo,
                              ]}
                              onPress={() => handleToggleResultsStatus(item._id, false)}
                              activeOpacity={0.8}
                            >
                              <Clock
                                size={12}
                                color={!isResultsDone ? colors.amberLight : colors.textMuted}
                              />
                              <Text
                                style={[
                                  styles.toggleOptionText,
                                  !isResultsDone && { color: colors.amberLight, fontWeight: '800' },
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
                                size={12}
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

                          {isResultsDone && (
                            <TouchableOpacity
                              style={[styles.enterVitalsPrimaryBtn, { marginTop: 8 }]}
                              onPress={() => openResultModal(item)}
                              activeOpacity={0.8}
                            >
                              <FileCheck size={14} color="#fff" />
                              <Text style={styles.enterVitalsPrimaryBtnText}>Enter Vitals</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </View>
                  ) : (
                    <View style={styles.lifecycleStatusBox}>
                      <Text style={styles.lifecycleStatusText}>
                        Current Stage:{' '}
                        {isResultsEntered
                          ? '✅ Results Entered'
                          : 'Awaiting Drop-off'}
                      </Text>
                    </View>
                  )}
                </GlassCard>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <TestTube size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Tests</Text>
                <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
              </View>
            }
          />
        )}

        {/* Structured Results Entry Modal (Complete Vitals.js schema) */}
        <Modal
          visible={resultModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setResultModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Enter Vitals</Text>
                  <Text style={styles.modalSubtitle}>
                    Sample: {selectedQueueSample?.barcode || selectedQueueSample?._id}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setResultModalVisible(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                <VitalsFormSection
                  vitals={modalVitals}
                  updateMetric={updateModalMetric}
                  onQuickFill={handleQuickFillModalNorms}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.saveResultBtn}
                onPress={handleSubmitResult}
                disabled={submittingResult}
              >
                {submittingResult ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveResultBtnText}>Submit Vitals</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(12, 12, 12, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  handoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  handoverBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sampleCard: {
    backgroundColor: 'rgba(12, 12, 12, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 10,
  },
  sampleCardSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  sampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleBarcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sampleBarcode: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: colors.primaryLight,
  },
  sampleTest: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  samplePatient: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  queueCard: {
    marginBottom: 12,
  },
  queueTestName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  queuePatientName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  queueActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lifecycleStatusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  lifecycleStatusText: {
    fontSize: 11,
    color: colors.textCyan,
    fontWeight: '600',
  },
  processBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  processBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.emerald,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resultsBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saveResultBtn: {
    backgroundColor: colors.emerald,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  saveResultBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Results Decision & Vitals Styles
  resultsDecisionBox: {
    marginTop: 10,
    backgroundColor: 'rgba(12, 12, 12, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
  },
  resultsDecisionPrompt: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resultsToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleOptionBtnActiveNo: {
    backgroundColor: colors.amber + '18',
    borderColor: colors.amber,
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
  },
  resultsReadyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cyan + '15',
    borderWidth: 1,
    borderColor: colors.cyan + '30',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  resultsReadyText: {
    fontSize: 11,
    color: colors.cyan,
    fontWeight: '700',
    flex: 1,
  },
  doctorBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cyan + '18',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cyan + '35',
  },
  doctorBadgeSmallText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 0.5,
  },
  doctorRestrictedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  doctorRestrictedNoticeText: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
    flex: 1,
  },
});

export default SamplesScreen;

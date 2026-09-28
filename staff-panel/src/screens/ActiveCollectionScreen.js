import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  KeyRound,
  HeartPulse,
  Activity,
  Thermometer,
  Stethoscope,
  Camera,
  Barcode,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  SquareCheck,
  Square,
  FlaskConical,
  AlertCircle,
  Sparkles,
  CircleCheck,
  Clock,
  ChevronRight,
  Headset,
  Building,
  ClipboardList,
  Edit3,
  FileCheck,
  TestTube,
  X,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import useAppointmentStore from '../store/appointmentStore';
import useAuthStore from '../store/authStore';
import staffApi from '../api/staffApi';
import GlassCard from '../components/GlassCard';
import PatientBaselineModal from '../components/PatientBaselineModal';
import OpsHelplineModal from '../components/OpsHelplineModal';
import VitalsFormSection from '../components/VitalsFormSection';

export const ActiveCollectionScreen = ({ route, navigation }) => {
  const { appointment } = route.params || {};
  const { collectSampleAndCOD, dropoffSamplesToLab } = useAppointmentStore();
  const role = useAuthStore((state) => state.role || state.user?.role || 'lab_assistant');
  const isDoctor = role === 'doctor';

  const user = appointment?.user || {};
  const patientName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Patient';

  // Wizard Step State (1: OTP -> 2: Questions & Vitals -> 3: Specimens -> 4: Payment -> 5: Sealed/Lab)
  const isAlreadyCollecting = appointment?.status === 'Collecting';
  const [currentStep, setCurrentStep] = useState(isAlreadyCollecting ? 2 : 1);
  const [loading, setLoading] = useState(false);

  // STEP 1: OTP State
  const [otpCode, setOtpCode] = useState(appointment?.collectionOTP || '');
  const [otpVerified, setOtpVerified] = useState(isAlreadyCollecting);

  // STEP 2: Observational Physical Vitals & Medical Properties (For AI Prediction)
  const [intakeVitals, setIntakeVitals] = useState({
    systolic: '120',
    diastolic: '80',
    pulse: '72',
    spO2: '98',
    temperatureF: '98.4',
    heightCm: '172',
    weightKg: '68',
    bmi: '23.0',
    waistCm: '82',
  });

  const [medicalHistory, setMedicalHistory] = useState({
    chronicConditions: ['None'],
    currentMedications: 'None',
    knownAllergies: 'None',
    familyHistory: ['None'],
  });

  const [lifestyle, setLifestyle] = useState({
    fastingObserved: true,
    fastingDurationHours: '10',
    dietPreference: 'Non-Veg',
    smokingHabit: 'Non-smoker',
    alcoholConsumption: 'None',
    sleepHours: '7.5',
    activityLevel: 'Light Activity',
    stressLevel: 'Low',
    bleedingDisorderHistory: false,
    faintingHistory: false,
    activeSymptoms: 'Asymptomatic / None',
    phlebotomistNotes: '',
  });

  // STEP 3: Tri-Specimen Collection State (Blood, Urine, Stool)
  const primaryKitBarcode = `BIO-KIT-${Math.floor(100000 + Math.random() * 900000)}`;
  const [specimens, setSpecimens] = useState({
    blood: {
      collected: true,
      barcode: `${primaryKitBarcode}-BLD`,
      photoUri: null,
      manualMode: false,
      tubesFilled: true,
    },
    urine: {
      collected: true,
      barcode: `${primaryKitBarcode}-URN`,
      photoUri: null,
      manualMode: false,
    },
    stool: {
      collected: true,
      barcode: `${primaryKitBarcode}-STL`,
      photoUri: null,
      manualMode: false,
    },
    coldStorageConfirmed: true,
  });

  // STEP 4: Payment State
  const billAmount = appointment?.totalPrice || appointment?.billingAmount || 499;
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'UPI' | 'Online'
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(true);

  // STEP 5: Finalized Sample State
  const [createdSampleId, setCreatedSampleId] = useState(null);

  // STEP 5 Post-Dropoff State: Results Done or Not
  const [isDroppedAtLab, setIsDroppedAtLab] = useState(
    ['At_Laboratory', 'Processing', 'Report_Generated', 'Completed'].includes(appointment?.status)
  );
  const [resultsDoneOption, setResultsDoneOption] = useState('no'); // 'no' | 'yes'
  const [vitalsModalVisible, setVitalsModalVisible] = useState(false);
  const [submittingVitals, setSubmittingVitals] = useState(false);
  const [vitalsSubmitted, setVitalsSubmitted] = useState(
    ['Report_Generated', 'Completed'].includes(appointment?.status)
  );

  // Central Laboratory Analyzer Vitals Schema (Complete Vitals.js schema)
  const [modalVitals, setModalVitals] = useState({
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
      adiponectin: '11.5',
    },
    cardiovascularRisk: {
      systolic: '120',
      diastolic: '80',
      totalCholesterol: '178',
      ldlCholesterol: '98',
      hdlCholesterol: '54',
      vldlCholesterol: '22',
      triglycerides: '115',
      apolipoproteinA1: '142',
      apolipoproteinB: '82',
      lipoproteinA: '14',
      homocysteine: '8.8',
    },
    immunology: {
      hsCRP: '0.8',
      esr: '10',
      ferritin: '135',
      interleukin6: '1.6',
    },
    hormones: {
      cortisolFasting: '13.5',
      tsh: '2.1',
      freeT3: '3.2',
      freeT4: '1.25',
      testosteroneTotal: '560',
      testosteroneFree: '14.5',
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
      return next;
    });
  };

  const handleQuickFillModalNorms = () => {
    setModalVitals({
      bodyMetrics: {
        heightCm: intakeVitals.heightCm || '172',
        weightKg: intakeVitals.weightKg || '68',
        bmi: intakeVitals.bmi || '23.0',
        bodyFatPercentage: '18.5',
        muscleMassKg: '52.4',
        boneMassKg: '3.1',
        visceralFatIndex: '6',
        waterPercentage: '58.2',
        measurements: { waistCm: intakeVitals.waistCm || '82', hipCm: '94', neckCm: '37' },
      },
      continuousMetrics: {
        restingHeartRate: intakeVitals.pulse || '72',
        oxygenSaturationSpO2: intakeVitals.spO2 || '98',
        basalBodyTemperatureF: intakeVitals.temperatureF || '98.4',
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
        adiponectin: '11.5',
      },
      cardiovascularRisk: {
        systolic: intakeVitals.systolic || '120',
        diastolic: intakeVitals.diastolic || '80',
        totalCholesterol: '178',
        ldlCholesterol: '98',
        hdlCholesterol: '54',
        vldlCholesterol: '22',
        triglycerides: '115',
        apolipoproteinA1: '142',
        apolipoproteinB: '82',
        lipoproteinA: '14',
        homocysteine: '8.8',
      },
      immunology: {
        hsCRP: '0.8',
        esr: '10',
        ferritin: '135',
        interleukin6: '1.6',
      },
      hormones: {
        cortisolFasting: '13.5',
        tsh: '2.1',
        freeT3: '3.2',
        freeT4: '1.25',
        testosteroneTotal: '560',
        testosteroneFree: '14.5',
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

  // Modals
  const [baselineModalVisible, setBaselineModalVisible] = useState(false);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [baselineData, setBaselineData] = useState(null);
  const [helplineModalVisible, setHelplineModalVisible] = useState(false);

  // Helper: Auto-Compute BMI
  const handleVitalChange = (field, value) => {
    setIntakeVitals((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'heightCm' || field === 'weightKg') {
        const h = field === 'heightCm' ? parseFloat(value) : parseFloat(next.heightCm);
        const w = field === 'weightKg' ? parseFloat(value) : parseFloat(next.weightKg);
        if (h > 0 && w > 0) {
          next.bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
        }
      }
      return next;
    });
  };

  const handleQuickFillNorms = () => {
    setIntakeVitals({
      systolic: '120',
      diastolic: '80',
      pulse: '72',
      spO2: '98',
      temperatureF: '98.4',
      heightCm: '172',
      weightKg: '68',
      bmi: '23.0',
      waistCm: '82',
    });
    setMedicalHistory({
      chronicConditions: ['None'],
      currentMedications: 'None',
      knownAllergies: 'None',
      familyHistory: ['None'],
    });
    setLifestyle({
      fastingObserved: true,
      fastingDurationHours: '10',
      dietPreference: 'Non-Veg',
      smokingHabit: 'Non-smoker',
      alcoholConsumption: 'None',
      sleepHours: '7.5',
      activityLevel: 'Moderate Active',
      stressLevel: 'Low',
      bleedingDisorderHistory: false,
      faintingHistory: false,
      activeSymptoms: 'Asymptomatic / None',
      phlebotomistNotes: 'Patient well-hydrated, veins easily palpated, good compliance.',
    });
    Alert.alert('Baseline Loaded', 'Standard observational patient health baseline populated.');
  };

  const toggleCondition = (condition) => {
    setMedicalHistory((prev) => {
      let list = [...prev.chronicConditions];
      if (condition === 'None') return { ...prev, chronicConditions: ['None'] };
      list = list.filter((c) => c !== 'None');
      if (list.includes(condition)) {
        list = list.filter((c) => c !== condition);
        if (list.length === 0) list = ['None'];
      } else {
        list.push(condition);
      }
      return { ...prev, chronicConditions: list };
    });
  };

  const toggleFamilyHistory = (item) => {
    setMedicalHistory((prev) => {
      let list = [...prev.familyHistory];
      if (item === 'None') return { ...prev, familyHistory: ['None'] };
      list = list.filter((c) => c !== 'None');
      if (list.includes(item)) {
        list = list.filter((c) => c !== item);
        if (list.length === 0) list = ['None'];
      } else {
        list.push(item);
      }
      return { ...prev, familyHistory: list };
    });
  };

  // Step 1: Verify OTP Action
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit Collection OTP provided by the patient.');
      return;
    }

    try {
      setLoading(true);
      const res = await staffApi.updateAppointmentStatus(appointment._id, 'Collecting', otpCode.trim());
      if (res.success) {
        setOtpVerified(true);
        Alert.alert('OTP Verified', 'Patient identity confirmed! Proceed to Clinical Health Assessment.', [
          { text: 'Continue', onPress: () => setCurrentStep(2) },
        ]);
      } else {
        Alert.alert('Verification Failed', res.message || 'Incorrect OTP code.');
      }
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.message || err.message || 'Incorrect OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Specimen Camera Photo Capture (Photo First)
  const handleCaptureSpecimenPhoto = async (specimenType) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission Required', 'Camera access is needed to photograph the barcode label. You can also enter it manually.', [
          { text: 'Enter Manually', onPress: () => toggleSpecimenManual(specimenType, true) },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSpecimens((prev) => ({
          ...prev,
          [specimenType]: {
            ...prev[specimenType],
            photoUri: uri,
            collected: true,
          },
        }));
      } else {
        Alert.alert('Camera Capture Canceled', 'If barcode photo cannot be taken, you can switch to manual entry.', [
          { text: 'Enter Manually', onPress: () => toggleSpecimenManual(specimenType, true) },
          { text: 'OK' },
        ]);
      }
    } catch (err) {
      console.warn('Camera error fallback:', err);
      toggleSpecimenManual(specimenType, true);
    }
  };

  const toggleSpecimenManual = (specimenType, val) => {
    setSpecimens((prev) => ({
      ...prev,
      [specimenType]: {
        ...prev[specimenType],
        manualMode: val !== undefined ? val : !prev[specimenType].manualMode,
      },
    }));
  };

  // Step 4: Finalize Collection & Submit to Backend
  const handleFinalizeCollection = async () => {
    if (!isPaymentConfirmed) {
      Alert.alert('Payment Unconfirmed', 'Please confirm that payment has been collected from the patient.');
      return;
    }

    try {
      setLoading(true);

      const clinicalIntake = {
        vitals: intakeVitals,
        medicalHistory,
        lifestyle,
        preScreening: {
          fastingObserved: lifestyle.fastingObserved,
          fastingDurationHours: Number(lifestyle.fastingDurationHours) || 10,
          morningMedicationsTaken: lifestyle.morningMedicationsTaken || 'None',
          bleedingDisorderHistory: lifestyle.bleedingDisorderHistory,
          faintingHistory: lifestyle.faintingHistory,
          activeSymptoms: lifestyle.activeSymptoms,
          phlebotomistObservations: lifestyle.phlebotomistNotes,
        },
      };

      const specimenBarcodes = {
        blood: specimens.blood.barcode,
        urine: specimens.urine.barcode,
        stool: specimens.stool.barcode,
      };

      const paymentDetails = {
        isPaid: isPaymentConfirmed,
        amount: Number(billAmount) || 499,
        method: paymentMode,
      };

      const payload = {
        barcode: specimens.blood.barcode,
        specimenBarcodes,
        clinicalIntake,
        questionnaire: clinicalIntake.preScreening,
        vitals: intakeVitals,
        paymentDetails,
      };

      const res = await collectSampleAndCOD(appointment._id, payload);

      if (res.success) {
        const sampleId = res.sample?._id;
        setCreatedSampleId(sampleId);

        // Upload blood vial evidence photo if available
        if (specimens.blood.photoUri && sampleId) {
          try {
            await staffApi.uploadCollectionEvidence(sampleId, specimens.blood.photoUri);
          } catch (e) {
            console.warn('Evidence photo upload warning:', e.message);
          }
        }

        // Advance to Step 5: Sealed & Laboratory Drop-off Screen
        setCurrentStep(5);
      } else {
        Alert.alert('Collection Error', res.message || 'Failed to complete sample collection.');
      }
    } catch (err) {
      Alert.alert('Collection Error', err.response?.data?.message || err.message || 'Failed to complete sample collection.');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Laboratory Drop-off Action (Step 7: Kept at lab)
  const handleDropoffAtLab = async () => {
    try {
      setLoading(true);
      const sampleIdToDrop = createdSampleId || appointment?._id;
      if (sampleIdToDrop) {
        await dropoffSamplesToLab([sampleIdToDrop]);
      }
      setIsDroppedAtLab(true);
      setResultsDoneOption('no');
      Alert.alert(
        'Handover Completed',
        'Specimens officially logged at Central Laboratory intake.\n\nPlease declare below whether analyzer results are done or yet to be obtained.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      setIsDroppedAtLab(true);
      Alert.alert('Notice', 'Sample recorded as dropped at laboratory.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResultsDoneOption = async (option) => {
    setResultsDoneOption(option);
    const sampleId = createdSampleId || appointment?._id;
    if (sampleId) {
      try {
        await staffApi.updateSampleResultsStatus(sampleId, option === 'yes');
      } catch (e) {
        console.warn('Results status sync warning:', e.message);
      }
    }
  };

  const handlePostVitalsToUserDb = async () => {
    try {
      setSubmittingVitals(true);
      const targetSampleId = createdSampleId || appointment?._id;

      const parseNum = (v) => {
        if (v === '' || v === null || v === undefined) return undefined;
        const n = parseFloat(v);
        return isNaN(n) ? undefined : n;
      };

      const cleanedVitals = {
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

      const res = await staffApi.submitTestResults(targetSampleId, [], cleanedVitals);
      if (res.success) {
        setVitalsModalVisible(false);
        setVitalsSubmitted(true);
        Alert.alert(
          'Vitals Posted to User DB',
          'Analyzer vitals recorded and verified into the user database. AI predictions calibrated successfully!'
        );
      } else {
        Alert.alert('Submission Failed', res.message || 'Could not post vitals to DB.');
      }
    } catch (e) {
      Alert.alert('Submission Error', e.response?.data?.message || e.message || 'Failed to submit vitals');
    } finally {
      setSubmittingVitals(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (currentStep > 1 && currentStep < 5) {
              setCurrentStep((s) => s - 1);
            } else {
              navigation.goBack();
            }
          }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.navStepLabel}>
            {currentStep === 1 && 'STEP 1 OF 5: PATIENT OTP'}
            {currentStep === 2 && 'STEP 2 OF 5: CLINICAL INTAKE'}
            {currentStep === 3 && 'STEP 3 OF 5: SPECIMENS (3)'}
            {currentStep === 4 && 'STEP 4 OF 5: PAYMENT'}
            {currentStep === 5 && 'STEP 5 OF 5: SEALED & LAB'}
          </Text>
          <Text style={styles.navTitle}>Field Collection Wizard</Text>
        </View>

        <TouchableOpacity
          style={styles.helplineBtn}
          onPress={() => setHelplineModalVisible(true)}
        >
          <Headset size={18} color={colors.roseLight} />
        </TouchableOpacity>
      </View>

      {/* Stacked Step Progress Indicator Bar */}
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View
            key={s}
            style={[
              styles.stepBar,
              s < currentStep && styles.stepBarDone,
              s === currentStep && styles.stepBarActive,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ============================================================== */}
        {/* STEP 1: PATIENT OTP VERIFICATION                               */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <View>
            {/* Patient Header Card */}
            <GlassCard style={styles.card}>
              <View style={styles.patientRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(user.firstName?.[0] || 'P').toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{patientName}</Text>
                  <Text style={styles.phoneText}>{user.phoneNumber || user.phone || 'Phone on file'}</Text>
                  <Text style={styles.timeSlotText}>Scheduled Slot: {appointment?.timeSlot || '09:00 AM'}</Text>
                </View>
              </View>

              <View style={styles.testPackageBanner}>
                <FlaskConical size={16} color={colors.cyan} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.testPackageTitle}>BioSync 360 Full Biomarker Diagnostic</Text>
                  <Text style={styles.testPackageSubtitle}>
                    1 Unified Protocol: Clinical Intake + Blood Draw + Urine + Stool Collection
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* OTP Entry Card */}
            <GlassCard style={styles.card}>
              <View style={styles.sectionHeader}>
                <KeyRound size={20} color={colors.violetLight} />
                <Text style={styles.sectionTitle}>Verify Patient Collection OTP</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Ask {patientName} for the 4-digit Collection OTP shown on their patient app or SMS. Collection cannot begin without verification.
              </Text>

              <View style={styles.otpInputBox}>
                <TextInput
                  style={styles.otpTextInput}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="• • • •"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus={true}
                />
              </View>

              {appointment?.collectionOTP && (
                <TouchableOpacity
                  style={styles.autoFillOtpBtn}
                  onPress={() => setOtpCode(appointment.collectionOTP)}
                >
                  <Text style={styles.autoFillOtpText}>Auto-Fill System Code: {appointment.collectionOTP}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.primaryActionBtn, loading && { opacity: 0.7 }]}
                onPress={handleVerifyOTP}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <ShieldCheck size={18} color="#fff" />
                    <Text style={styles.primaryActionBtnText}>Verify OTP & Unlock Service</Text>
                    <ChevronRight size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {/* ============================================================== */}
        {/* STEP 2: CLINICAL INTAKE & MEDICAL PROPERTIES QUESTIONNAIRE      */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <View>
            <View style={styles.stepBanner}>
              <ClipboardList size={20} color={colors.cyan} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stepBannerTitle}>Step 2: Patient Health Intake & Medical Properties</Text>
                <Text style={styles.stepBannerSubtitle}>
                  Measure observational vitals and record user medical properties for AI prediction models.
                </Text>
              </View>
              <TouchableOpacity style={styles.quickFillBtn} onPress={handleQuickFillNorms}>
                <Sparkles size={14} color="#fff" />
                <Text style={styles.quickFillBtnText}>Demo Norms</Text>
              </TouchableOpacity>
            </View>

            {/* 1. Measured Physical Vitals */}
            <GlassCard style={styles.card}>
              <View style={styles.sectionHeader}>
                <Stethoscope size={18} color={colors.cyan} />
                <Text style={styles.sectionTitle}>1. Measured Physical Vitals (On-Site)</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Measured directly by phlebotomist using blood pressure cuff, pulse oximeter, and tape.
              </Text>

              <View style={styles.vitalGrid}>
                {/* BP Systolic */}
                <View style={styles.vitalInputCol}>
                  <Text style={styles.vitalLabel}>BP Systolic</Text>
                  <View style={styles.vitalFieldWrap}>
                    <TextInput
                      style={styles.vitalInput}
                      value={intakeVitals.systolic}
                      onChangeText={(v) => handleVitalChange('systolic', v)}
                      keyboardType="numeric"
                      placeholder="120"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.vitalUnit}>mmHg</Text>
                  </View>
                </View>

                {/* BP Diastolic */}
                <View style={styles.vitalInputCol}>
                  <Text style={styles.vitalLabel}>BP Diastolic</Text>
                  <View style={styles.vitalFieldWrap}>
                    <TextInput
                      style={styles.vitalInput}
                      value={intakeVitals.diastolic}
                      onChangeText={(v) => handleVitalChange('diastolic', v)}
                      keyboardType="numeric"
                      placeholder="80"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.vitalUnit}>mmHg</Text>
                  </View>
                </View>

                {/* Pulse */}
                <View style={styles.vitalInputCol}>
                  <Text style={styles.vitalLabel}>Heart Rate</Text>
                  <View style={styles.vitalFieldWrap}>
                    <TextInput
                      style={styles.vitalInput}
                      value={intakeVitals.pulse}
                      onChangeText={(v) => handleVitalChange('pulse', v)}
                      keyboardType="numeric"
                      placeholder="72"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.vitalUnit}>bpm</Text>
                  </View>
                </View>

                {/* SpO2 */}
                <View style={styles.vitalInputCol}>
                  <Text style={styles.vitalLabel}>SpO2</Text>
                  <View style={styles.vitalFieldWrap}>
                    <TextInput
                      style={styles.vitalInput}
                      value={intakeVitals.spO2}
                      onChangeText={(v) => handleVitalChange('spO2', v)}
                      keyboardType="numeric"
                      placeholder="98"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.vitalUnit}>%</Text>
                  </View>
                </View>

                {/* Temperature */}
                <View style={styles.vitalInputCol}>
                  <Text style={styles.vitalLabel}>Temperature</Text>
                  <View style={styles.vitalFieldWrap}>
                    <TextInput
                      style={styles.vitalInput}
                      value={intakeVitals.temperatureF}
                      onChangeText={(v) => handleVitalChange('temperatureF', v)}
                      keyboardType="numeric"
                      placeholder="98.4"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.vitalUnit}>°F</Text>
                  </View>
                </View>

                {/* Height */}
                <View style={styles.vitalInputCol}>
                  <Text style={styles.vitalLabel}>Height</Text>
                  <View style={styles.vitalFieldWrap}>
                    <TextInput
                      style={styles.vitalInput}
                      value={intakeVitals.heightCm}
                      onChangeText={(v) => handleVitalChange('heightCm', v)}
                      keyboardType="numeric"
                      placeholder="172"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.vitalUnit}>cm</Text>
                  </View>
                </View>

                {/* Weight */}
                <View style={styles.vitalInputCol}>
                  <Text style={styles.vitalLabel}>Weight</Text>
                  <View style={styles.vitalFieldWrap}>
                    <TextInput
                      style={styles.vitalInput}
                      value={intakeVitals.weightKg}
                      onChangeText={(v) => handleVitalChange('weightKg', v)}
                      keyboardType="numeric"
                      placeholder="68"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.vitalUnit}>kg</Text>
                  </View>
                </View>

                {/* Waist */}
                <View style={styles.vitalInputCol}>
                  <Text style={styles.vitalLabel}>Waist</Text>
                  <View style={styles.vitalFieldWrap}>
                    <TextInput
                      style={styles.vitalInput}
                      value={intakeVitals.waistCm}
                      onChangeText={(v) => handleVitalChange('waistCm', v)}
                      keyboardType="numeric"
                      placeholder="82"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.vitalUnit}>cm</Text>
                  </View>
                </View>
              </View>

              {/* BMI Auto Banner */}
              <View style={styles.bmiBanner}>
                <Text style={styles.bmiBannerLabel}>Calculated Body Mass Index (BMI):</Text>
                <Text style={styles.bmiBannerValue}>{intakeVitals.bmi || '23.0'} kg/m² (Normal)</Text>
              </View>
            </GlassCard>

            {/* 2. Medical & Chronic History */}
            <GlassCard style={styles.card}>
              <View style={styles.sectionHeader}>
                <ShieldCheck size={18} color={colors.emeraldLight} />
                <Text style={styles.sectionTitle}>2. Medical History & Chronic Conditions</Text>
              </View>

              <Text style={styles.fieldSectionLabel}>Select Existing Chronic Conditions:</Text>
              <View style={styles.chipsContainer}>
                {[
                  'None',
                  'Hypertension',
                  'Type 2 Diabetes',
                  'Thyroid Disorder',
                  'Asthma / Bronchial',
                  'Heart Disease / CAD',
                  'Kidney Disease',
                  'Fatty Liver',
                ].map((item) => {
                  const isSelected = medicalHistory.chronicConditions.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => toggleCondition(item)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldSectionLabel, { marginTop: 12 }]}>Current Daily Medications:</Text>
              <TextInput
                style={styles.standardTextInput}
                value={medicalHistory.currentMedications}
                onChangeText={(v) => setMedicalHistory((p) => ({ ...p, currentMedications: v }))}
                placeholder="e.g. None, or Thyronorm 50mcg, Telmisartan 40mg..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.fieldSectionLabel, { marginTop: 12 }]}>Known Drug / Food Allergies:</Text>
              <TextInput
                style={styles.standardTextInput}
                value={medicalHistory.knownAllergies}
                onChangeText={(v) => setMedicalHistory((p) => ({ ...p, knownAllergies: v }))}
                placeholder="e.g. None, or Penicillin, Sulfa, Peanuts..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.fieldSectionLabel, { marginTop: 12 }]}>Family History of Major Diseases:</Text>
              <View style={styles.chipsContainer}>
                {['None', 'Diabetes', 'Early Heart Disease', 'Stroke', 'Hypertension', 'Cancer'].map((item) => {
                  const isSelected = medicalHistory.familyHistory.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => toggleFamilyHistory(item)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassCard>

            {/* 3. Lifestyle & Pre-Collection Screening */}
            <GlassCard style={styles.card}>
              <View style={styles.sectionHeader}>
                <Activity size={18} color={colors.amberLight} />
                <Text style={styles.sectionTitle}>3. Lifestyle & Pre-Collection Screening</Text>
              </View>

              {/* Fasting */}
              <View style={styles.questionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questionText}>Overnight Fasting Confirmed?</Text>
                  <Text style={styles.questionHint}>10-12 hours without caloric intake</Text>
                </View>
                <View style={styles.pillChoiceGroup}>
                  <TouchableOpacity
                    style={[styles.pillBtn, lifestyle.fastingObserved && styles.pillBtnActive]}
                    onPress={() => setLifestyle((p) => ({ ...p, fastingObserved: true }))}
                  >
                    <Text style={[styles.pillText, lifestyle.fastingObserved && styles.pillTextActive]}>YES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pillBtn, !lifestyle.fastingObserved && styles.pillBtnActiveDanger]}
                    onPress={() => setLifestyle((p) => ({ ...p, fastingObserved: false }))}
                  >
                    <Text style={[styles.pillText, !lifestyle.fastingObserved && styles.pillTextActiveDanger]}>NO</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Diet */}
              <Text style={[styles.fieldSectionLabel, { marginTop: 10 }]}>Dietary Pattern:</Text>
              <View style={styles.chipsContainer}>
                {['Vegetarian', 'Non-Veg', 'Vegan', 'Keto', 'Eggetarian'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, lifestyle.dietPreference === item && styles.chipActive]}
                    onPress={() => setLifestyle((p) => ({ ...p, dietPreference: item }))}
                  >
                    <Text style={[styles.chipText, lifestyle.dietPreference === item && styles.chipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Smoking & Alcohol */}
              <Text style={[styles.fieldSectionLabel, { marginTop: 10 }]}>Smoking Habit:</Text>
              <View style={styles.chipsContainer}>
                {['Non-smoker', 'Occasional', 'Regular'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, lifestyle.smokingHabit === item && styles.chipActive]}
                    onPress={() => setLifestyle((p) => ({ ...p, smokingHabit: item }))}
                  >
                    <Text style={[styles.chipText, lifestyle.smokingHabit === item && styles.chipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Daily Activity Level */}
              <Text style={[styles.fieldSectionLabel, { marginTop: 10 }]}>Daily Physical Activity Level:</Text>
              <View style={styles.chipsContainer}>
                {['Sedentary', 'Light Activity', 'Moderate Active', 'High Fitness'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, lifestyle.activityLevel === item && styles.chipActive]}
                    onPress={() => setLifestyle((p) => ({ ...p, activityLevel: item }))}
                  >
                    <Text style={[styles.chipText, lifestyle.activityLevel === item && styles.chipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Active Symptoms */}
              <Text style={[styles.fieldSectionLabel, { marginTop: 10 }]}>Active Symptoms / Complaints Today:</Text>
              <TextInput
                style={styles.standardTextInput}
                value={lifestyle.activeSymptoms}
                onChangeText={(v) => setLifestyle((p) => ({ ...p, activeSymptoms: v }))}
                placeholder="e.g. Asymptomatic / None, or Mild headache, fatigue..."
                placeholderTextColor={colors.textMuted}
              />
            </GlassCard>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => setCurrentStep(3)}
              activeOpacity={0.8}
            >
              <CircleCheck size={18} color="#fff" />
              <Text style={styles.primaryActionBtnText}>Save Intake & Next: Collect Specimens (Step 3)</Text>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* STEP 3: TRI-SPECIMEN COLLECTION (BLOOD, URINE, STOOL)          */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <View>
            <View style={styles.stepBanner}>
              <FlaskConical size={20} color={colors.cyan} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stepBannerTitle}>Step 3: Tri-Specimen Barcoding & Collection</Text>
                <Text style={styles.stepBannerSubtitle}>
                  Collect Venous Blood, Urine, and Stool specimens. Photograph each barcode label first.
                </Text>
              </View>
            </View>

            {/* Specimen 1: Venous Blood Draw */}
            <GlassCard style={styles.card}>
              <View style={styles.specimenHeaderRow}>
                <View style={[styles.specimenBadgeIcon, { backgroundColor: colors.rose + '20' }]}>
                  <Text style={styles.specimenBadgeEmoji}>🩸</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.specimenName}>1. Venous Blood Draw (3 Tubes)</Text>
                  <Text style={styles.specimenDetails}>
                    EDTA Lavender (CBC), Gel Serum Gold (Biochem), Fluoride Grey (Glucose)
                  </Text>
                </View>
                {specimens.blood.photoUri && (
                  <View style={styles.doneCheckBadge}>
                    <CircleCheck size={16} color={colors.emeraldLight} />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.protocolCheckRow}
                onPress={() =>
                  setSpecimens((p) => ({
                    ...p,
                    blood: { ...p.blood, tubesFilled: !p.blood.tubesFilled },
                  }))
                }
              >
                {specimens.blood.tubesFilled ? (
                  <SquareCheck size={18} color={colors.emeraldLight} />
                ) : (
                  <Square size={18} color={colors.textMuted} />
                )}
                <Text style={styles.protocolCheckText}>3 tubes collected, filled to mark, and inverted 8 times</Text>
              </TouchableOpacity>

              {/* Photo Barcode Primary Button */}
              {specimens.blood.photoUri ? (
                <View style={styles.specimenPhotoPreviewBox}>
                  <Image source={{ uri: specimens.blood.photoUri }} style={styles.specimenThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.barcodeLabelText}>Blood Barcode Verified:</Text>
                    <Text style={styles.barcodeCodeText}>{specimens.blood.barcode}</Text>
                    <TouchableOpacity
                      style={styles.retakeMiniBtn}
                      onPress={() => handleCaptureSpecimenPhoto('blood')}
                    >
                      <Camera size={12} color="#fff" />
                      <Text style={styles.retakeMiniText}>Retake Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    style={styles.capturePrimaryBtn}
                    onPress={() => handleCaptureSpecimenPhoto('blood')}
                    activeOpacity={0.8}
                  >
                    <Camera size={20} color="#fff" />
                    <Text style={styles.capturePrimaryText}>Take Blood Vial Barcode Photo First</Text>
                  </TouchableOpacity>

                  {!specimens.blood.manualMode ? (
                    <TouchableOpacity
                      style={styles.manualFallbackBtn}
                      onPress={() => toggleSpecimenManual('blood', true)}
                    >
                      <AlertCircle size={13} color={colors.amberLight} />
                      <Text style={styles.manualFallbackText}>Camera scanner issue? Enter barcode manually</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {/* Manual Barcode Input Fallback */}
              {specimens.blood.manualMode && (
                <View style={styles.manualInputWrapper}>
                  <TextInput
                    style={styles.barcodeTextInput}
                    value={specimens.blood.barcode}
                    onChangeText={(val) =>
                      setSpecimens((p) => ({ ...p, blood: { ...p.blood, barcode: val } }))
                    }
                    placeholder="e.g. BIO-KIT-894102-BLD"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.genMiniBtn}
                    onPress={() =>
                      setSpecimens((p) => ({
                        ...p,
                        blood: { ...p.blood, barcode: `BIO-KIT-${Math.floor(100000 + Math.random() * 900000)}-BLD` },
                      }))
                    }
                  >
                    <Sparkles size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>

            {/* Specimen 2: Midstream Urine Collection */}
            <GlassCard style={styles.card}>
              <View style={styles.specimenHeaderRow}>
                <View style={[styles.specimenBadgeIcon, { backgroundColor: colors.amber + '20' }]}>
                  <Text style={styles.specimenBadgeEmoji}>🟡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.specimenName}>2. Midstream Urine Specimen</Text>
                  <Text style={styles.specimenDetails}>50ml Sterile Polypropylene Container sealed tightly</Text>
                </View>
                {specimens.urine.photoUri && (
                  <View style={styles.doneCheckBadge}>
                    <CircleCheck size={16} color={colors.emeraldLight} />
                  </View>
                )}
              </View>

              {specimens.urine.photoUri ? (
                <View style={styles.specimenPhotoPreviewBox}>
                  <Image source={{ uri: specimens.urine.photoUri }} style={styles.specimenThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.barcodeLabelText}>Urine Barcode Verified:</Text>
                    <Text style={styles.barcodeCodeText}>{specimens.urine.barcode}</Text>
                    <TouchableOpacity
                      style={styles.retakeMiniBtn}
                      onPress={() => handleCaptureSpecimenPhoto('urine')}
                    >
                      <Camera size={12} color="#fff" />
                      <Text style={styles.retakeMiniText}>Retake Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    style={[styles.capturePrimaryBtn, { borderColor: colors.amber, backgroundColor: colors.amber + '15' }]}
                    onPress={() => handleCaptureSpecimenPhoto('urine')}
                    activeOpacity={0.8}
                  >
                    <Camera size={20} color={colors.amberLight} />
                    <Text style={[styles.capturePrimaryText, { color: colors.amberLight }]}>
                      Take Urine Container Barcode Photo First
                    </Text>
                  </TouchableOpacity>

                  {!specimens.urine.manualMode ? (
                    <TouchableOpacity
                      style={styles.manualFallbackBtn}
                      onPress={() => toggleSpecimenManual('urine', true)}
                    >
                      <AlertCircle size={13} color={colors.amberLight} />
                      <Text style={styles.manualFallbackText}>Camera scanner issue? Enter barcode manually</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {specimens.urine.manualMode && (
                <View style={styles.manualInputWrapper}>
                  <TextInput
                    style={styles.barcodeTextInput}
                    value={specimens.urine.barcode}
                    onChangeText={(val) =>
                      setSpecimens((p) => ({ ...p, urine: { ...p.urine, barcode: val } }))
                    }
                    placeholder="e.g. BIO-KIT-894102-URN"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
              )}
            </GlassCard>

            {/* Specimen 3: Stool Sample Collection */}
            <GlassCard style={styles.card}>
              <View style={styles.specimenHeaderRow}>
                <View style={[styles.specimenBadgeIcon, { backgroundColor: '#854d0e25' }]}>
                  <Text style={styles.specimenBadgeEmoji}>🟤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.specimenName}>3. Stool Specimen Collection</Text>
                  <Text style={styles.specimenDetails}>Sterile vial with spoon, secured in biohazard transport pouch</Text>
                </View>
                {specimens.stool.photoUri && (
                  <View style={styles.doneCheckBadge}>
                    <CircleCheck size={16} color={colors.emeraldLight} />
                  </View>
                )}
              </View>

              {specimens.stool.photoUri ? (
                <View style={styles.specimenPhotoPreviewBox}>
                  <Image source={{ uri: specimens.stool.photoUri }} style={styles.specimenThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.barcodeLabelText}>Stool Barcode Verified:</Text>
                    <Text style={styles.barcodeCodeText}>{specimens.stool.barcode}</Text>
                    <TouchableOpacity
                      style={styles.retakeMiniBtn}
                      onPress={() => handleCaptureSpecimenPhoto('stool')}
                    >
                      <Camera size={12} color="#fff" />
                      <Text style={styles.retakeMiniText}>Retake Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    style={[styles.capturePrimaryBtn, { borderColor: '#a16207', backgroundColor: '#a1620718' }]}
                    onPress={() => handleCaptureSpecimenPhoto('stool')}
                    activeOpacity={0.8}
                  >
                    <Camera size={20} color="#facc15" />
                    <Text style={[styles.capturePrimaryText, { color: '#facc15' }]}>
                      Take Stool Vial Barcode Photo First
                    </Text>
                  </TouchableOpacity>

                  {!specimens.stool.manualMode ? (
                    <TouchableOpacity
                      style={styles.manualFallbackBtn}
                      onPress={() => toggleSpecimenManual('stool', true)}
                    >
                      <AlertCircle size={13} color={colors.amberLight} />
                      <Text style={styles.manualFallbackText}>Camera scanner issue? Enter barcode manually</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {specimens.stool.manualMode && (
                <View style={styles.manualInputWrapper}>
                  <TextInput
                    style={styles.barcodeTextInput}
                    value={specimens.stool.barcode}
                    onChangeText={(val) =>
                      setSpecimens((p) => ({ ...p, stool: { ...p.stool, barcode: val } }))
                    }
                    placeholder="e.g. BIO-KIT-894102-STL"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
              )}
            </GlassCard>

            {/* Cold Storage Checklist Confirmation */}
            <GlassCard style={styles.card}>
              <TouchableOpacity
                style={styles.checkItem}
                onPress={() =>
                  setSpecimens((p) => ({ ...p, coldStorageConfirmed: !p.coldStorageConfirmed }))
                }
                activeOpacity={0.8}
              >
                {specimens.coldStorageConfirmed ? (
                  <SquareCheck size={20} color={colors.emeraldLight} />
                ) : (
                  <Square size={20} color={colors.textMuted} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkText, specimens.coldStorageConfirmed && styles.checkTextActive]}>
                    All 3 specimens placed & locked in 4°C cold-chain transport container
                  </Text>
                  <Text style={styles.checkSubText}>Insulated carrier with frozen gel packs verified</Text>
                </View>
              </TouchableOpacity>
            </GlassCard>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => setCurrentStep(4)}
              activeOpacity={0.8}
            >
              <CircleCheck size={18} color="#fff" />
              <Text style={styles.primaryActionBtnText}>Next: Record Payment Collection (Step 4)</Text>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* STEP 4: PAYMENT COLLECTION BY PHLEBOTOMIST                     */}
        {/* ============================================================== */}
        {currentStep === 4 && (
          <View>
            <View style={styles.stepBanner}>
              <CreditCard size={20} color={colors.emeraldLight} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stepBannerTitle}>Step 4: Payment Collection & Settlement</Text>
                <Text style={styles.stepBannerSubtitle}>
                  Collect service fee from patient and confirm payment method before final sealing.
                </Text>
              </View>
            </View>

            {/* Bill Summary Card */}
            <GlassCard style={styles.card}>
              <View style={styles.paymentSummaryRow}>
                <View>
                  <Text style={styles.paymentServiceTitle}>BioSync 360 Full Biomarker Diagnostic</Text>
                  <Text style={styles.paymentServiceSubtitle}>
                    Clinical Intake + Blood (3 tubes) + Urine + Stool + Cold-Chain Transport
                  </Text>
                </View>
                <Text style={styles.paymentTotalAmount}>₹{billAmount}</Text>
              </View>

              <Text style={styles.paymentMethodTitle}>Select Payment Method Received:</Text>
              <View style={styles.paymentModeGrid}>
                <TouchableOpacity
                  style={[styles.paymentModeCard, paymentMode === 'Cash' && styles.paymentModeCardActive]}
                  onPress={() => setPaymentMode('Cash')}
                  activeOpacity={0.8}
                >
                  <Banknote size={22} color={paymentMode === 'Cash' ? colors.emeraldLight : colors.textMuted} />
                  <Text style={[styles.paymentModeText, paymentMode === 'Cash' && styles.paymentModeTextActive]}>
                    Cash
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentModeCard, paymentMode === 'UPI' && styles.paymentModeCardActive]}
                  onPress={() => setPaymentMode('UPI')}
                  activeOpacity={0.8}
                >
                  <QrCode size={22} color={paymentMode === 'UPI' ? colors.cyan : colors.textMuted} />
                  <Text style={[styles.paymentModeText, paymentMode === 'UPI' && styles.paymentModeTextActive]}>
                    UPI / QR Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentModeCard, paymentMode === 'Online' && styles.paymentModeCardActive]}
                  onPress={() => setPaymentMode('Online')}
                  activeOpacity={0.8}
                >
                  <CreditCard size={22} color={paymentMode === 'Online' ? colors.violetLight : colors.textMuted} />
                  <Text style={[styles.paymentModeText, paymentMode === 'Online' && styles.paymentModeTextActive]}>
                    Card / Online
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Payment Confirmation Toggle */}
              <TouchableOpacity
                style={styles.checkItem}
                onPress={() => setIsPaymentConfirmed(!isPaymentConfirmed)}
                activeOpacity={0.8}
              >
                {isPaymentConfirmed ? (
                  <SquareCheck size={20} color={colors.emeraldLight} />
                ) : (
                  <Square size={20} color={colors.textMuted} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkText, isPaymentConfirmed && styles.checkTextActive]}>
                    Payment of ₹{billAmount} Received & Confirmed by Phlebotomist
                  </Text>
                  <Text style={styles.checkSubText}>
                    Method: {paymentMode} • Verification: Confirmed on-site
                  </Text>
                </View>
              </TouchableOpacity>
            </GlassCard>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.emerald }, loading && { opacity: 0.7 }]}
              onPress={handleFinalizeCollection}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <ShieldCheck size={20} color="#fff" />
                  <Text style={styles.primaryActionBtnText}>Finalize Collection & Seal Samples</Text>
                  <ChevronRight size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* STEP 5: SAMPLES SEALED & CENTRAL LAB HANDOVER                   */}
        {/* ============================================================== */}
        {currentStep === 5 && (
          <View>
            <GlassCard style={[styles.card, styles.successCard]}>
              <View style={styles.successIconCircle}>
                <CircleCheck size={48} color={colors.emeraldLight} />
              </View>

              <Text style={styles.successTitle}>
                {isDroppedAtLab ? 'Central Laboratory Intake Handover' : 'Specimens Sealed & Locked!'}
              </Text>
              <Text style={styles.successDesc}>
                {isDroppedAtLab
                  ? 'Specimens (Blood, Urine, Stool) are now registered at the central laboratory intake. Declare below whether analyzer testing is completed.'
                  : 'All 3 diagnostic specimens (Blood, Urine, Stool) and clinical properties have been secured in the 4°C cold-chain transport container.'}
              </Text>

              {/* Kit Barcodes Summary */}
              <View style={styles.kitSummaryBox}>
                <View style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemLabel}>Primary Blood Barcode:</Text>
                  <Text style={styles.summaryItemValue}>{specimens.blood.barcode}</Text>
                </View>
                <View style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemLabel}>Urine Barcode:</Text>
                  <Text style={styles.summaryItemValue}>{specimens.urine.barcode}</Text>
                </View>
                <View style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemLabel}>Stool Barcode:</Text>
                  <Text style={styles.summaryItemValue}>{specimens.stool.barcode}</Text>
                </View>
                <View style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemLabel}>Payment Cleared:</Text>
                  <Text style={[styles.summaryItemValue, { color: colors.emeraldLight }]}>
                    ₹{billAmount} ({paymentMode})
                  </Text>
                </View>
              </View>

              {/* Action 1: If not yet dropped at lab -> Handover to Central Lab Button */}
              {!isDroppedAtLab && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: colors.cyan, marginBottom: 12 }, loading && { opacity: 0.7 }]}
                  onPress={handleDropoffAtLab}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Building size={18} color="#fff" />
                      <Text style={styles.primaryActionBtnText}>Handover to Central Lab (Kept at Lab)</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Action 2: Once dropped at Lab -> Results Done or Not Decision */}
              {isDroppedAtLab && (
                <View style={styles.resultsDecisionContainer}>
                  <View style={styles.decisionHeader}>
                    <TestTube size={18} color={colors.primaryLight} />
                    <Text style={styles.decisionTitle}>
                      {isDoctor ? 'Are Analyzer Results Done or Not?' : 'Central Laboratory Diagnostic Status'}
                    </Text>
                  </View>

                  {isDoctor ? (
                    <>
                      <Text style={styles.decisionSubtitle}>
                        Select laboratory analyzer testing status for this diagnostic specimen:
                      </Text>

                      {/* Dual Option Toggle Buttons (Doctor Only) */}
                      <View style={styles.decisionBtnRow}>
                        <TouchableOpacity
                          style={[
                            styles.decisionOptionBtn,
                            resultsDoneOption === 'no' && styles.decisionOptionBtnActiveNo,
                          ]}
                          onPress={() => handleSelectResultsDoneOption('no')}
                          activeOpacity={0.8}
                        >
                          <Clock size={16} color={resultsDoneOption === 'no' ? colors.amberLight : colors.textMuted} />
                          <Text
                            style={[
                              styles.decisionOptionText,
                              resultsDoneOption === 'no' && { color: colors.amberLight, fontWeight: '800' },
                            ]}
                          >
                            No - Not Done Yet
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.decisionOptionBtn,
                            resultsDoneOption === 'yes' && styles.decisionOptionBtnActiveYes,
                          ]}
                          onPress={() => handleSelectResultsDoneOption('yes')}
                          activeOpacity={0.8}
                        >
                          <Sparkles size={16} color={resultsDoneOption === 'yes' ? colors.emeraldLight : colors.textMuted} />
                          <Text
                            style={[
                              styles.decisionOptionText,
                              resultsDoneOption === 'yes' && { color: colors.emeraldLight, fontWeight: '800' },
                            ]}
                          >
                            Yes - Results Done
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Doctor Action: Enter Vitals or Show Pending */}
                      {vitalsSubmitted ? (
                        <View style={styles.vitalsSuccessCard}>
                          <CircleCheck size={20} color={colors.emeraldLight} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.vitalsSuccessTitle}>Results Entered & Posted to User DB</Text>
                            <Text style={styles.vitalsSuccessDesc}>
                              All clinical vitals and analyzer readings are now locked into the patient's medical record. AI prediction models updated.
                            </Text>
                          </View>
                        </View>
                      ) : resultsDoneOption === 'yes' ? (
                        <View style={styles.resultsReadyCard}>
                          <View style={styles.resultsReadyHeader}>
                            <Sparkles size={16} color={colors.emeraldLight} />
                            <Text style={styles.resultsReadyTitle}>Results Ready for Data Entry</Text>
                          </View>
                          <Text style={styles.resultsReadyDesc}>
                            Central lab analyzer testing completed. Proceed to enter physiological vitals and biochemical readings now to calculate patient AI risk scores.
                          </Text>

                          <TouchableOpacity
                            style={[styles.primaryActionBtn, { backgroundColor: colors.emerald, marginTop: 12 }]}
                            onPress={() => setVitalsModalVisible(true)}
                            activeOpacity={0.8}
                          >
                            <FileCheck size={18} color="#fff" />
                            <Text style={styles.primaryActionBtnText}>Enter Vitals & Analyzer Assay</Text>
                            <ChevronRight size={18} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.resultsPendingCard}>
                          <View style={styles.resultsPendingHeader}>
                            <Clock size={16} color={colors.amberLight} />
                            <Text style={styles.resultsPendingTitle}>Res yet to be obtained</Text>
                          </View>
                          <Text style={styles.resultsPendingDesc}>
                            Specimen safely registered at Central Laboratory. Testing in progress on automated clinical analyzers.
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    /* LAB ASSISTANT VIEW: Results Status Display (Read-Only with Doctor Access Notice) */
                    <View style={{ marginTop: 8 }}>
                      {vitalsSubmitted ? (
                        <View style={styles.vitalsSuccessCard}>
                          <CircleCheck size={20} color={colors.emeraldLight} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.vitalsSuccessTitle}>Results Entered & Posted to User DB</Text>
                            <Text style={styles.vitalsSuccessDesc}>
                              Vitals and chemical assay validated and certified by Pathologist. Medical records calibrated.
                            </Text>
                          </View>
                        </View>
                      ) : resultsDoneOption === 'yes' ? (
                        <View style={styles.resultsReadyCard}>
                          <View style={styles.resultsReadyHeader}>
                            <Sparkles size={16} color={colors.emeraldLight} />
                            <Text style={styles.resultsReadyTitle}>Results Ready</Text>
                          </View>
                          <Text style={styles.resultsReadyDesc}>
                            Laboratory analyzers have generated diagnostic readings. Awaiting final Doctor review and vital entry.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.resultsPendingCard}>
                          <View style={styles.resultsPendingHeader}>
                            <Clock size={16} color={colors.amberLight} />
                            <Text style={styles.resultsPendingTitle}>Res yet to be obtained</Text>
                          </View>
                          <Text style={styles.resultsPendingDesc}>
                            Specimens securely received into Central Laboratory custody. Automated clinical analyzers are processing the blood, urine, and stool panels.
                          </Text>
                        </View>
                      )}

                      {/* Doctor Access Restriction Banner */}
                      <View style={styles.doctorAccessNoteBox}>
                        <ShieldCheck size={16} color={colors.cyan} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.doctorAccessNoteTitle}>Doctor Authorized Access Only</Text>
                          <Text style={styles.doctorAccessNoteDesc}>
                            The status of results can only be updated by a Doctor. The Lab Assistant cannot enter analyzer results or modify post-lab vitals.
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Navigation Actions */}
              <View style={{ width: '100%', gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() => {
                    if (isDoctor) {
                      navigation.navigate('DoctorTabs', { screen: 'DoctorSamples' });
                    } else {
                      navigation.navigate('MainTabs', { screen: 'Dashboard' });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryActionBtnText}>
                    {isDoctor ? 'Return to Doctor Specimen Oversight' : 'Return to Dashboard'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]}
                  onPress={() => {
                    if (isDoctor) {
                      navigation.navigate('DoctorTabs', { screen: 'DoctorSamples' });
                    } else {
                      navigation.navigate('MainTabs', { screen: 'Samples', params: { tab: 'queue' } });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.secondaryActionBtnText, { color: colors.cyan }]}>
                    {isDoctor ? 'View Doctor Specimen Feed →' : 'View Laboratory Specimen Queue →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Patient Health Baseline Modal */}
      <PatientBaselineModal
        visible={baselineModalVisible}
        onClose={() => setBaselineModalVisible(false)}
        patientName={patientName}
        vitals={baselineData?.vitals || user?.vitals || baselineData}
        loading={baselineLoading}
      />

      {/* Ops Dispatch Helpline & Emergency Modal */}
      <OpsHelplineModal
        visible={helplineModalVisible}
        onClose={() => setHelplineModalVisible(false)}
        appointmentId={appointment?._id}
      />

      {/* Central Laboratory Analyzer Vitals Entry Modal */}
      <Modal
        visible={vitalsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVitalsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Enter Vitals & Analyzer Assay</Text>
              <Text style={styles.modalSubtitle}>Patient: {patientName} • Diagnostic Package</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setVitalsModalVisible(false)}
            >
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <VitalsFormSection
              vitals={modalVitals}
              updateMetric={updateModalMetric}
              onQuickFill={handleQuickFillModalNorms}
            />

            <View style={{ marginTop: 20, marginBottom: 40, gap: 12 }}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: colors.emerald }]}
                onPress={handlePostVitalsToUserDb}
                disabled={submittingVitals}
                activeOpacity={0.8}
              >
                {submittingVitals ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <FileCheck size={18} color="#fff" />
                    <Text style={styles.primaryActionBtnText}>Post Vitals to User DB & Calibrate AI</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => setVitalsModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryActionBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.rose + '15',
    borderWidth: 1,
    borderColor: colors.rose + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navStepLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.bgSurface,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepBarActive: {
    backgroundColor: colors.cyan,
  },
  stepBarDone: {
    backgroundColor: colors.emerald,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 14,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cyan + '20',
    borderWidth: 1,
    borderColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.cyanLight,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  phoneText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  timeSlotText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.cyanLight,
    marginTop: 2,
  },
  testPackageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    padding: 10,
    borderRadius: 10,
  },
  testPackageTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  testPackageSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 16,
  },
  // Step 1 OTP
  otpInputBox: {
    alignItems: 'center',
    marginVertical: 14,
  },
  otpTextInput: {
    backgroundColor: 'rgba(12, 12, 12, 0.9)',
    borderWidth: 1.5,
    borderColor: colors.violetLight,
    borderRadius: 14,
    width: 200,
    height: 56,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  autoFillOtpBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginBottom: 14,
  },
  autoFillOtpText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.violetLight,
  },
  // Step Banners
  stepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  stepBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepBannerSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  quickFillBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  // Vitals Grid
  vitalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vitalInputCol: {
    width: '47%',
  },
  vitalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  vitalFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  vitalInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  vitalUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  bmiBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  bmiBannerLabel: {
    fontSize: 11,
    color: colors.emeraldLight,
    fontWeight: '600',
  },
  bmiBannerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  fieldSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: colors.cyan + '20',
    borderColor: colors.cyan,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.cyanLight,
    fontWeight: '700',
  },
  standardTextInput: {
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 12,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  questionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  questionHint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  pillChoiceGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(12, 12, 12, 0.6)',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pillBtnActive: {
    backgroundColor: colors.emerald,
  },
  pillBtnActiveDanger: {
    backgroundColor: colors.rose,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: '#fff',
  },
  pillTextActiveDanger: {
    color: '#fff',
  },
  // Step 3 Specimens
  specimenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  specimenBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specimenBadgeEmoji: {
    fontSize: 18,
  },
  specimenName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  specimenDetails: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  doneCheckBadge: {
    padding: 4,
  },
  protocolCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  protocolCheckText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  capturePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1.5,
    borderColor: colors.cyan,
    borderRadius: 10,
    paddingVertical: 12,
  },
  capturePrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyanLight,
  },
  manualFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 6,
  },
  manualFallbackText: {
    fontSize: 10,
    color: colors.amberLight,
    fontWeight: '600',
  },
  manualInputWrapper: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  barcodeTextInput: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  genMiniBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specimenPhotoPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    padding: 10,
  },
  specimenThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.emerald,
  },
  barcodeLabelText: {
    fontSize: 10,
    color: colors.emeraldLight,
    fontWeight: '600',
  },
  barcodeCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 2,
  },
  retakeMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retakeMiniText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  checkText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  checkTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  checkSubText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Step 4 Payment
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  paymentServiceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentServiceSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 220,
  },
  paymentTotalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.emeraldLight,
  },
  paymentMethodTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  paymentModeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  paymentModeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  paymentModeCardActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: colors.cyan,
  },
  paymentModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  paymentModeTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  // Step 5 Success & Lab Dropoff
  successCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.emerald + '18',
    borderWidth: 1.5,
    borderColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 10,
  },
  kitSummaryBox: {
    width: '100%',
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginVertical: 16,
    gap: 8,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  summaryItemValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Primary & Secondary Action Buttons
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  primaryActionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryActionBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryActionBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  // Step 5 Decision & Vitals Styles
  resultsDecisionContainer: {
    width: '100%',
    backgroundColor: 'rgba(12, 12, 12, 0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginTop: 14,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  decisionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  decisionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  decisionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  decisionOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  decisionOptionBtnActiveNo: {
    backgroundColor: colors.amber + '18',
    borderColor: colors.amber,
  },
  decisionOptionBtnActiveYes: {
    backgroundColor: colors.emerald + '18',
    borderColor: colors.emerald,
  },
  decisionOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  resultsPendingCard: {
    backgroundColor: colors.amber + '12',
    borderWidth: 1,
    borderColor: colors.amber + '40',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  resultsPendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultsPendingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.amberLight,
  },
  resultsPendingDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  resultsReadyCard: {
    backgroundColor: colors.emerald + '12',
    borderWidth: 1,
    borderColor: colors.emerald + '40',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  resultsReadyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultsReadyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  resultsReadyDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  vitalsSuccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.emerald + '15',
    borderWidth: 1,
    borderColor: colors.emerald + '40',
    borderRadius: 12,
    padding: 12,
  },
  vitalsSuccessTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.emeraldLight,
  },
  vitalsSuccessDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAccessNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  doctorAccessNoteTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.cyan,
  },
  doctorAccessNoteDesc: {
    fontSize: 10.5,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
});

export default ActiveCollectionScreen;

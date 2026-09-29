import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Circle,
  Text as SvgText,
  Rect,
} from 'react-native-svg';
import {
  Heart,
  Activity,
  Wind,
  Brain,
  Zap,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Droplets,
  Calendar,
  ChevronDown,
  X,
  Search,
  Scale,
  Flame,
  ArrowUpRight,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import userApi from '../api/userApi';
import GlassCard from '../components/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 190;

// ============================================================================
// 32 IMPORTANT CLINICAL BIOMARKERS - CLEAR, ACCURATE, USER-FRIENDLY
// ============================================================================
export const CLINICAL_BIOMARKERS = [
  // 1. Heart & Blood Pressure
  {
    id: 'restingHeartRate',
    name: 'Resting Heart Rate',
    category: 'Heart & BP',
    unit: 'BPM',
    minNormal: 60,
    maxNormal: 80,
    criticalHigh: 85,
    criticalLow: 50,
    color: '#f43f5e',
    icon: Heart,
    simpleTip: 'Normal resting pulse is between 60 and 80 beats per minute.',
    getValue: (v) => v?.continuousMetrics?.restingHeartRate ?? 68,
  },
  {
    id: 'systolicBP',
    name: 'Blood Pressure (Systolic)',
    category: 'Heart & BP',
    unit: 'mmHg',
    minNormal: 90,
    maxNormal: 120,
    criticalHigh: 130,
    criticalLow: 85,
    color: '#06b6d4',
    icon: Activity,
    simpleTip: 'Top BP reading. Above 130 mmHg is considered high blood pressure.',
    getValue: (v) => v?.cardiovascularRisk?.systolic ?? 118,
  },
  {
    id: 'diastolicBP',
    name: 'Blood Pressure (Diastolic)',
    category: 'Heart & BP',
    unit: 'mmHg',
    minNormal: 60,
    maxNormal: 80,
    criticalHigh: 85,
    criticalLow: 55,
    color: '#38bdf8',
    icon: Activity,
    simpleTip: 'Bottom BP reading. Normal healthy range is between 60 and 80 mmHg.',
    getValue: (v) => v?.cardiovascularRisk?.diastolic ?? 76,
  },
  {
    id: 'meanArterialPressure',
    name: 'Mean Arterial Pressure (MAP)',
    category: 'Heart & BP',
    unit: 'mmHg',
    minNormal: 70,
    maxNormal: 100,
    criticalHigh: 105,
    criticalLow: 65,
    color: '#60a5fa',
    icon: Activity,
    simpleTip: 'Average pressure that pushes blood to all vital organs.',
    getValue: (v) => {
      if (v?.cardiovascularRisk?.meanArterialPressure) return v.cardiovascularRisk.meanArterialPressure;
      const s = v?.cardiovascularRisk?.systolic || 118;
      const d = v?.cardiovascularRisk?.diastolic || 76;
      return Math.round((2 * d + s) / 3);
    },
  },

  // 2. Blood Sugar & Metabolism
  {
    id: 'glucosePostPrandial',
    name: 'Blood Sugar (After Meal Spike)',
    category: 'Sugar & Metabolism',
    unit: 'mg/dL',
    minNormal: 70,
    maxNormal: 140,
    criticalHigh: 160,
    criticalLow: 65,
    color: '#eab308',
    icon: Zap,
    simpleTip: 'Glucose reading 2 hours after meals. Above 160 mg/dL is a spike risk.',
    getValue: (v) => v?.metabolicHealth?.glucosePostPrandial ?? 124,
  },
  {
    id: 'glucoseFasting',
    name: 'Blood Sugar (Fasting)',
    category: 'Sugar & Metabolism',
    unit: 'mg/dL',
    minNormal: 70,
    maxNormal: 99,
    criticalHigh: 110,
    criticalLow: 65,
    color: '#06b6d4',
    icon: Zap,
    simpleTip: 'Morning blood sugar before eating. Ideal healthy level is under 100 mg/dL.',
    getValue: (v) => v?.metabolicHealth?.glucoseFasting ?? 92,
  },
  {
    id: 'hba1c',
    name: 'HbA1c (3-Month Sugar Average)',
    category: 'Sugar & Metabolism',
    unit: '%',
    minNormal: 4.0,
    maxNormal: 5.6,
    criticalHigh: 6.0,
    criticalLow: 3.8,
    color: '#10b981',
    icon: Zap,
    simpleTip: 'Long-term glycemic control. Below 5.7% is completely non-diabetic.',
    getValue: (v) => v?.metabolicHealth?.hba1c ?? 5.4,
  },
  {
    id: 'fastingInsulin',
    name: 'Fasting Serum Insulin',
    category: 'Sugar & Metabolism',
    unit: 'μIU/mL',
    minNormal: 2.6,
    maxNormal: 15.0,
    criticalHigh: 18.0,
    criticalLow: 2.0,
    color: '#34d399',
    icon: Zap,
    simpleTip: 'Insulin hormone secreted by the pancreas to clear blood sugar.',
    getValue: (v) => v?.metabolicHealth?.fastingInsulin ?? 7.8,
  },
  {
    id: 'homaIR',
    name: 'Insulin Resistance Index (HOMA-IR)',
    category: 'Sugar & Metabolism',
    unit: 'Index',
    minNormal: 0.5,
    maxNormal: 1.9,
    criticalHigh: 2.2,
    criticalLow: 0.2,
    color: '#fbbf24',
    icon: Zap,
    simpleTip: 'Measures how sensitively your body cells respond to insulin.',
    getValue: (v) => v?.metabolicHealth?.homaIR ?? 1.77,
  },

  // 3. Cholesterol & Heart Health
  {
    id: 'triglycerides',
    name: 'Serum Triglycerides (Blood Fats)',
    category: 'Cholesterol & Fats',
    unit: 'mg/dL',
    minNormal: 50,
    maxNormal: 150,
    criticalHigh: 175,
    criticalLow: 40,
    color: '#f97316',
    icon: Activity,
    simpleTip: 'Fats in the bloodstream. Levels above 150 mg/dL increase heart strain.',
    getValue: (v) => v?.cardiovascularRisk?.triglycerides ?? 110,
  },
  {
    id: 'totalCholesterol',
    name: 'Total Cholesterol',
    category: 'Cholesterol & Fats',
    unit: 'mg/dL',
    minNormal: 125,
    maxNormal: 200,
    criticalHigh: 200,
    criticalLow: 110,
    color: '#f59e0b',
    icon: Activity,
    simpleTip: 'Total cholesterol score. Desirable level is below 200 mg/dL.',
    getValue: (v) => v?.cardiovascularRisk?.totalCholesterol ?? 172,
  },
  {
    id: 'ldlCholesterol',
    name: 'LDL Cholesterol (Bad)',
    category: 'Cholesterol & Fats',
    unit: 'mg/dL',
    minNormal: 50,
    maxNormal: 100,
    criticalHigh: 120,
    criticalLow: 40,
    color: '#f43f5e',
    icon: Activity,
    simpleTip: 'Low-density cholesterol that can build plaque in arteries.',
    getValue: (v) => v?.cardiovascularRisk?.ldlCholesterol ?? 92,
  },
  {
    id: 'hdlCholesterol',
    name: 'HDL Cholesterol (Good)',
    category: 'Cholesterol & Fats',
    unit: 'mg/dL',
    minNormal: 40,
    maxNormal: 60,
    criticalHigh: 75,
    criticalLow: 38,
    color: '#10b981',
    icon: Activity,
    simpleTip: 'Good cholesterol that sweeps harmful fats back to the liver.',
    getValue: (v) => v?.cardiovascularRisk?.hdlCholesterol ?? 58,
  },
  {
    id: 'atherogenicIndexPlasma',
    name: 'Atherogenic Index (AIP)',
    category: 'Cholesterol & Fats',
    unit: 'Index',
    minNormal: -0.3,
    maxNormal: 0.1,
    criticalHigh: 0.15,
    criticalLow: -0.4,
    color: '#fb7185',
    icon: Activity,
    simpleTip: 'Cardiovascular risk ratio calculated from Triglycerides and HDL.',
    getValue: (v) => v?.cardiovascularRisk?.atherogenicIndexPlasma ?? 0.12,
  },

  // 4. Lungs & Breathing
  {
    id: 'spO2',
    name: 'Blood Oxygen (SpO2)',
    category: 'Lungs & Oxygen',
    unit: '%',
    minNormal: 95,
    maxNormal: 100,
    criticalHigh: 100,
    criticalLow: 94,
    color: '#06b6d4',
    icon: Wind,
    simpleTip: 'Oxygen level in your blood. Healthy target is 95% to 100%.',
    getValue: (v) => v?.continuousMetrics?.oxygenSaturationSpO2 ?? 99,
  },
  {
    id: 'respirationRate',
    name: 'Breathing Rate',
    category: 'Lungs & Oxygen',
    unit: 'breaths/min',
    minNormal: 12,
    maxNormal: 20,
    criticalHigh: 22,
    criticalLow: 10,
    color: '#38bdf8',
    icon: Wind,
    simpleTip: 'Number of breaths per minute at rest. Normal is 12 to 20.',
    getValue: (v) => v?.continuousMetrics?.respirationRate ?? 15,
  },
  {
    id: 'stressIndex',
    name: 'Stress Score',
    category: 'Lungs & Oxygen',
    unit: '/100',
    minNormal: 0,
    maxNormal: 45,
    criticalHigh: 55,
    criticalLow: 0,
    color: '#8b5cf6',
    icon: Brain,
    simpleTip: 'Autonomic nervous system score derived from heartbeat variability.',
    getValue: (v) => {
      const hrv = v?.continuousMetrics?.hrv || 52;
      return Math.max(12, Math.min(88, Math.round(100 - hrv * 1.05)));
    },
  },
  {
    id: 'hrv',
    name: 'Heart Rate Variability (HRV)',
    category: 'Lungs & Oxygen',
    unit: 'ms',
    minNormal: 40,
    maxNormal: 80,
    criticalHigh: 100,
    criticalLow: 30,
    color: '#a855f7',
    icon: Brain,
    simpleTip: 'Time variation between consecutive heartbeats. Higher means better recovery.',
    getValue: (v) => v?.continuousMetrics?.hrv ?? 52,
  },

  // 5. Blood Count (CBC)
  {
    id: 'hemoglobin',
    name: 'Hemoglobin',
    category: 'Blood Count (CBC)',
    unit: 'g/dL',
    minNormal: 13.0,
    maxNormal: 17.0,
    criticalHigh: 17.5,
    criticalLow: 12.0,
    color: '#f43f5e',
    icon: Activity,
    simpleTip: 'Protein in red blood cells that carries oxygen throughout your body.',
    getValue: (v) => v?.hematology?.hemoglobin ?? 15.4,
  },
  {
    id: 'hematocrit',
    name: 'Hematocrit (PCV)',
    category: 'Blood Count (CBC)',
    unit: '%',
    minNormal: 38.0,
    maxNormal: 50.0,
    criticalHigh: 52.0,
    criticalLow: 36.0,
    color: '#fb7185',
    icon: Activity,
    simpleTip: 'Percentage of your blood volume made up of red blood cells.',
    getValue: (v) => v?.hematology?.hematocrit ?? 46,
  },
  {
    id: 'platelets',
    name: 'Platelet Count',
    category: 'Blood Count (CBC)',
    unit: '10^3/μL',
    minNormal: 150,
    maxNormal: 450,
    criticalHigh: 450,
    criticalLow: 140,
    color: '#f59e0b',
    icon: Activity,
    simpleTip: 'Cells that help your blood clot properly to stop bleeding.',
    getValue: (v) => {
      const p = v?.hematology?.platelets;
      return p ? (p > 1000 ? Math.round(p / 1000) : p) : 245;
    },
  },
  {
    id: 'wbc',
    name: 'White Blood Cells (WBC)',
    category: 'Blood Count (CBC)',
    unit: '10^3/μL',
    minNormal: 4.0,
    maxNormal: 11.0,
    criticalHigh: 11.0,
    criticalLow: 3.5,
    color: '#38bdf8',
    icon: Activity,
    simpleTip: 'Your body’s infection-fighting immune defense cells.',
    getValue: (v) => {
      const w = v?.hematology?.wbc;
      return w ? (w > 100 ? Number((w / 1000).toFixed(1)) : w) : 6.8;
    },
  },
  {
    id: 'rbc',
    name: 'Red Blood Cells (RBC)',
    category: 'Blood Count (CBC)',
    unit: '10^6/μL',
    minNormal: 4.5,
    maxNormal: 5.9,
    criticalHigh: 6.2,
    criticalLow: 4.2,
    color: '#e11d48',
    icon: Activity,
    simpleTip: 'Number of oxygen-transporting red cells per microliter of blood.',
    getValue: (v) => v?.hematology?.rbc ?? 5.1,
  },

  // 6. Kidneys & Liver
  {
    id: 'creatinine',
    name: 'Kidney Creatinine',
    category: 'Kidney & Liver',
    unit: 'mg/dL',
    minNormal: 0.6,
    maxNormal: 1.2,
    criticalHigh: 1.3,
    criticalLow: 0.5,
    color: '#10b981',
    icon: ShieldCheck,
    simpleTip: 'Natural waste filtered by healthy kidneys. Healthy is under 1.2 mg/dL.',
    getValue: (v) => v?.organFunction?.creatinine ?? 0.9,
  },
  {
    id: 'egfr',
    name: 'Kidney Filtration (eGFR)',
    category: 'Kidney & Liver',
    unit: 'mL/min',
    minNormal: 90,
    maxNormal: 120,
    criticalHigh: 130,
    criticalLow: 60,
    color: '#06b6d4',
    icon: ShieldCheck,
    simpleTip: 'Estimated filtration rate of kidneys. A score above 90 is optimal.',
    getValue: (v) => v?.organFunction?.egfr ?? 104,
  },
  {
    id: 'bun',
    name: 'Urea Nitrogen (BUN)',
    category: 'Kidney & Liver',
    unit: 'mg/dL',
    minNormal: 7,
    maxNormal: 20,
    criticalHigh: 22,
    criticalLow: 6,
    color: '#a855f7',
    icon: ShieldCheck,
    simpleTip: 'Protein waste cleared by kidneys. Normal range is 7 to 20 mg/dL.',
    getValue: (v) => v?.organFunction?.bun ?? 14,
  },
  {
    id: 'uricAcid',
    name: 'Serum Uric Acid',
    category: 'Kidney & Liver',
    unit: 'mg/dL',
    minNormal: 3.5,
    maxNormal: 7.2,
    criticalHigh: 7.5,
    criticalLow: 3.0,
    color: '#fbbf24',
    icon: ShieldCheck,
    simpleTip: 'Byproduct of digestion. High levels can cause joint pain or gout.',
    getValue: (v) => v?.organFunction?.uricAcid ?? 5.2,
  },
  {
    id: 'altSgpt',
    name: 'Liver Enzyme (ALT / SGPT)',
    category: 'Kidney & Liver',
    unit: 'U/L',
    minNormal: 7,
    maxNormal: 45,
    criticalHigh: 50,
    criticalLow: 5,
    color: '#10b981',
    icon: Activity,
    simpleTip: 'Primary liver enzyme. Elevated levels indicate liver stress or fatty liver.',
    getValue: (v) => v?.organFunction?.altSgpt ?? 24,
  },
  {
    id: 'astSgot',
    name: 'Liver Enzyme (AST / SGOT)',
    category: 'Kidney & Liver',
    unit: 'U/L',
    minNormal: 8,
    maxNormal: 40,
    criticalHigh: 45,
    criticalLow: 5,
    color: '#14b8a6',
    icon: Activity,
    simpleTip: 'Cellular enzyme found in liver and heart. Desirable is under 40 U/L.',
    getValue: (v) => v?.organFunction?.astSgot ?? 22,
  },
  {
    id: 'totalBilirubin',
    name: 'Bilirubin (Liver Function)',
    category: 'Kidney & Liver',
    unit: 'mg/dL',
    minNormal: 0.2,
    maxNormal: 1.2,
    criticalHigh: 1.3,
    criticalLow: 0.1,
    color: '#eab308',
    icon: Droplets,
    simpleTip: 'Substance processed by liver from red blood cells. Normal is < 1.2.',
    getValue: (v) => v?.organFunction?.totalBilirubin ?? 0.8,
  },

  // 7. Inflammation & Body
  {
    id: 'hsCRP',
    name: 'Body Inflammation (hs-CRP)',
    category: 'Inflammation & Body',
    unit: 'mg/L',
    minNormal: 0.1,
    maxNormal: 2.0,
    criticalHigh: 3.0,
    criticalLow: 0.0,
    color: '#f43f5e',
    icon: Flame,
    simpleTip: 'Marker for general body and vascular inflammation. Lower is healthier.',
    getValue: (v) => v?.immunology?.hsCRP ?? 0.9,
  },
  {
    id: 'bmi',
    name: 'Body Mass Index (BMI)',
    category: 'Inflammation & Body',
    unit: 'kg/m²',
    minNormal: 18.5,
    maxNormal: 24.9,
    criticalHigh: 25.0,
    criticalLow: 18.0,
    color: '#06b6d4',
    icon: Scale,
    simpleTip: 'Healthy weight-for-height ratio. Normal is between 18.5 and 24.9.',
    getValue: (v) => v?.bodyMetrics?.bmi ?? 23.4,
  },
  {
    id: 'bodyFatPercentage',
    name: 'Body Fat Percentage',
    category: 'Inflammation & Body',
    unit: '%',
    minNormal: 10.0,
    maxNormal: 20.0,
    criticalHigh: 25.0,
    criticalLow: 8.0,
    color: '#8b5cf6',
    icon: Scale,
    simpleTip: 'Percentage of total body weight that is fat. Healthy is 10% - 20%.',
    getValue: (v) => v?.bodyMetrics?.bodyFatPercentage ?? 16.5,
  },
];

const TIMELINE_OPTIONS = [
  { key: '1D', label: '1 Day' },
  { key: '7D', label: '7 Days' },
  { key: 'ALL', label: 'All History' },
  { key: 'DATE', label: 'Pick Date' },
];

export const VitalsAnalysisScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { latestVitals, fetchVitals } = useAuthStore();

  // Filter States: Which Vital & Which Timeline
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState('glucosePostPrandial');
  const [selectedTimeline, setSelectedTimeline] = useState('7D');
  const [selectedCustomDate, setSelectedCustomDate] = useState(null);

  // Modal & Search States
  const [isVitalModalVisible, setIsVitalModalVisible] = useState(false);
  const [modalSearchText, setModalSearchText] = useState('');
  const [selectedModalCategory, setSelectedModalCategory] = useState('All');

  // Data States
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [vitalsRes, histRes] = await Promise.all([
        fetchVitals(),
        userApi.getVitalsHistory().catch(() => null),
      ]);

      if (histRes?.success && Array.isArray(histRes.data)) {
        // Chronological order (oldest to newest)
        const sorted = [...histRes.data].sort(
          (a, b) => new Date(a.recordedAt || a.createdAt) - new Date(b.recordedAt || b.createdAt)
        );
        setVitalsHistory(sorted);

        // Default custom date to the latest recorded date
        if (sorted.length > 0 && !selectedCustomDate) {
          const latestDateStr = new Date(sorted[sorted.length - 1].recordedAt || sorted[sorted.length - 1].createdAt)
            .toISOString()
            .split('T')[0];
          setSelectedCustomDate(latestDateStr);
        }
      }
    } catch (e) {
      console.log('[Analysis] Load error:', e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  // List of distinct dates with recorded data for the Date Picker filter
  const availableDates = useMemo(() => {
    const dates = [];
    const seen = new Set();
    // Reverse to show latest first
    const reversed = [...vitalsHistory].reverse();
    reversed.forEach((doc) => {
      const d = new Date(doc.recordedAt || doc.createdAt);
      const isoStr = d.toISOString().split('T')[0];
      if (!seen.has(isoStr)) {
        seen.add(isoStr);
        const isToday = new Date().toISOString().split('T')[0] === isoStr;
        const displayLabel = isToday
          ? 'Today'
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dates.push({ isoStr, displayLabel });
      }
    });
    return dates;
  }, [vitalsHistory]);

  // Selected Biomarker Object
  const activeBiomarker = useMemo(() => {
    return CLINICAL_BIOMARKERS.find((b) => b.id === selectedBiomarkerId) || CLINICAL_BIOMARKERS[0];
  }, [selectedBiomarkerId]);

  // --------------------------------------------------------------------------
  // CALCULATE STABLE AVERAGE VITAL & CRITICAL VERSIONS FROM DB
  // --------------------------------------------------------------------------
  const { stableAvgVital, isCurrentCritical, isCurrentHigh, isCurrentLow, latestValue, deviationText } = useMemo(() => {
    const currentVal = Number(activeBiomarker.getValue(latestVitals));
    const isHigh = currentVal > activeBiomarker.criticalHigh;
    const isLow = currentVal < activeBiomarker.criticalLow;
    const isCritical = isHigh || isLow;

    // Calculate genuine Stable Average Vital from DB history
    let avg = currentVal;
    if (vitalsHistory.length > 0) {
      const values = vitalsHistory
        .map((doc) => Number(activeBiomarker.getValue(doc)))
        .filter((v) => !isNaN(v) && v > 0);
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        avg = Number((sum / values.length).toFixed(activeBiomarker.unit === '%' || activeBiomarker.unit === 'Index' ? 2 : 1));
      }
    }

    let devText = 'Healthy stable reading';
    if (isHigh) {
      devText = `Spike of +${(currentVal - activeBiomarker.maxNormal).toFixed(1)} ${activeBiomarker.unit} above normal threshold`;
    } else if (isLow) {
      devText = `Deficit of -${(activeBiomarker.minNormal - currentVal).toFixed(1)} ${activeBiomarker.unit} below normal threshold`;
    }

    return {
      stableAvgVital: avg,
      isCurrentCritical: isCritical,
      isCurrentHigh: isHigh,
      isCurrentLow: isLow,
      latestValue: currentVal,
      deviationText: devText,
    };
  }, [activeBiomarker, latestVitals, vitalsHistory]);

  // All Critical Vitals Across the Entire Health Panel (If Any)
  const criticalBiomarkersList = useMemo(() => {
    const list = [];
    CLINICAL_BIOMARKERS.forEach((bio) => {
      const val = Number(bio.getValue(latestVitals));
      const isHigh = val > bio.criticalHigh;
      const isLow = val < bio.criticalLow;
      if (isHigh || isLow) {
        // Find avg for this vital
        let avg = val;
        if (vitalsHistory.length > 0) {
          const vals = vitalsHistory.map((d) => Number(bio.getValue(d))).filter((v) => !isNaN(v) && v > 0);
          if (vals.length > 0) avg = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
        }
        list.push({
          ...bio,
          currentValue: val,
          stableAvgVital: avg,
          isHigh,
          statusLabel: isHigh ? 'Spike Detected' : 'Below Normal',
        });
      }
    });
    return list;
  }, [latestVitals, vitalsHistory]);

  // --------------------------------------------------------------------------
  // DYNAMIC CHART DATA ACCORDING TO USER'S SELECTED TIMELINE
  // --------------------------------------------------------------------------
  const chartPoints = useMemo(() => {
    const decimals = activeBiomarker.unit === '%' || activeBiomarker.unit === 'Index' ? 2 : 1;

    let recordsToChart = vitalsHistory;
    const now = new Date();

    if (selectedTimeline === '1D') {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      recordsToChart = vitalsHistory.filter(
        (d) => new Date(d.recordedAt || d.createdAt) >= oneDayAgo
      );
    } else if (selectedTimeline === '7D') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      recordsToChart = vitalsHistory.filter(
        (d) => new Date(d.recordedAt || d.createdAt) >= sevenDaysAgo
      );
    } else if (selectedTimeline === 'DATE' && selectedCustomDate) {
      recordsToChart = vitalsHistory.filter((d) => {
        const dStr = new Date(d.recordedAt || d.createdAt).toISOString().split('T')[0];
        return dStr === selectedCustomDate;
      });
    }

    // Fallback if no records exist for selected timeline
    if (!recordsToChart || recordsToChart.length === 0) {
      const base = latestValue;
      return [
        { index: 0, label: 'Baseline', value: base, isSpike: base > activeBiomarker.criticalHigh },
        { index: 1, label: 'Current', value: base, isSpike: base > activeBiomarker.criticalHigh },
      ];
    }

    return recordsToChart.map((doc, idx) => {
      const val = Number(Number(activeBiomarker.getValue(doc)).toFixed(decimals));
      const isSpike = val > activeBiomarker.criticalHigh || val < activeBiomarker.criticalLow;

      const dateObj = new Date(doc.recordedAt || doc.createdAt);
      let timeLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (selectedTimeline === '1D' || selectedTimeline === 'DATE') {
        timeLabel = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }

      return {
        index: idx,
        label: timeLabel,
        value: val,
        isSpike,
      };
    });
  }, [activeBiomarker, selectedTimeline, selectedCustomDate, vitalsHistory, latestValue]);

  // Chart Statistics
  const values = chartPoints.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const periodAvg = Number(
    (values.reduce((a, b) => a + b, 0) / (values.length || 1)).toFixed(
      activeBiomarker.unit === '%' || activeBiomarker.unit === 'Index' ? 2 : 1
    )
  );

  // SVG Geometry Calculation
  const svgData = useMemo(() => {
    if (chartPoints.length === 0) return { pathD: '', areaD: '', pointsMap: [], avgY: 0, maxRefY: 0, minRefY: 0 };

    const paddingX = 20;
    const paddingY = 25;
    const width = CHART_WIDTH - paddingX * 2;
    const height = CHART_HEIGHT - paddingY * 2;

    const chartMin = Math.min(minVal, activeBiomarker.minNormal * 0.95);
    const chartMax = Math.max(maxVal, activeBiomarker.maxNormal * 1.05);
    const range = chartMax - chartMin || 1;

    const pointsMap = chartPoints.map((p, idx) => {
      const divisor = chartPoints.length > 1 ? chartPoints.length - 1 : 1;
      const x = paddingX + (idx / divisor) * width;
      const normalizedY = (p.value - chartMin) / range;
      const y = paddingY + height - normalizedY * height;
      return { x, y, ...p };
    });

    // Stable Average Line Y Coordinate
    const normAvgY = (stableAvgVital - chartMin) / range;
    const avgY = paddingY + height - normAvgY * height;

    // Normal Limits Reference Lines
    const normMaxY = (activeBiomarker.maxNormal - chartMin) / range;
    const maxRefY = paddingY + height - normMaxY * height;

    const normMinY = (activeBiomarker.minNormal - chartMin) / range;
    const minRefY = paddingY + height - normMinY * height;

    // Smooth Curved Path
    let pathD = `M ${pointsMap[0].x} ${pointsMap[0].y}`;
    for (let i = 0; i < pointsMap.length - 1; i++) {
      const p0 = pointsMap[i];
      const p1 = pointsMap[i + 1];
      const midX = (p0.x + p1.x) / 2;
      pathD += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const last = pointsMap[pointsMap.length - 1];
    const first = pointsMap[0];
    const areaD = `${pathD} L ${last.x} ${CHART_HEIGHT} L ${first.x} ${CHART_HEIGHT} Z`;

    return { pathD, areaD, pointsMap, avgY, maxRefY, minRefY };
  }, [chartPoints, minVal, maxVal, stableAvgVital, activeBiomarker]);

  // Modal Filtered Biomarkers List
  const modalBiomarkers = useMemo(() => {
    return CLINICAL_BIOMARKERS.filter((b) => {
      const matchesCategory = selectedModalCategory === 'All' || b.category === selectedModalCategory;
      const matchesSearch =
        modalSearchText.trim() === '' ||
        b.name.toLowerCase().includes(modalSearchText.toLowerCase()) ||
        b.category.toLowerCase().includes(modalSearchText.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedModalCategory, modalSearchText]);

  const modalCategories = ['All', 'Heart & BP', 'Sugar & Metabolism', 'Cholesterol & Fats', 'Lungs & Oxygen', 'Blood Count (CBC)', 'Kidney & Liver', 'Inflammation & Body'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ========================================================= */}
      {/* 1. TOP HEADER & FILTER CONTROLS (VITAL & TIMELINE)        */}
      {/* ========================================================= */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.pageTitle}>Biometric Analysis</Text>
          <Text style={styles.pageSubtitle}>Select vital & timeline to view instant trends</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <RefreshCw size={15} color={colors.cyan} />
        </TouchableOpacity>
      </View>

      {/* FILTER BAR AT TOP */}
      <View style={styles.filterSection}>
        {/* Vital Selector Trigger */}
        <TouchableOpacity
          style={styles.vitalSelectorTrigger}
          onPress={() => setIsVitalModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.vitalTriggerLeft}>
            <View style={[styles.vitalIconPill, { backgroundColor: `${activeBiomarker.color}20` }]}>
              <activeBiomarker.icon size={16} color={activeBiomarker.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterSmallLabel}>SELECTED VITAL</Text>
              <Text style={styles.vitalTriggerName} numberOfLines={1}>
                {activeBiomarker.name}
              </Text>
            </View>
          </View>
          <View style={styles.vitalTriggerRight}>
            <Text style={styles.changeBtnText}>Change</Text>
            <ChevronDown size={14} color={colors.cyan} />
          </View>
        </TouchableOpacity>

        {/* Timeline Options (1D, 7D, ALL, or Pick Date) */}
        <View style={styles.timelinePillsRow}>
          {TIMELINE_OPTIONS.map((item) => {
            const isSelected = selectedTimeline === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.timelinePill, isSelected && styles.timelinePillActive]}
                onPress={() => setSelectedTimeline(item.key)}
                activeOpacity={0.8}
              >
                {item.key === 'DATE' && (
                  <Calendar
                    size={11}
                    color={isSelected ? '#000000' : colors.textMuted}
                    style={{ marginRight: 3 }}
                  />
                )}
                <Text style={[styles.timelinePillText, isSelected && styles.timelinePillTextActive]}>
                  {item.key === 'DATE' && selectedCustomDate
                    ? availableDates.find((d) => d.isoStr === selectedCustomDate)?.displayLabel || 'Date'
                    : item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* If 'Pick Date' is active, show available dates strip */}
        {selectedTimeline === 'DATE' && availableDates.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateSelectorRow}
          >
            {availableDates.map((item) => {
              const isDateSelected = selectedCustomDate === item.isoStr;
              return (
                <TouchableOpacity
                  key={item.isoStr}
                  style={[styles.dateChip, isDateSelected && styles.dateChipActive]}
                  onPress={() => setSelectedCustomDate(item.isoStr)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateChipText, isDateSelected && styles.dateChipTextActive]}>
                    {item.displayLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ========================================================= */}
      {/* MAIN CONTENT SCROLLVIEW                                   */}
      {/* ========================================================= */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.cyan}
            colors={[colors.cyan]}
          />
        }
      >
        {/* ========================================================= */}
        {/* 2. CURRENT VITAL STATUS (BIG NUMBERS & SIMPLE ADVICE)     */}
        {/* ========================================================= */}
        <GlassCard style={styles.mainVitalCard}>
          <View style={styles.mainVitalTop}>
            <View>
              <Text style={styles.vitalCategorySub}>{activeBiomarker.category.toUpperCase()}</Text>
              <Text style={styles.vitalHeadlineName}>{activeBiomarker.name}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                isCurrentCritical ? styles.statusBadgeCritical : styles.statusBadgeStable,
              ]}
            >
              {isCurrentCritical ? (
                <AlertTriangle size={12} color={colors.roseLight} />
              ) : (
                <CheckCircle2 size={12} color={colors.emeraldLight} />
              )}
              <Text
                style={[
                  styles.statusBadgeText,
                  isCurrentCritical ? { color: colors.roseLight } : { color: colors.emeraldLight },
                ]}
              >
                {isCurrentHigh ? 'SPIKE DETECTED' : isCurrentLow ? 'LOW AT RISK' : 'NORMAL & STABLE'}
              </Text>
            </View>
          </View>

          {/* Current Reading */}
          <View style={styles.bigReadingRow}>
            <Text style={styles.bigNumber}>{latestValue}</Text>
            <Text style={styles.bigUnit}>{activeBiomarker.unit}</Text>
          </View>

          {/* Simple Benchmarks: Stable Average & Normal Range */}
          <View style={styles.benchmarkBox}>
            <View style={styles.benchmarkCol}>
              <Text style={styles.benchmarkLabel}>YOUR STABLE AVERAGE</Text>
              <Text style={styles.benchmarkValueCyan}>
                {stableAvgVital} <Text style={styles.benchmarkUnit}>{activeBiomarker.unit}</Text>
              </Text>
              <Text style={styles.benchmarkSub}>Typical normal level</Text>
            </View>

            <View style={styles.benchmarkDivider} />

            <View style={styles.benchmarkCol}>
              <Text style={styles.benchmarkLabel}>DOCTOR NORMAL RANGE</Text>
              <Text style={styles.benchmarkValue}>
                {activeBiomarker.minNormal} - {activeBiomarker.maxNormal}{' '}
                <Text style={styles.benchmarkUnit}>{activeBiomarker.unit}</Text>
              </Text>
              <Text style={styles.benchmarkSub}>Recommended safe limit</Text>
            </View>
          </View>

          {/* Simple Advice Note */}
          <View
            style={[
              styles.adviceCard,
              isCurrentCritical ? styles.adviceCardCritical : styles.adviceCardStable,
            ]}
          >
            <Text style={styles.adviceText}>
              {isCurrentCritical ? (
                <>
                  <Text style={{ fontWeight: '900', color: colors.roseLight }}>Attention: </Text>
                  {deviationText}. Your typical average is {stableAvgVital} {activeBiomarker.unit}.
                  Consider hydration and monitoring your next meal.
                </>
              ) : (
                <>
                  <Text style={{ fontWeight: '900', color: colors.emeraldLight }}>Healthy: </Text>
                  This reading is operating within your normal safe limits. Keep up your routine!
                </>
              )}
            </Text>
          </View>
        </GlassCard>

        {/* ========================================================= */}
        {/* 3. SIMPLE, CLEAR TREND CHART                              */}
        {/* ========================================================= */}
        <GlassCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.chartDot, { backgroundColor: activeBiomarker.color }]} />
              <Text style={styles.chartTitle}>
                Trend ({selectedTimeline === 'DATE' ? 'Selected Date' : selectedTimeline})
              </Text>
            </View>
            <Text style={styles.chartAvgLabel}>
              Avg Line: <Text style={{ color: colors.cyanLight, fontWeight: '900' }}>{stableAvgVital} {activeBiomarker.unit}</Text>
            </Text>
          </View>

          <View style={styles.chartSvgWrap}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <SvgLinearGradient id="simpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={activeBiomarker.color} stopOpacity="0.35" />
                  <Stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                </SvgLinearGradient>
              </Defs>

              {/* Grid Lines */}
              <Line
                x1="10"
                y1="24"
                x2={CHART_WIDTH - 10}
                y2="24"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
              />
              <Line
                x1="10"
                y1={CHART_HEIGHT - 24}
                x2={CHART_WIDTH - 10}
                y2={CHART_HEIGHT - 24}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
              />

              {/* DOTTED STABLE AVERAGE VITAL LINE */}
              <Line
                x1="10"
                y1={svgData.avgY}
                x2={CHART_WIDTH - 10}
                y2={svgData.avgY}
                stroke={colors.cyan}
                strokeDasharray="5 3"
                strokeWidth="1.5"
              />
              <SvgText
                x={CHART_WIDTH - 12}
                y={Math.max(12, svgData.avgY - 4)}
                fill={colors.cyanLight}
                fontSize="8.5"
                fontWeight="900"
                textAnchor="end"
              >
                STABLE AVG: {stableAvgVital}
              </SvgText>

              {/* Shaded Area Under Curve */}
              {svgData.areaD ? <Path d={svgData.areaD} fill="url(#simpleGrad)" /> : null}

              {/* Smooth Trend Line */}
              {svgData.pathD ? (
                <Path
                  d={svgData.pathD}
                  fill="none"
                  stroke={activeBiomarker.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              ) : null}

              {/* Data Points & Spike Pins */}
              {svgData.pointsMap.map((pt, i) => {
                if (pt.isSpike) {
                  return (
                    <React.Fragment key={i}>
                      <Circle cx={pt.x} cy={pt.y} r="6" fill="rgba(244, 63, 94, 0.3)" />
                      <Circle cx={pt.x} cy={pt.y} r="3.5" fill={colors.roseLight} stroke="#ffffff" strokeWidth="1" />
                      <Rect
                        x={Math.max(6, Math.min(CHART_WIDTH - 58, pt.x - 29))}
                        y={Math.max(4, pt.y - 22)}
                        width="58"
                        height="15"
                        rx="3"
                        fill="#f43f5e"
                      />
                      <SvgText
                        x={Math.max(6, Math.min(CHART_WIDTH - 58, pt.x - 29)) + 29}
                        y={Math.max(4, pt.y - 22) + 11}
                        fill="#ffffff"
                        fontSize="7.5"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        SPIKE: {pt.value}
                      </SvgText>
                    </React.Fragment>
                  );
                }

                // Normal point
                return (
                  <Circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={i === svgData.pointsMap.length - 1 ? 4 : 2.5}
                    fill={activeBiomarker.color}
                    stroke="#ffffff"
                    strokeWidth={i === svgData.pointsMap.length - 1 ? 1 : 0}
                  />
                );
              })}
            </Svg>
          </View>

          {/* X Axis Time Labels */}
          <View style={styles.chartXLabels}>
            {chartPoints.map((pt, idx) => {
              if (
                idx === 0 ||
                idx === chartPoints.length - 1 ||
                idx === Math.floor(chartPoints.length / 2)
              ) {
                return (
                  <Text key={idx} style={styles.xLabelText}>
                    {pt.label}
                  </Text>
                );
              }
              return null;
            })}
          </View>
        </GlassCard>

        {/* ========================================================= */}
        {/* 4. CRITICAL VERSIONS (IF ANY) - DIRECT ACTION CARDS        */}
        {/* ========================================================= */}
        {criticalBiomarkersList.length > 0 && (
          <View style={styles.criticalSection}>
            <View style={styles.criticalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} color={colors.roseLight} />
                <Text style={styles.criticalSectionTitle}>Vitals Requiring Attention</Text>
              </View>
              <Text style={styles.criticalBadgeCount}>
                {criticalBiomarkersList.length} Spikes Detected
              </Text>
            </View>

            {criticalBiomarkersList.map((crit) => (
              <TouchableOpacity
                key={crit.id}
                style={[
                  styles.criticalItemCard,
                  selectedBiomarkerId === crit.id && styles.criticalItemCardActive,
                ]}
                onPress={() => setSelectedBiomarkerId(crit.id)}
                activeOpacity={0.8}
              >
                <View style={styles.critItemLeft}>
                  <View style={styles.critBadge}>
                    <Text style={styles.critBadgeText}>{crit.statusLabel.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.critName}>{crit.name}</Text>
                  <Text style={styles.critTip}>{crit.simpleTip}</Text>
                </View>

                <View style={styles.critItemRight}>
                  <Text style={styles.critVal}>{crit.currentValue} {crit.unit}</Text>
                  <Text style={styles.critAvgText}>Stable Avg: {crit.stableAvgVital} {crit.unit}</Text>
                  <View style={styles.tapToViewRow}>
                    <Text style={styles.tapToViewText}>View Trend</Text>
                    <ArrowUpRight size={10} color={colors.cyan} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ========================================================= */}
        {/* 5. ALL IMPORTANT VITALS (BROWSE & QUICK SWITCH)           */}
        {/* ========================================================= */}
        <View style={styles.allVitalsSection}>
          <View style={styles.allVitalsHeaderRow}>
            <Text style={styles.allVitalsTitle}>All Important Vitals</Text>
            <Text style={styles.allVitalsSub}>Tap any vital to see its trend</Text>
          </View>

          <View style={styles.vitalsListWrap}>
            {CLINICAL_BIOMARKERS.map((bio) => {
              const val = Number(bio.getValue(latestVitals));
              const isSelected = selectedBiomarkerId === bio.id;
              const isCrit = val > bio.criticalHigh || val < bio.criticalLow;

              // Calculate stable average from history
              let avg = val;
              if (vitalsHistory.length > 0) {
                const vals = vitalsHistory.map((d) => Number(bio.getValue(d))).filter((v) => !isNaN(v) && v > 0);
                if (vals.length > 0) avg = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
              }

              return (
                <TouchableOpacity
                  key={bio.id}
                  style={[
                    styles.vitalRowCard,
                    isSelected && { borderColor: colors.cyan, backgroundColor: '#07181f' },
                  ]}
                  onPress={() => setSelectedBiomarkerId(bio.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vitalRowLeft}>
                    <View style={[styles.vitalSmallIcon, { backgroundColor: `${bio.color}15` }]}>
                      <bio.icon size={15} color={bio.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vitalRowName} numberOfLines={1}>{bio.name}</Text>
                      <Text style={styles.vitalRowCategory}>{bio.category}</Text>
                    </View>
                  </View>

                  <View style={styles.vitalRowRight}>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.vitalRowVal}>
                        {val} <Text style={styles.vitalRowUnit}>{bio.unit}</Text>
                      </Text>
                      <Text style={styles.vitalRowAvg}>
                        Avg: {avg} {bio.unit}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.vitalStatusDot,
                        { backgroundColor: isCrit ? colors.roseLight : colors.emeraldLight },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* 6. VITAL SELECTOR MODAL                                    */}
      {/* ========================================================= */}
      <Modal
        visible={isVitalModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVitalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select a Vital</Text>
                <Text style={styles.modalSub}>Pick which biomarker you want to analyze</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsVitalModalVisible(false)}
              >
                <X size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.modalSearchBox}>
              <Search size={15} color={colors.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search vitals (e.g. Sugar, BP, Pulse)..."
                placeholderTextColor={colors.textMuted}
                value={modalSearchText}
                onChangeText={setModalSearchText}
              />
              {modalSearchText.length > 0 && (
                <TouchableOpacity onPress={() => setModalSearchText('')}>
                  <X size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalCategoriesRow}
            >
              {modalCategories.map((cat) => {
                const isCatActive = selectedModalCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalCatChip, isCatActive && styles.modalCatChipActive]}
                    onPress={() => setSelectedModalCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.modalCatChipText,
                        isCatActive && styles.modalCatChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Biomarkers List */}
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {modalBiomarkers.map((bio) => {
                const isSelected = selectedBiomarkerId === bio.id;
                const val = Number(bio.getValue(latestVitals));
                const isCrit = val > bio.criticalHigh || val < bio.criticalLow;

                return (
                  <TouchableOpacity
                    key={bio.id}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedBiomarkerId(bio.id);
                      setIsVitalModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.modalIconWrap, { backgroundColor: `${bio.color}15` }]}>
                      <bio.icon size={16} color={bio.color} />
                    </View>

                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.modalItemName}>{bio.name}</Text>
                      <Text style={styles.modalItemCategory}>{bio.category}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.modalItemVal}>
                        {val} {bio.unit}
                      </Text>
                      <Text
                        style={[
                          styles.modalItemStatus,
                          { color: isCrit ? colors.roseLight : colors.emeraldLight },
                        ]}
                      >
                        {isCrit ? 'Spike Alert' : 'Normal'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Filter Section at Top
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  vitalSelectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1316',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  vitalTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  vitalIconPill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSmallLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.cyanLight,
    letterSpacing: 0.5,
  },
  vitalTriggerName: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 1,
  },
  vitalTriggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.cyanLight,
  },

  // Timeline Pills
  timelinePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timelinePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  timelinePillActive: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },
  timelinePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
  },
  timelinePillTextActive: {
    color: '#000000',
  },

  // Date Selector Row
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 10,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: colors.cyan,
  },
  dateChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dateChipTextActive: {
    color: colors.cyanLight,
    fontWeight: '900',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Main Vital Card
  mainVitalCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  mainVitalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vitalCategorySub: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  vitalHeadlineName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeStable: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeCritical: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  bigReadingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 6,
  },
  bigNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
  },
  bigUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },

  // Benchmark Box
  benchmarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  benchmarkCol: {
    alignItems: 'center',
    flex: 1,
  },
  benchmarkLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  benchmarkValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  benchmarkValueCyan: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.cyanLight,
    marginTop: 2,
  },
  benchmarkUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
  },
  benchmarkSub: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 1,
  },
  benchmarkDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  adviceCard: {
    padding: 10,
    borderRadius: 8,
  },
  adviceCardStable: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.emeraldLight,
  },
  adviceCardCritical: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.roseLight,
  },
  adviceText: {
    fontSize: 11,
    color: '#ffffff',
    lineHeight: 16,
  },

  // Chart Card
  chartCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  chartAvgLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
  },
  chartSvgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartXLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  xLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },

  // Critical Section
  criticalSection: {
    marginBottom: 22,
  },
  criticalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  criticalSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.roseLight,
  },
  criticalBadgeCount: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.roseLight,
  },
  criticalItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16080a',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  criticalItemCardActive: {
    borderColor: colors.roseLight,
    borderWidth: 1.5,
    backgroundColor: '#200b0e',
  },
  critItemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  critBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.rose,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 4,
  },
  critBadgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  critName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  critTip: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  critItemRight: {
    alignItems: 'flex-end',
  },
  critVal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.roseLight,
  },
  critAvgText: {
    fontSize: 8.5,
    color: colors.cyanLight,
    fontWeight: '700',
    marginTop: 2,
  },
  tapToViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  tapToViewText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.cyan,
  },

  // All Vitals Section
  allVitalsSection: {
    marginBottom: 10,
  },
  allVitalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  allVitalsTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  allVitalsSub: {
    fontSize: 9.5,
    color: colors.textMuted,
  },
  vitalsListWrap: {
    gap: 8,
  },
  vitalRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  vitalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  vitalSmallIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalRowName: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  vitalRowCategory: {
    fontSize: 8.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  vitalRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vitalRowVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  vitalRowUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
  },
  vitalRowAvg: {
    fontSize: 8.5,
    color: colors.cyanLight,
    fontWeight: '700',
    marginTop: 1,
  },
  vitalStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: '75%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#ffffff',
    padding: 0,
  },
  modalCategoriesRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
  },
  modalCatChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalCatChipActive: {
    backgroundColor: colors.cyan,
  },
  modalCatChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modalCatChipTextActive: {
    color: '#000000',
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalItemActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  modalIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalItemCategory: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  modalItemVal: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalItemStatus: {
    fontSize: 8.5,
    fontWeight: '800',
    marginTop: 2,
  },
});

export default VitalsAnalysisScreen;

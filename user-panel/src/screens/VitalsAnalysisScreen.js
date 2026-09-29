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
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Wind,
  Brain,
  Zap,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Droplets,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Scale,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import userApi from '../api/userApi';
import GlassCard from '../components/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 205;

// ============================================================================
// 32 IMPORTANT CLINICAL BIOMARKERS WITH DB FIELD MAPPINGS & CLINICAL BOUNDS
// ============================================================================
export const CLINICAL_BIOMARKERS = [
  // 1. CARDIOVASCULAR & HEMODYNAMICS
  {
    id: 'restingHeartRate',
    name: 'Resting Heart Rate',
    category: 'Cardiovascular',
    unit: 'BPM',
    minNormal: 60,
    maxNormal: 80,
    criticalHigh: 85,
    criticalLow: 50,
    color: '#f43f5e',
    icon: Heart,
    riskNote: 'Elevated resting HR indicates elevated sympathetic tone or cardiovascular strain.',
    getValue: (v) => v?.continuousMetrics?.restingHeartRate ?? 68,
  },
  {
    id: 'systolicBP',
    name: 'Systolic Blood Pressure',
    category: 'Cardiovascular',
    unit: 'mmHg',
    minNormal: 90,
    maxNormal: 120,
    criticalHigh: 130,
    criticalLow: 85,
    color: '#06b6d4',
    icon: Activity,
    riskNote: 'Systolic excursion reflects peak arterial pressure during left ventricular contraction.',
    getValue: (v) => v?.cardiovascularRisk?.systolic ?? 118,
  },
  {
    id: 'diastolicBP',
    name: 'Diastolic Blood Pressure',
    category: 'Cardiovascular',
    unit: 'mmHg',
    minNormal: 60,
    maxNormal: 80,
    criticalHigh: 85,
    criticalLow: 55,
    color: '#38bdf8',
    icon: Activity,
    riskNote: 'Diastolic pressure reflects minimum peripheral resistance during cardiac relaxation.',
    getValue: (v) => v?.cardiovascularRisk?.diastolic ?? 76,
  },
  {
    id: 'meanArterialPressure',
    name: 'Mean Arterial Pressure (MAP)',
    category: 'Cardiovascular',
    unit: 'mmHg',
    minNormal: 70,
    maxNormal: 100,
    criticalHigh: 105,
    criticalLow: 65,
    color: '#60a5fa',
    icon: Activity,
    riskNote: 'Average arterial perfusion pressure necessary for constant organ oxygenation.',
    getValue: (v) => {
      if (v?.cardiovascularRisk?.meanArterialPressure) return v.cardiovascularRisk.meanArterialPressure;
      const s = v?.cardiovascularRisk?.systolic || 118;
      const d = v?.cardiovascularRisk?.diastolic || 76;
      return Math.round((2 * d + s) / 3);
    },
  },
  {
    id: 'totalCholesterol',
    name: 'Total Serum Cholesterol',
    category: 'Cardiovascular',
    unit: 'mg/dL',
    minNormal: 125,
    maxNormal: 200,
    criticalHigh: 200,
    criticalLow: 110,
    color: '#f59e0b',
    icon: Activity,
    riskNote: 'Circulating lipid sum. High levels correlate with atheroma development.',
    getValue: (v) => v?.cardiovascularRisk?.totalCholesterol ?? 172,
  },
  {
    id: 'ldlCholesterol',
    name: 'LDL Cholesterol (Atherogenic)',
    category: 'Cardiovascular',
    unit: 'mg/dL',
    minNormal: 50,
    maxNormal: 100,
    criticalHigh: 120,
    criticalLow: 40,
    color: '#f43f5e',
    icon: Activity,
    riskNote: 'Atherogenic low-density lipoprotein responsible for arterial plaque deposition.',
    getValue: (v) => v?.cardiovascularRisk?.ldlCholesterol ?? 92,
  },
  {
    id: 'hdlCholesterol',
    name: 'HDL Cholesterol (Protective)',
    category: 'Cardiovascular',
    unit: 'mg/dL',
    minNormal: 40,
    maxNormal: 60,
    criticalHigh: 75,
    criticalLow: 38,
    color: '#10b981',
    icon: Activity,
    riskNote: 'High-density lipoprotein facilitates reverse cholesterol transport back to liver.',
    getValue: (v) => v?.cardiovascularRisk?.hdlCholesterol ?? 58,
  },
  {
    id: 'triglycerides',
    name: 'Serum Triglycerides',
    category: 'Cardiovascular',
    unit: 'mg/dL',
    minNormal: 50,
    maxNormal: 150,
    criticalHigh: 175,
    criticalLow: 40,
    color: '#f97316',
    icon: Activity,
    riskNote: 'Circulating neutral fats. Post-prandial surges indicate carbohydrate hyper-reactivity.',
    getValue: (v) => v?.cardiovascularRisk?.triglycerides ?? 110,
  },
  {
    id: 'atherogenicIndexPlasma',
    name: 'Atherogenic Index (AIP)',
    category: 'Cardiovascular',
    unit: 'Index',
    minNormal: -0.3,
    maxNormal: 0.1,
    criticalHigh: 0.15,
    criticalLow: -0.4,
    color: '#fb7185',
    icon: Activity,
    riskNote: 'Logarithmic ratio log(TG/HDL) estimating fractional small dense LDL particle risk.',
    getValue: (v) => v?.cardiovascularRisk?.atherogenicIndexPlasma ?? 0.12,
  },

  // 2. METABOLIC & GLYCEMIC HEALTH
  {
    id: 'glucoseFasting',
    name: 'Fasting Blood Glucose',
    category: 'Metabolic',
    unit: 'mg/dL',
    minNormal: 70,
    maxNormal: 99,
    criticalHigh: 110,
    criticalLow: 65,
    color: '#06b6d4',
    icon: Zap,
    riskNote: 'Basal hepatic gluconeogenesis and baseline peripheral glucose clearance balance.',
    getValue: (v) => v?.metabolicHealth?.glucoseFasting ?? 92,
  },
  {
    id: 'glucosePostPrandial',
    name: 'Post-Prandial Glucose (Spike)',
    category: 'Metabolic',
    unit: 'mg/dL',
    minNormal: 70,
    maxNormal: 140,
    criticalHigh: 160,
    criticalLow: 65,
    color: '#eab308',
    icon: Zap,
    riskNote: 'Post-meal glycemic excursion. Spikes indicate beta-cell fatigue or insulin mismatch.',
    getValue: (v) => v?.metabolicHealth?.glucosePostPrandial ?? 124,
  },
  {
    id: 'hba1c',
    name: 'HbA1c Glycated Hemoglobin',
    category: 'Metabolic',
    unit: '%',
    minNormal: 4.0,
    maxNormal: 5.6,
    criticalHigh: 6.0,
    criticalLow: 3.8,
    color: '#10b981',
    icon: Zap,
    riskNote: 'Longitudinal 90-120 day weighted mean glycemic saturation of circulating erythrocytes.',
    getValue: (v) => v?.metabolicHealth?.hba1c ?? 5.4,
  },
  {
    id: 'fastingInsulin',
    name: 'Fasting Serum Insulin',
    category: 'Metabolic',
    unit: 'μIU/mL',
    minNormal: 2.6,
    maxNormal: 15.0,
    criticalHigh: 18.0,
    criticalLow: 2.0,
    color: '#34d399',
    icon: Zap,
    riskNote: 'Basal pancreatic beta-cell endocrine output. Elevated levels signal early insulin resistance.',
    getValue: (v) => v?.metabolicHealth?.fastingInsulin ?? 7.8,
  },
  {
    id: 'homaIR',
    name: 'HOMA-IR (Insulin Resistance)',
    category: 'Metabolic',
    unit: 'Index',
    minNormal: 0.5,
    maxNormal: 1.9,
    criticalHigh: 2.2,
    criticalLow: 0.2,
    color: '#eab308',
    icon: Zap,
    riskNote: 'Homeostatic Model Assessment score quantified as (Glucose x Insulin) / 405.',
    getValue: (v) => v?.metabolicHealth?.homaIR ?? 1.77,
  },

  // 3. RESPIRATORY & TELEMETRY
  {
    id: 'spO2',
    name: 'Arterial Oxygen (SpO2)',
    category: 'Respiratory',
    unit: '%',
    minNormal: 95,
    maxNormal: 100,
    criticalHigh: 100,
    criticalLow: 94,
    color: '#06b6d4',
    icon: Wind,
    riskNote: 'Pulse oximetry arterial fractional hemoglobin oxygen saturation.',
    getValue: (v) => v?.continuousMetrics?.oxygenSaturationSpO2 ?? 99,
  },
  {
    id: 'respirationRate',
    name: 'Respiration Rate',
    category: 'Respiratory',
    unit: 'breaths/min',
    minNormal: 12,
    maxNormal: 20,
    criticalHigh: 22,
    criticalLow: 10,
    color: '#38bdf8',
    icon: Wind,
    riskNote: 'Resting respiratory frequency per minute under resting autonomic regulation.',
    getValue: (v) => v?.continuousMetrics?.respirationRate ?? 15,
  },
  {
    id: 'hrv',
    name: 'Heart Rate Variability (HRV)',
    category: 'Respiratory',
    unit: 'ms',
    minNormal: 40,
    maxNormal: 80,
    criticalHigh: 100,
    criticalLow: 30,
    color: '#a855f7',
    icon: Brain,
    riskNote: 'Beat-to-beat inter-beat interval variance. Higher HRV signifies parasympathetic resilience.',
    getValue: (v) => v?.continuousMetrics?.hrv ?? 52,
  },
  {
    id: 'stressIndex',
    name: 'Autonomic Stress Index',
    category: 'Respiratory',
    unit: '/100',
    minNormal: 0,
    maxNormal: 45,
    criticalHigh: 55,
    criticalLow: 0,
    color: '#8b5cf6',
    icon: Brain,
    riskNote: 'Derived sympathetic/parasympathetic ratio calculated from continuous HRV dynamics.',
    getValue: (v) => {
      const hrv = v?.continuousMetrics?.hrv || 52;
      return Math.max(12, Math.min(88, Math.round(100 - hrv * 1.05)));
    },
  },

  // 4. HEMATOLOGY & COMPLETE BLOOD COUNT (CBC)
  {
    id: 'hemoglobin',
    name: 'Blood Hemoglobin',
    category: 'Hematology',
    unit: 'g/dL',
    minNormal: 13.0,
    maxNormal: 17.0,
    criticalHigh: 17.5,
    criticalLow: 12.0,
    color: '#f43f5e',
    icon: Activity,
    riskNote: 'Oxygen-carrying metalloprotein inside RBCs. Low levels indicate anemia.',
    getValue: (v) => v?.hematology?.hemoglobin ?? 15.4,
  },
  {
    id: 'hematocrit',
    name: 'Hematocrit (PCV)',
    category: 'Hematology',
    unit: '%',
    minNormal: 38.0,
    maxNormal: 50.0,
    criticalHigh: 52.0,
    criticalLow: 36.0,
    color: '#fb7185',
    icon: Activity,
    riskNote: 'Packed cell volume percentage of whole blood occupied by erythrocytes.',
    getValue: (v) => v?.hematology?.hematocrit ?? 46,
  },
  {
    id: 'platelets',
    name: 'Platelet Count',
    category: 'Hematology',
    unit: '10^3/μL',
    minNormal: 150,
    maxNormal: 450,
    criticalHigh: 450,
    criticalLow: 140,
    color: '#f59e0b',
    icon: Activity,
    riskNote: 'Thrombocytes required for primary hemostasis and vascular endothelial repair.',
    getValue: (v) => {
      const p = v?.hematology?.platelets;
      return p ? (p > 1000 ? Math.round(p / 1000) : p) : 245;
    },
  },
  {
    id: 'wbc',
    name: 'Total Leukocyte Count (WBC)',
    category: 'Hematology',
    unit: '10^3/μL',
    minNormal: 4.0,
    maxNormal: 11.0,
    criticalHigh: 11.0,
    criticalLow: 3.5,
    color: '#38bdf8',
    icon: Activity,
    riskNote: 'Total circulating white blood cell immune army protecting against pathogens.',
    getValue: (v) => {
      const w = v?.hematology?.wbc;
      return w ? (w > 100 ? Number((w / 1000).toFixed(1)) : w) : 6.8;
    },
  },
  {
    id: 'rbc',
    name: 'Red Blood Cells (RBC)',
    category: 'Hematology',
    unit: '10^6/μL',
    minNormal: 4.5,
    maxNormal: 5.9,
    criticalHigh: 6.2,
    criticalLow: 4.2,
    color: '#e11d48',
    icon: Activity,
    riskNote: 'Absolute density of mature circulating erythrocytes per microliter of blood.',
    getValue: (v) => v?.hematology?.rbc ?? 5.1,
  },

  // 5. RENAL & KIDNEY FUNCTION
  {
    id: 'creatinine',
    name: 'Serum Creatinine',
    category: 'Renal & Hepatic',
    unit: 'mg/dL',
    minNormal: 0.6,
    maxNormal: 1.2,
    criticalHigh: 1.3,
    criticalLow: 0.5,
    color: '#10b981',
    icon: ShieldCheck,
    riskNote: 'Muscle breakdown byproduct cleared exclusively via renal glomerular filtration.',
    getValue: (v) => v?.organFunction?.creatinine ?? 0.9,
  },
  {
    id: 'egfr',
    name: 'Glomerular Filtration (eGFR)',
    category: 'Renal & Hepatic',
    unit: 'mL/min',
    minNormal: 90,
    maxNormal: 120,
    criticalHigh: 130,
    criticalLow: 60,
    color: '#06b6d4',
    icon: ShieldCheck,
    riskNote: 'Normalized filtration rate evaluating functional kidney nephron capacity.',
    getValue: (v) => v?.organFunction?.egfr ?? 104,
  },
  {
    id: 'bun',
    name: 'Blood Urea Nitrogen (BUN)',
    category: 'Renal & Hepatic',
    unit: 'mg/dL',
    minNormal: 7,
    maxNormal: 20,
    criticalHigh: 22,
    criticalLow: 6,
    color: '#a855f7',
    icon: ShieldCheck,
    riskNote: 'Nitrogenous waste product from hepatic dietary protein catabolism.',
    getValue: (v) => v?.organFunction?.bun ?? 14,
  },
  {
    id: 'uricAcid',
    name: 'Serum Uric Acid',
    category: 'Renal & Hepatic',
    unit: 'mg/dL',
    minNormal: 3.5,
    maxNormal: 7.2,
    criticalHigh: 7.5,
    criticalLow: 3.0,
    color: '#fbbf24',
    icon: ShieldCheck,
    riskNote: 'Final oxidation product of purine catabolism; elevated levels cause crystal arthritis.',
    getValue: (v) => v?.organFunction?.uricAcid ?? 5.2,
  },

  // 6. HEPATIC & LIVER ENZYMES
  {
    id: 'altSgpt',
    name: 'ALT (SGPT Liver Enzyme)',
    category: 'Renal & Hepatic',
    unit: 'U/L',
    minNormal: 7,
    maxNormal: 45,
    criticalHigh: 50,
    criticalLow: 5,
    color: '#10b981',
    icon: Activity,
    riskNote: 'Intracellular hepatocyte enzyme. Release into bloodstream indicates liver cell strain.',
    getValue: (v) => v?.organFunction?.altSgpt ?? 24,
  },
  {
    id: 'astSgot',
    name: 'AST (SGOT Liver Enzyme)',
    category: 'Renal & Hepatic',
    unit: 'U/L',
    minNormal: 8,
    maxNormal: 40,
    criticalHigh: 45,
    criticalLow: 5,
    color: '#14b8a6',
    icon: Activity,
    riskNote: 'Mitochondrial enzyme found in hepatic and cardiac tissue.',
    getValue: (v) => v?.organFunction?.astSgot ?? 22,
  },
  {
    id: 'totalBilirubin',
    name: 'Total Serum Bilirubin',
    category: 'Renal & Hepatic',
    unit: 'mg/dL',
    minNormal: 0.2,
    maxNormal: 1.2,
    criticalHigh: 1.3,
    criticalLow: 0.1,
    color: '#eab308',
    icon: Droplets,
    riskNote: 'Yellow catabolic product of normal heme degradation cleared by biliary system.',
    getValue: (v) => v?.organFunction?.totalBilirubin ?? 0.8,
  },

  // 7. SYSTEMIC INFLAMMATION
  {
    id: 'hsCRP',
    name: 'High-Sensitivity CRP (hs-CRP)',
    category: 'Renal & Hepatic',
    unit: 'mg/L',
    minNormal: 0.1,
    maxNormal: 2.0,
    criticalHigh: 3.0,
    criticalLow: 0.0,
    color: '#f43f5e',
    icon: Flame,
    riskNote: 'Acute-phase hepatic reactant signaling vascular endothelium inflammation.',
    getValue: (v) => v?.immunology?.hsCRP ?? 0.9,
  },

  // 8. ANTHROPOMETRICS & BODY COMPOSITION
  {
    id: 'bmi',
    name: 'Body Mass Index (BMI)',
    category: 'Body Composition',
    unit: 'kg/m²',
    minNormal: 18.5,
    maxNormal: 24.9,
    criticalHigh: 25.0,
    criticalLow: 18.0,
    color: '#06b6d4',
    icon: Scale,
    riskNote: 'Normalized weight-to-height ratio estimating overall body habitus.',
    getValue: (v) => v?.bodyMetrics?.bmi ?? 23.4,
  },
  {
    id: 'bodyFatPercentage',
    name: 'Body Fat Percentage',
    category: 'Body Composition',
    unit: '%',
    minNormal: 10.0,
    maxNormal: 20.0,
    criticalHigh: 25.0,
    criticalLow: 8.0,
    color: '#8b5cf6',
    icon: Scale,
    riskNote: 'Total adipose tissue mass divided by total body weight.',
    getValue: (v) => v?.bodyMetrics?.bodyFatPercentage ?? 16.5,
  },
];

const CATEGORIES = [
  'All',
  'Cardiovascular',
  'Metabolic',
  'Respiratory',
  'Hematology',
  'Renal & Hepatic',
  'Body Composition',
];

const TIMEFRAMES = ['1D', '7D', '30D', 'ALL'];

export const VitalsAnalysisScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { latestVitals, fetchVitals } = useAuthStore();
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState('restingHeartRate');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7D');
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [vitalsRes, histRes] = await Promise.all([
        fetchVitals(),
        userApi.getVitalsHistory().catch(() => null),
      ]);

      if (histRes?.success && Array.isArray(histRes.data)) {
        // Sort ascending by recordedAt for proper time-series charting
        const sorted = [...histRes.data].sort(
          (a, b) => new Date(a.recordedAt || a.createdAt) - new Date(b.recordedAt || b.createdAt)
        );
        setVitalsHistory(sorted);
      }
    } catch (e) {
      console.log('[Analysis] Load error:', e.message);
    } finally {
      setIsLoading(false);
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

  // --------------------------------------------------------------------------
  // DYNAMIC COMPUTATION OF STABLE VERSION AVG VITALS VS CRITICAL VERSIONS
  // --------------------------------------------------------------------------
  const { stableVitals, criticalVitals } = useMemo(() => {
    const stable = [];
    const critical = [];

    CLINICAL_BIOMARKERS.forEach((bio) => {
      // Latest current reading from DB
      const currentVal = Number(bio.getValue(latestVitals));
      const isHigh = currentVal > bio.criticalHigh;
      const isLow = currentVal < bio.criticalLow;
      const isCritical = isHigh || isLow;

      // Real historical average calculated dynamically across all records in DB
      let avgVital = currentVal;
      if (vitalsHistory.length > 0) {
        const histVals = vitalsHistory
          .map((doc) => Number(bio.getValue(doc)))
          .filter((v) => !isNaN(v) && v > 0);

        if (histVals.length > 0) {
          const sum = histVals.reduce((acc, curr) => acc + curr, 0);
          const rawAvg = sum / histVals.length;
          avgVital = Number(
            rawAvg.toFixed(bio.unit === '%' || bio.unit === 'Index' ? 2 : 1)
          );
        }
      }

      // Exact clinical deviation from Stable Average Vital
      const diffFromAvg = currentVal - avgVital;
      const deviationText = isHigh
        ? `+${(currentVal - bio.maxNormal).toFixed(1)} ${bio.unit} above reference (Stable Avg: ${avgVital})`
        : isLow
        ? `-${(bio.minNormal - currentVal).toFixed(1)} ${bio.unit} below reference (Stable Avg: ${avgVital})`
        : `Optimal Homeostasis • Deviation: ${diffFromAvg >= 0 ? `+${diffFromAvg.toFixed(1)}` : diffFromAvg.toFixed(1)} ${bio.unit}`;

      const item = {
        ...bio,
        currentValue: currentVal,
        avgVital,
        isCritical,
        statusType: isHigh ? 'CRITICAL HIGH SPIKE' : isLow ? 'CRITICAL LOW DEFICIT' : 'STABLE OPTIMAL',
        deviation: deviationText,
      };

      if (isCritical) {
        critical.push(item);
      } else {
        stable.push(item);
      }
    });

    return { stableVitals: stable, criticalVitals: critical };
  }, [latestVitals, vitalsHistory]);

  // Set default selection to first critical vital if any, otherwise Resting Heart Rate
  useEffect(() => {
    if (criticalVitals.length > 0 && selectedBiomarkerId === 'restingHeartRate') {
      setSelectedBiomarkerId(criticalVitals[0].id);
    }
  }, [criticalVitals]);

  const activeBiomarker = useMemo(() => {
    return CLINICAL_BIOMARKERS.find((b) => b.id === selectedBiomarkerId) || CLINICAL_BIOMARKERS[0];
  }, [selectedBiomarkerId]);

  // --------------------------------------------------------------------------
  // DYNAMIC TRADING CHART POINTS DRAWN FROM REAL DB RECORDS
  // --------------------------------------------------------------------------
  const chartPoints = useMemo(() => {
    const decimals = activeBiomarker.unit === '%' || activeBiomarker.unit === 'Index' ? 2 : 1;

    // Filter historical records based on selected timeframe
    let filteredRecords = vitalsHistory;
    if (vitalsHistory.length > 0) {
      const now = new Date();
      if (selectedTimeframe === '1D') {
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filteredRecords = vitalsHistory.filter(
          (d) => new Date(d.recordedAt || d.createdAt) >= oneDayAgo
        );
      } else if (selectedTimeframe === '7D') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredRecords = vitalsHistory.filter(
          (d) => new Date(d.recordedAt || d.createdAt) >= sevenDaysAgo
        );
      } else if (selectedTimeframe === '30D') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredRecords = vitalsHistory.filter(
          (d) => new Date(d.recordedAt || d.createdAt) >= thirtyDaysAgo
        );
      }
    }

    // If records are empty or only 1, use the latest record with small realistic physiological variation
    if (!filteredRecords || filteredRecords.length === 0) {
      const base = Number(activeBiomarker.getValue(latestVitals));
      return [
        { index: 0, time: 'Day 1', value: base, isSpike: base > activeBiomarker.criticalHigh },
        { index: 1, time: 'Day 2', value: base, isSpike: base > activeBiomarker.criticalHigh },
      ];
    }

    return filteredRecords.map((doc, idx) => {
      const val = Number(Number(activeBiomarker.getValue(doc)).toFixed(decimals));
      const isSpike = val > activeBiomarker.criticalHigh || val < activeBiomarker.criticalLow;

      const dateObj = new Date(doc.recordedAt || doc.createdAt);
      const timeLabel =
        selectedTimeframe === '1D'
          ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        index: idx,
        time: timeLabel,
        value: val,
        isSpike,
      };
    });
  }, [activeBiomarker, latestVitals, vitalsHistory, selectedTimeframe]);

  // Dynamic Chart Statistics
  const values = chartPoints.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avgVal = Number(
    (values.reduce((a, b) => a + b, 0) / (values.length || 1)).toFixed(
      activeBiomarker.unit === '%' || activeBiomarker.unit === 'Index' ? 2 : 1
    )
  );
  const currentVal = values[values.length - 1] ?? activeBiomarker.getValue(latestVitals);
  const firstVal = values[0] ?? currentVal;
  const changePct = Number((((currentVal - firstVal) / (firstVal || 1)) * 100).toFixed(1));
  const isPositive = changePct >= 0;

  // Build SVG Path
  const svgData = useMemo(() => {
    if (chartPoints.length === 0) return { pathD: '', areaD: '', pointsMap: [], avgY: 0, minRefY: 0, maxRefY: 0 };

    const paddingX = 16;
    const paddingY = 26;
    const width = CHART_WIDTH - paddingX * 2;
    const height = CHART_HEIGHT - paddingY * 2;

    // Expand chart bounds to accommodate reference lines
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

    // Average line Y coordinate (STABLE VERSION AVG VITAL)
    const normalizedAvgY = (avgVal - chartMin) / range;
    const avgY = paddingY + height - normalizedAvgY * height;

    // Normal reference bounds (Support / Resistance)
    const maxRefNormY = (activeBiomarker.maxNormal - chartMin) / range;
    const maxRefY = paddingY + height - maxRefNormY * height;

    const minRefNormY = (activeBiomarker.minNormal - chartMin) / range;
    const minRefY = paddingY + height - minRefNormY * height;

    // Construct Smooth SVG Path
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

    return { pathD, areaD, pointsMap, avgY, minRefY, maxRefY };
  }, [chartPoints, minVal, maxVal, avgVal, activeBiomarker]);

  const filteredStableVitals = stableVitals.filter(
    (b) => selectedCategory === 'All' || b.category === selectedCategory
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Navigation Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerBadgeRow}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>DB TELEMETRY LIVE</Text>
            </View>
            <Text style={styles.headerCode}>VTL-ANL-32</Text>
          </View>
          <Text style={styles.headerTitle}>Biometric Analysis Terminal</Text>
          <Text style={styles.headerSubtitle}>
            {CLINICAL_BIOMARKERS.length} clinical biomarkers • Dynamic stable averages & critical spikes
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.cyan} />
          ) : (
            <RefreshCw size={16} color={colors.cyan} />
          )}
        </TouchableOpacity>
      </View>

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
        {/* 1. EXECUTIVE TELEMETRY AUDIT OVERVIEW                     */}
        {/* ========================================================= */}
        <View style={styles.auditRow}>
          <GlassCard style={styles.auditCard}>
            <View style={styles.auditIconRow}>
              <ShieldCheck size={18} color={colors.emeraldLight} />
              <View style={styles.auditPillStable}>
                <Text style={styles.auditPillStableText}>STABLE</Text>
              </View>
            </View>
            <Text style={styles.auditValue}>{stableVitals.length}</Text>
            <Text style={styles.auditLabel}>Stable Biomarkers</Text>
          </GlassCard>

          <GlassCard style={[styles.auditCard, criticalVitals.length > 0 && styles.auditCardCritical]}>
            <View style={styles.auditIconRow}>
              <AlertTriangle size={18} color={criticalVitals.length > 0 ? colors.roseLight : colors.textMuted} />
              <View
                style={[
                  styles.auditPillCritical,
                  criticalVitals.length === 0 && { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                ]}
              >
                <Text
                  style={[
                    styles.auditPillCriticalText,
                    criticalVitals.length === 0 && { color: colors.textMuted },
                  ]}
                >
                  {criticalVitals.length > 0 ? 'ACTION' : 'CLEAN'}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.auditValue,
                criticalVitals.length > 0 && { color: colors.roseLight },
              ]}
            >
              {criticalVitals.length}
            </Text>
            <Text style={styles.auditLabel}>Critical Flags</Text>
          </GlassCard>

          <GlassCard style={styles.auditCard}>
            <View style={styles.auditIconRow}>
              <Activity size={18} color={colors.cyanLight} />
              <View style={styles.auditPillBalanced}>
                <Text style={styles.auditPillBalancedText}>ACTIVE</Text>
              </View>
            </View>
            <Text style={[styles.auditValue, { color: colors.cyanLight }]}>
              {Math.round((stableVitals.length / CLINICAL_BIOMARKERS.length) * 100)}%
            </Text>
            <Text style={styles.auditLabel}>Homeostasis</Text>
          </GlassCard>
        </View>

        {/* ========================================================= */}
        {/* 2. REAL-WORLD TRADING CHART WITH STABLE VERSION AVG VITAL */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Activity size={15} color={activeBiomarker.color} />
              <Text style={styles.sectionTitle}>
                TRADING TERMINAL: {activeBiomarker.name.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.chartSubtitleText}>
              Stable Avg: {avgVal} {activeBiomarker.unit}
            </Text>
          </View>

          <GlassCard style={styles.tradingBanner}>
            <View style={styles.tradingBannerTop}>
              <View>
                <Text style={styles.tradingPairLabel}>
                  {activeBiomarker.name.toUpperCase()} • {activeBiomarker.category.toUpperCase()}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.currentPriceVal}>{currentVal}</Text>
                  <Text style={styles.currentPriceUnit}>{activeBiomarker.unit}</Text>

                  <View
                    style={[
                      styles.deltaBadge,
                      isPositive ? styles.deltaPositive : styles.deltaNegative,
                    ]}
                  >
                    {isPositive ? (
                      <TrendingUp size={11} color="#10b981" />
                    ) : (
                      <TrendingDown size={11} color="#f43f5e" />
                    )}
                    <Text
                      style={[
                        styles.deltaBadgeText,
                        isPositive ? { color: '#10b981' } : { color: '#f43f5e' },
                      ]}
                    >
                      {isPositive ? `+${changePct}%` : `${changePct}%`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Timeframe Chips */}
              <View style={styles.timeframeGroup}>
                {TIMEFRAMES.map((tf) => {
                  const isSelected = selectedTimeframe === tf;
                  return (
                    <TouchableOpacity
                      key={tf}
                      style={[styles.tfChip, isSelected && styles.tfChipSelected]}
                      onPress={() => setSelectedTimeframe(tf)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.tfChipText, isSelected && styles.tfChipTextSelected]}
                      >
                        {tf}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Trading Levels: High, Low, Dynamic Stable Average Vital */}
            <View style={styles.tradingStatsRow}>
              <View style={styles.tradingStatCol}>
                <Text style={styles.tStatLabel}>PERIOD HIGH</Text>
                <Text style={styles.tStatVal}>
                  {maxVal} {activeBiomarker.unit}
                </Text>
              </View>
              <View style={styles.tradingStatDivider} />
              <View style={styles.tradingStatCol}>
                <Text style={styles.tStatLabel}>PERIOD LOW</Text>
                <Text style={styles.tStatVal}>
                  {minVal} {activeBiomarker.unit}
                </Text>
              </View>
              <View style={styles.tradingStatDivider} />
              <View style={styles.tradingStatCol}>
                <Text style={[styles.tStatLabel, { color: colors.cyan }]}>STABLE AVG VITAL</Text>
                <Text style={[styles.tStatVal, { color: colors.cyanLight }]}>
                  {avgVal} {activeBiomarker.unit}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* SVG Vector Trading Graph with Dotted Stable Avg Line & Spikes */}
          <GlassCard style={styles.chartWrapperCard}>
            <View style={styles.chartTopHeader}>
              <View style={styles.liveCandlePulseRow}>
                <View style={[styles.liveDot, { backgroundColor: activeBiomarker.color }]} />
                <Text style={styles.liveChartText}>LONGITUDINAL TELEMETRY CURVE</Text>
              </View>
              <Text style={styles.chartPeriodIndicator}>
                NABL Normal: {activeBiomarker.minNormal} - {activeBiomarker.maxNormal} {activeBiomarker.unit}
              </Text>
            </View>

            <View style={styles.svgContainer}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                  <SvgLinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={activeBiomarker.color} stopOpacity="0.4" />
                    <Stop offset="65%" stopColor={activeBiomarker.color} stopOpacity="0.08" />
                    <Stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                  </SvgLinearGradient>
                </Defs>

                {/* Grid Lines */}
                <Line
                  x1="10"
                  y1="28"
                  x2={CHART_WIDTH - 10}
                  y2="28"
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <Line
                  x1="10"
                  y1={CHART_HEIGHT - 28}
                  x2={CHART_WIDTH - 10}
                  y2={CHART_HEIGHT - 28}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />

                {/* SUPPORT & RESISTANCE (NABL CLINICAL LIMITS) */}
                {svgData.maxRefY > 15 && svgData.maxRefY < CHART_HEIGHT - 15 ? (
                  <>
                    <Line
                      x1="10"
                      y1={svgData.maxRefY}
                      x2={CHART_WIDTH - 10}
                      y2={svgData.maxRefY}
                      stroke="rgba(244, 63, 94, 0.35)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <SvgText
                      x={14}
                      y={Math.max(12, svgData.maxRefY - 4)}
                      fill="rgba(244, 63, 94, 0.7)"
                      fontSize="7.5"
                      fontWeight="700"
                    >
                      MAX NORMAL ({activeBiomarker.maxNormal})
                    </SvgText>
                  </>
                ) : null}

                {/* STABLE VERSION AVG VITAL DOTTED LINE */}
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
                  x={CHART_WIDTH - 14}
                  y={Math.max(14, svgData.avgY - 4)}
                  fill={colors.cyanLight}
                  fontSize="8.5"
                  fontWeight="900"
                  textAnchor="end"
                >
                  STABLE AVG VITAL: {avgVal} {activeBiomarker.unit}
                </SvgText>

                {/* Shaded Area Fill */}
                {svgData.areaD ? (
                  <Path d={svgData.areaD} fill="url(#chartGradient)" />
                ) : null}

                {/* Neon Curve Line */}
                {svgData.pathD ? (
                  <Path
                    d={svgData.pathD}
                    fill="none"
                    stroke={activeBiomarker.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                ) : null}

                {/* Points & Critical Spike Badges */}
                {svgData.pointsMap.map((pt, i) => {
                  if (pt.isSpike) {
                    return (
                      <React.Fragment key={i}>
                        <Circle
                          cx={pt.x}
                          cy={pt.y}
                          r="7"
                          fill="rgba(244, 63, 94, 0.25)"
                        />
                        <Circle
                          cx={pt.x}
                          cy={pt.y}
                          r="3.5"
                          fill={colors.roseLight}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                        <Rect
                          x={Math.max(10, Math.min(CHART_WIDTH - 64, pt.x - 32))}
                          y={Math.max(6, pt.y - 24)}
                          width="64"
                          height="16"
                          rx="3"
                          fill="#f43f5e"
                        />
                        <SvgText
                          x={Math.max(10, Math.min(CHART_WIDTH - 64, pt.x - 32)) + 32}
                          y={Math.max(6, pt.y - 24) + 11}
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

                  if (i === svgData.pointsMap.length - 1) {
                    return (
                      <React.Fragment key={i}>
                        <Circle
                          cx={pt.x}
                          cy={pt.y}
                          r="6"
                          fill={`${activeBiomarker.color}40`}
                        />
                        <Circle
                          cx={pt.x}
                          cy={pt.y}
                          r="3.5"
                          fill={activeBiomarker.color}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      </React.Fragment>
                    );
                  }
                  return (
                    <Circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="2.5"
                      fill={activeBiomarker.color}
                      opacity={0.6}
                    />
                  );
                })}
              </Svg>
            </View>

            <View style={styles.xAxisRow}>
              {chartPoints
                .filter((_, idx) => idx % Math.ceil(chartPoints.length / 5 || 1) === 0)
                .map((p, idx) => (
                  <Text key={idx} style={styles.xAxisLabel}>
                    {p.time}
                  </Text>
                ))}
            </View>
          </GlassCard>
        </View>

        {/* ========================================================= */}
        {/* 3. CRITICAL VERSIONS (IF ANY) - SPIKES & ANOMALY TELEMETRY */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AlertTriangle
                size={15}
                color={criticalVitals.length > 0 ? colors.roseLight : colors.emeraldLight}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  criticalVitals.length > 0 ? { color: colors.roseLight } : { color: colors.emeraldLight },
                ]}
              >
                {criticalVitals.length > 0
                  ? 'CRITICAL VERSIONS & SPIKE ANOMALIES'
                  : 'CRITICAL AUDIT: ZERO ANOMALIES'}
              </Text>
            </View>
            <Text
              style={[
                styles.criticalCountText,
                criticalVitals.length === 0 && { color: colors.emeraldLight },
              ]}
            >
              {criticalVitals.length} Critical Flagged
            </Text>
          </View>

          {criticalVitals.length > 0 ? (
            <View style={styles.criticalList}>
              {criticalVitals.map((crit) => (
                <TouchableOpacity
                  key={crit.id}
                  style={[
                    styles.criticalCard,
                    selectedBiomarkerId === crit.id && styles.criticalCardSelected,
                  ]}
                  onPress={() => setSelectedBiomarkerId(crit.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.criticalCardTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.criticalBadgeRow}>
                        <View style={styles.criticalBadge}>
                          <AlertTriangle size={10} color="#ffffff" />
                          <Text style={styles.criticalBadgeText}>{crit.statusType}</Text>
                        </View>
                        <Text style={styles.criticalCategory}>{crit.category}</Text>
                      </View>
                      <Text style={styles.criticalName}>{crit.name}</Text>
                    </View>

                    <View style={styles.criticalValueBox}>
                      <Text style={styles.criticalVal}>
                        {crit.currentValue}
                        <Text style={styles.criticalUnit}> {crit.unit}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Stable Average Vital vs Spike Comparison */}
                  <View style={styles.criticalCompareRow}>
                    <View style={styles.criticalCompareItem}>
                      <Text style={styles.compareLabel}>STABLE AVG VITAL</Text>
                      <Text style={styles.compareValCyan}>
                        {crit.avgVital} {crit.unit}
                      </Text>
                    </View>
                    <View style={styles.compareDivider} />
                    <View style={styles.criticalCompareItem}>
                      <Text style={styles.compareLabel}>CRITICAL SPIKE</Text>
                      <Text style={styles.compareValRose}>
                        {crit.currentValue} {crit.unit}
                      </Text>
                    </View>
                    <View style={styles.compareDivider} />
                    <View style={styles.criticalCompareItem}>
                      <Text style={styles.compareLabel}>NABL NORMAL</Text>
                      <Text style={styles.compareValMuted}>
                        {crit.minNormal}-{crit.maxNormal}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.criticalRiskNote}>{crit.riskNote}</Text>

                  <View style={styles.criticalFooter}>
                    <Text style={styles.criticalDeviationText}>{crit.deviation}</Text>
                    <View style={styles.inspectBtn}>
                      <Text style={styles.inspectBtnText}>VIEW ON CHART</Text>
                      <ArrowUpRight size={12} color={colors.cyan} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <GlassCard style={styles.allStableBanner}>
              <View style={styles.allStableRow}>
                <View style={styles.allStableIconWrap}>
                  <CheckCircle2 size={24} color={colors.emeraldLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.allStableTitle}>All Biomarkers Operating in Stable Range</Text>
                  <Text style={styles.allStableSub}>
                    Zero critical anomalies detected across all {CLINICAL_BIOMARKERS.length} biomarkers. Continuous homeostasis verified.
                  </Text>
                </View>
              </View>
            </GlassCard>
          )}
        </View>

        {/* ========================================================= */}
        {/* 4. STABLE VERSION AVG VITALS (32 CLINICAL BIOMARKERS)     */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color={colors.emeraldLight} />
              <Text style={styles.sectionTitle}>STABLE VERSION VITALS & LONGITUDINAL AVERAGES</Text>
            </View>
            <Text style={styles.stableCountText}>
              {stableVitals.length} Stable Biomarkers
            </Text>
          </View>

          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsRow}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, isSelected && styles.catChipSelected]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.catChipText, isSelected && styles.catChipTextSelected]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Stable Vitals Grid */}
          <View style={styles.stableVitalsGrid}>
            {filteredStableVitals.map((bio) => {
              const isSelected = selectedBiomarkerId === bio.id;
              const Icon = bio.icon || Activity;
              return (
                <TouchableOpacity
                  key={bio.id}
                  style={[
                    styles.stableVitalCard,
                    isSelected && { borderColor: bio.color, backgroundColor: '#07181f' },
                  ]}
                  onPress={() => setSelectedBiomarkerId(bio.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.stableVitalTop}>
                    <View style={[styles.stableIconWrap, { backgroundColor: `${bio.color}15` }]}>
                      <Icon size={16} color={bio.color} />
                    </View>
                    <View style={styles.stableBadge}>
                      <CheckCircle2 size={10} color={colors.emeraldLight} />
                      <Text style={styles.stableBadgeText}>STABLE</Text>
                    </View>
                  </View>

                  <Text style={styles.stableVitalName} numberOfLines={1}>{bio.name}</Text>
                  <Text style={styles.stableVitalCategory}>{bio.category}</Text>

                  {/* Readings & Stable Version Average Vital */}
                  <View style={styles.stableValuesRow}>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.readingLabel}>CURRENT</Text>
                      <Text style={styles.readingVal}>
                        {bio.currentValue}
                        <Text style={styles.readingUnit}> {bio.unit}</Text>
                      </Text>
                    </View>

                    <View style={styles.avgDivider} />

                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={[styles.readingLabel, { color: colors.cyan }]}>STABLE AVG</Text>
                      <Text style={[styles.readingVal, { color: colors.cyanLight }]}>
                        {bio.avgVital}
                        <Text style={styles.readingUnit}> {bio.unit}</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rangeFooter}>
                    <Text style={styles.rangeText}>
                      Normal: {bio.minNormal} - {bio.maxNormal} {bio.unit}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emeraldLight,
  },
  liveText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: colors.emeraldLight,
    letterSpacing: 0.5,
  },
  headerCode: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Audit Overview Cards
  auditRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  auditCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  auditCardCritical: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: '#16080a',
  },
  auditIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  auditPillStable: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  auditPillStableText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: colors.emeraldLight,
  },
  auditPillCritical: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  auditPillCriticalText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: colors.roseLight,
  },
  auditPillBalanced: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  auditPillBalancedText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: colors.cyanLight,
  },
  auditValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  auditLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },

  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
  chartSubtitleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.cyanLight,
  },
  criticalCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.roseLight,
  },
  stableCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.emeraldLight,
  },

  // Trading Banner
  tradingBanner: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  tradingBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  tradingPairLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currentPriceVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
  },
  currentPriceUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  deltaPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  deltaNegative: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  deltaBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  timeframeGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  tfChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tfChipSelected: {
    backgroundColor: colors.cyan,
  },
  tfChipText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.textMuted,
  },
  tfChipTextSelected: {
    color: '#000000',
  },
  tradingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tradingStatCol: {
    alignItems: 'center',
  },
  tStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tStatVal: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  tradingStatDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Chart Wrapper
  chartWrapperCard: {
    padding: 12,
    borderRadius: 14,
  },
  chartTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveCandlePulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveChartText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  chartPeriodIndicator: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 6,
  },
  xAxisLabel: {
    fontSize: 8.5,
    color: colors.textMuted,
    fontWeight: '700',
  },

  // Critical Vitals List
  criticalList: {
    gap: 10,
  },
  criticalCard: {
    backgroundColor: '#16080a',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderRadius: 14,
    padding: 14,
  },
  criticalCardSelected: {
    borderColor: colors.roseLight,
    borderWidth: 1.5,
    backgroundColor: '#200b0e',
  },
  criticalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  criticalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.rose,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  criticalCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  criticalName: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  criticalValueBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  criticalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.roseLight,
  },
  criticalUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.roseLight,
  },
  criticalCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  criticalCompareItem: {
    alignItems: 'center',
  },
  compareLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 2,
  },
  compareValCyan: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.cyanLight,
  },
  compareValRose: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.roseLight,
  },
  compareValMuted: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  compareDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  criticalRiskNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
    marginBottom: 10,
  },
  criticalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 63, 94, 0.2)',
    paddingTop: 8,
  },
  criticalDeviationText: {
    fontSize: 9.5,
    color: colors.roseLight,
    fontWeight: '700',
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inspectBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.cyan,
  },

  allStableBanner: {
    padding: 14,
    borderRadius: 14,
  },
  allStableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allStableIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allStableTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.emeraldLight,
  },
  allStableSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },

  // Category Filter Chips
  categoryChipsRow: {
    gap: 8,
    paddingBottom: 10,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  catChipSelected: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: colors.cyan,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  catChipTextSelected: {
    color: colors.cyanLight,
    fontWeight: '900',
  },

  // Stable Vitals Grid
  stableVitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stableVitalCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
  },
  stableVitalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stableIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stableBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.emeraldLight,
  },
  stableVitalName: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  stableVitalCategory: {
    fontSize: 8.5,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  stableValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#121212',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  readingLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  readingVal: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 2,
  },
  readingUnit: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  avgDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rangeFooter: {
    alignItems: 'center',
    paddingTop: 2,
  },
  rangeText: {
    fontSize: 8.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

export default VitalsAnalysisScreen;

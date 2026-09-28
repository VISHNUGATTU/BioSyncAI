import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Activity,
  Heart,
  Droplets,
  Zap,
  ShieldAlert,
  Dna,
  Sparkles,
  HeartPulse,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import GlassCard from './GlassCard';

export const VitalsFormSection = ({
  vitals = {},
  updateMetric,
  onQuickFill,
}) => {
  const [activeTab, setActiveTab] = useState('physical');

  const tabs = [
    { id: 'physical', label: 'Body', icon: Zap },
    { id: 'vitals', label: 'Vitals & BP', icon: Heart },
    { id: 'hematology', label: 'CBC & Blood', icon: Droplets },
    { id: 'metabolic', label: 'Glycemic', icon: Activity },
    { id: 'lipids', label: 'Lipid Panel', icon: HeartPulse },
    { id: 'organs', label: 'Organs & Horm', icon: ShieldAlert },
    { id: 'micro', label: 'Vitamins & Gut', icon: Dna },
  ];

  const renderInputField = (label, category, field, unit, subField = null, keyboardType = 'numeric') => {
    const rawVal = subField
      ? vitals[category]?.[field]?.[subField]
      : vitals[category]?.[field];
    const val = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';

    return (
      <View style={styles.inputGroup} key={`${category}-${field}-${subField || ''}`}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>{label}</Text>
          {unit ? <Text style={styles.unitBadge}>{unit}</Text> : null}
        </View>
        <TextInput
          style={styles.textInput}
          value={val}
          onChangeText={(txt) => updateMetric(category, field, txt, subField)}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
        />
      </View>
    );
  };

  return (
    <GlassCard style={styles.container}>
      {/* Header with Quick Fill Button */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Activity size={18} color={colors.primaryLight} />
            <Text style={styles.title}>Clinical Vitals & Biomarkers</Text>
          </View>
          <Text style={styles.subtitle}>
            Physiological baseline for AI diagnostic models
          </Text>
        </View>

        {onQuickFill && (
          <TouchableOpacity
            style={styles.quickFillBtn}
            onPress={onQuickFill}
            activeOpacity={0.8}
          >
            <Sparkles size={14} color="#fff" />
            <Text style={styles.quickFillText}>Auto-Fill Norms</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Domain Navigation Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.7}
            >
              <Icon size={14} color={isActive ? colors.primaryLight : colors.textMuted} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab 1: Anthropometrics & Body Composition */}
      {activeTab === 'physical' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField('Height', 'bodyMetrics', 'heightCm', 'cm')}
            {renderInputField('Weight', 'bodyMetrics', 'weightKg', 'kg')}
          </View>

          <View style={styles.row}>
            {renderInputField('BMI (Auto)', 'bodyMetrics', 'bmi', 'kg/m²')}
            {renderInputField('Body Fat', 'bodyMetrics', 'bodyFatPercentage', '%')}
          </View>

          <View style={styles.row}>
            {renderInputField('Muscle Mass', 'bodyMetrics', 'muscleMassKg', 'kg')}
            {renderInputField('Bone Mass', 'bodyMetrics', 'boneMassKg', 'kg')}
          </View>

          <View style={styles.row}>
            {renderInputField('Visceral Fat', 'bodyMetrics', 'visceralFatIndex', '1-59')}
            {renderInputField('Water Ratio', 'bodyMetrics', 'waterPercentage', '%')}
          </View>

          <Text style={styles.subSectionTitle}>Body Circumference</Text>
          <View style={styles.row}>
            {renderInputField('Waist', 'bodyMetrics', 'measurements', 'cm', 'waistCm')}
            {renderInputField('Hip', 'bodyMetrics', 'measurements', 'cm', 'hipCm')}
            {renderInputField('Neck', 'bodyMetrics', 'measurements', 'cm', 'neckCm')}
          </View>
        </View>
      )}

      {/* Tab 2: Vitals Signs & Hemodynamics */}
      {activeTab === 'vitals' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField('BP Systolic', 'cardiovascularRisk', 'systolic', 'mmHg')}
            {renderInputField('BP Diastolic', 'cardiovascularRisk', 'diastolic', 'mmHg')}
          </View>

          <View style={styles.row}>
            {renderInputField('MAP (Auto)', 'cardiovascularRisk', 'meanArterialPressure', 'mmHg')}
            {renderInputField('Pulse Pressure', 'cardiovascularRisk', 'pulsePressure', 'mmHg')}
          </View>

          <View style={styles.row}>
            {renderInputField('Resting Pulse', 'continuousMetrics', 'restingHeartRate', 'bpm')}
            {renderInputField('SpO2 Oxygen', 'continuousMetrics', 'oxygenSaturationSpO2', '%')}
          </View>

          <View style={styles.row}>
            {renderInputField('Body Temp', 'continuousMetrics', 'basalBodyTemperatureF', '°F')}
            {renderInputField('HRV Index', 'continuousMetrics', 'hrv', 'ms')}
          </View>

          <View style={styles.row}>
            {renderInputField('VO2 Max', 'continuousMetrics', 'vo2Max', 'mL/kg/min')}
            {renderInputField('Daily Steps', 'continuousMetrics', 'dailyStepCount', 'steps')}
          </View>

          <View style={styles.row}>
            {renderInputField('Active Calorie', 'continuousMetrics', 'activeCaloriesBurned', 'kcal')}
          </View>
        </View>
      )}

      {/* Tab 3: Complete Blood Count & Hematology */}
      {activeTab === 'hematology' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField('Hemoglobin', 'hematology', 'hemoglobin', 'g/dL')}
            {renderInputField('Hematocrit', 'hematology', 'hematocrit', '%')}
          </View>

          <View style={styles.row}>
            {renderInputField('RBC Count', 'hematology', 'rbc', '10⁶/µL')}
            {renderInputField('Platelet Count', 'hematology', 'platelets', '10³/µL')}
          </View>

          <View style={styles.row}>
            {renderInputField('WBC Count', 'hematology', 'wbc', '10³/µL')}
            {renderInputField('RDW Width', 'hematology', 'rdw', '%')}
          </View>

          <Text style={styles.subSectionTitle}>WBC Differential & Immune Indices</Text>
          <View style={styles.row}>
            {renderInputField('Neutrophils', 'hematology', 'neutrophilsPercent', '%')}
            {renderInputField('Lymphocytes', 'hematology', 'lymphocytesPercent', '%')}
          </View>

          <View style={styles.row}>
            {renderInputField('Monocytes', 'hematology', 'monocytesPercent', '%')}
            {renderInputField('Eosinophils', 'hematology', 'eosinophilsPercent', '%')}
          </View>

          <View style={styles.row}>
            {renderInputField('NLR Ratio (Auto)', 'hematology', 'nlr', 'ratio')}
            {renderInputField('SII Index (Auto)', 'hematology', 'sii', 'index')}
          </View>
        </View>
      )}

      {/* Tab 4: Glycemic & Metabolic Health */}
      {activeTab === 'metabolic' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField('Fasting Glucose', 'metabolicHealth', 'glucoseFasting', 'mg/dL')}
            {renderInputField('Post-Prandial Gluc', 'metabolicHealth', 'glucosePostPrandial', 'mg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('HbA1c', 'metabolicHealth', 'hba1c', '%')}
            {renderInputField('Fasting Insulin', 'metabolicHealth', 'fastingInsulin', 'µIU/mL')}
          </View>

          <View style={styles.row}>
            {renderInputField('HOMA-IR (Auto)', 'metabolicHealth', 'homaIR', 'index')}
            {renderInputField('TyG Index (Auto)', 'metabolicHealth', 'tygIndex', 'index')}
          </View>

          <View style={styles.row}>
            {renderInputField('eAG (Auto)', 'metabolicHealth', 'estimatedAvgGlucose', 'mg/dL')}
            {renderInputField('Blood Ketones', 'metabolicHealth', 'bloodKetones', 'mmol/L')}
          </View>

          <View style={styles.row}>
            {renderInputField('C-Peptide', 'metabolicHealth', 'cPeptide', 'ng/mL')}
            {renderInputField('Fructosamine', 'metabolicHealth', 'fructosamine', 'µmol/L')}
          </View>

          <View style={styles.row}>
            {renderInputField('Leptin', 'metabolicHealth', 'leptin', 'ng/mL')}
            {renderInputField('Adiponectin', 'metabolicHealth', 'adiponectin', 'µg/mL')}
          </View>
        </View>
      )}

      {/* Tab 5: Lipid & Cardiovascular Risk */}
      {activeTab === 'lipids' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField('Total Cholesterol', 'cardiovascularRisk', 'totalCholesterol', 'mg/dL')}
            {renderInputField('LDL Cholesterol', 'cardiovascularRisk', 'ldlCholesterol', 'mg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('HDL Cholesterol', 'cardiovascularRisk', 'hdlCholesterol', 'mg/dL')}
            {renderInputField('Triglycerides', 'cardiovascularRisk', 'triglycerides', 'mg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Non-HDL (Auto)', 'cardiovascularRisk', 'nonHdlCholesterol', 'mg/dL')}
            {renderInputField('AIP Index (Auto)', 'cardiovascularRisk', 'atherogenicIndexPlasma', 'index')}
          </View>

          <View style={styles.row}>
            {renderInputField('Apolipoprotein A1', 'cardiovascularRisk', 'apolipoproteinA1', 'mg/dL')}
            {renderInputField('Apolipoprotein B', 'cardiovascularRisk', 'apolipoproteinB', 'mg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('ApoB/A1 (Auto)', 'cardiovascularRisk', 'apoBApoA1Ratio', 'ratio')}
            {renderInputField('Homocysteine', 'cardiovascularRisk', 'homocysteine', 'µmol/L')}
          </View>

          <View style={styles.row}>
            {renderInputField('Lipoprotein(a)', 'cardiovascularRisk', 'lipoproteinA', 'nmol/L')}
            {renderInputField('hs-Troponin I', 'cardiovascularRisk', 'hsTroponinI', 'ng/mL')}
          </View>
        </View>
      )}

      {/* Tab 6: Organs, Inflammation & Hormones */}
      {activeTab === 'organs' && (
        <View style={styles.formGrid}>
          <Text style={styles.subSectionTitle}>Renal & Hepatic Functions</Text>
          <View style={styles.row}>
            {renderInputField('Serum Creatinine', 'organFunction', 'creatinine', 'mg/dL')}
            {renderInputField('eGFR', 'organFunction', 'egfr', 'mL/min')}
          </View>

          <View style={styles.row}>
            {renderInputField('BUN (Urea)', 'organFunction', 'bun', 'mg/dL')}
            {renderInputField('BUN/Cr (Auto)', 'organFunction', 'bunCreatinineRatio', 'ratio')}
          </View>

          <View style={styles.row}>
            {renderInputField('AST / SGOT', 'organFunction', 'astSgot', 'U/L')}
            {renderInputField('ALT / SGPT', 'organFunction', 'altSgpt', 'U/L')}
          </View>

          <View style={styles.row}>
            {renderInputField('De Ritis (Auto)', 'organFunction', 'deRitisRatio', 'ratio')}
            {renderInputField('GGT Enzyme', 'organFunction', 'ggt', 'U/L')}
          </View>

          <View style={styles.row}>
            {renderInputField('ALP Enzyme', 'organFunction', 'alp', 'U/L')}
            {renderInputField('Uric Acid', 'organFunction', 'uricAcid', 'mg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Total Protein', 'organFunction', 'totalProtein', 'g/dL')}
            {renderInputField('Serum Albumin', 'organFunction', 'albumin', 'g/dL')}
          </View>

          <Text style={styles.subSectionTitle}>Serum Electrolytes</Text>
          <View style={styles.row}>
            {renderInputField('Sodium (Na+)', 'organFunction', 'electrolytes', 'mEq/L', 'sodium')}
            {renderInputField('Potassium (K+)', 'organFunction', 'electrolytes', 'mEq/L', 'potassium')}
          </View>

          <View style={styles.row}>
            {renderInputField('Chloride (Cl-)', 'organFunction', 'electrolytes', 'mEq/L', 'chloride')}
            {renderInputField('Bicarbonate', 'organFunction', 'electrolytes', 'mEq/L', 'bicarbonate')}
          </View>

          <Text style={styles.subSectionTitle}>Immunology & Inflammation</Text>
          <View style={styles.row}>
            {renderInputField('hs-CRP', 'immunology', 'hsCRP', 'mg/L')}
            {renderInputField('ESR Rate', 'immunology', 'esr', 'mm/hr')}
          </View>

          <View style={styles.row}>
            {renderInputField('Serum Ferritin', 'immunology', 'ferritin', 'ng/mL')}
            {renderInputField('Interleukin-6', 'immunology', 'interleukin6', 'pg/mL')}
          </View>

          <Text style={styles.subSectionTitle}>Endocrine (Hormones)</Text>
          <View style={styles.row}>
            {renderInputField('TSH Thyroid', 'hormones', 'tsh', 'µIU/mL')}
            {renderInputField('Morning Cortisol', 'hormones', 'cortisolFasting', 'µg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Free T3', 'hormones', 'freeT3', 'pg/mL')}
            {renderInputField('Free T4', 'hormones', 'freeT4', 'ng/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Total Testosterone', 'hormones', 'testosteroneTotal', 'ng/dL')}
            {renderInputField('Free Testosterone', 'hormones', 'testosteroneFree', 'pg/mL')}
          </View>
        </View>
      )}

      {/* Tab 7: Micronutrients & Nutrigenomics */}
      {activeTab === 'micro' && (
        <View style={styles.formGrid}>
          <Text style={styles.subSectionTitle}>Micronutrients & Vitamins</Text>
          <View style={styles.row}>
            {renderInputField('Vitamin D3', 'micronutrients', 'vitaminD3', 'ng/mL')}
            {renderInputField('Vitamin B12', 'micronutrients', 'vitaminB12', 'pg/mL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Total Calcium', 'micronutrients', 'calciumTotal', 'mg/dL')}
            {renderInputField('Serum Iron', 'micronutrients', 'ironTotal', 'µg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Magnesium', 'micronutrients', 'magnesium', 'mg/dL')}
            {renderInputField('Serum Zinc', 'micronutrients', 'zinc', 'µg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Serum Folate', 'micronutrients', 'folate', 'ng/mL')}
            {renderInputField('Omega-3 Index', 'micronutrients', 'omega3Index', '%')}
          </View>

          <Text style={styles.subSectionTitle}>Nutrigenomics & Gut Flora</Text>
          {/* MTHFR Status Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MTHFR Status</Text>
            <View style={styles.optionRow}>
              {['Negative', 'Heterozygous', 'Homozygous'].map((opt) => {
                const isSel = vitals.geneticAndGut?.mthfrMutationStatus === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pickerChip, isSel && styles.pickerChipActive]}
                    onPress={() => updateMetric('geneticAndGut', 'mthfrMutationStatus', opt)}
                  >
                    <Text style={[styles.pickerText, isSel && styles.pickerTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* APOE Genotype Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>APOE Genotype</Text>
            <View style={styles.optionRow}>
              {['E2/E3', 'E3/E3', 'E3/E4', 'E4/E4'].map((opt) => {
                const isSel = vitals.geneticAndGut?.apoeGenotype === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pickerChip, isSel && styles.pickerChipActive]}
                    onPress={() => updateMetric('geneticAndGut', 'apoeGenotype', opt)}
                  >
                    <Text style={[styles.pickerText, isSel && styles.pickerTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.row}>
            {renderInputField('Gut Diversity', 'geneticAndGut', 'gutMicrobiomeDiversityScore', '0-100')}
            {renderInputField('F/B Ratio', 'geneticAndGut', 'firmicutesToBacteroidetesRatio', 'ratio')}
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  quickFillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: colors.primaryLight,
  },
  tabText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  formGrid: {
    gap: 8,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textCyan,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  unitBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryLight,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  textInput: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  pickerChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pickerChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: colors.primaryLight,
  },
  pickerText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  pickerTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
});

export default VitalsFormSection;

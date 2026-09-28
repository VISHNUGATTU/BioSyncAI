import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Activity,
  Heart,
  Droplets,
  Zap,
  ShieldAlert,
  Dna,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import GlassCard from './GlassCard';

export const VitalsFormSection = ({
  vitals,
  updateMetric,
  onQuickFill,
}) => {
  const [activeTab, setActiveTab] = useState('physical');

  const tabs = [
    { id: 'physical', label: 'Body & Anthro', icon: Zap },
    { id: 'vitals', label: 'Vitals & Card', icon: Heart },
    { id: 'metabolic', label: 'Glycemic', icon: Droplets },
    { id: 'lipids', label: 'Lipid Panel', icon: Activity },
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
            Comprehensive physiological baseline per clinical schema (Vitals.js)
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
            {renderInputField('BMI (Auto-Calc)', 'bodyMetrics', 'bmi', 'kg/m²')}
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

      {/* Tab 2: Vitals Signs & Cardiovascular Basic */}
      {activeTab === 'vitals' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField('BP Systolic', 'cardiovascularRisk', 'systolic', 'mmHg')}
            {renderInputField('BP Diastolic', 'cardiovascularRisk', 'diastolic', 'mmHg')}
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

      {/* Tab 3: Glycemic & Metabolic Health */}
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
            {renderInputField('C-Peptide', 'metabolicHealth', 'cPeptide', 'ng/mL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Fructosamine', 'metabolicHealth', 'fructosamine', 'µmol/L')}
            {renderInputField('Leptin', 'metabolicHealth', 'leptin', 'ng/mL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Ghrelin', 'metabolicHealth', 'ghrelin', 'pg/mL')}
            {renderInputField('Adiponectin', 'metabolicHealth', 'adiponectin', 'µg/mL')}
          </View>
        </View>
      )}

      {/* Tab 4: Lipid & Cardiovascular Risk */}
      {activeTab === 'lipids' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField('Total Cholesterol', 'cardiovascularRisk', 'totalCholesterol', 'mg/dL')}
            {renderInputField('LDL Cholesterol', 'cardiovascularRisk', 'ldlCholesterol', 'mg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('HDL Cholesterol', 'cardiovascularRisk', 'hdlCholesterol', 'mg/dL')}
            {renderInputField('VLDL Cholesterol', 'cardiovascularRisk', 'vldlCholesterol', 'mg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Triglycerides', 'cardiovascularRisk', 'triglycerides', 'mg/dL')}
            {renderInputField('Homocysteine', 'cardiovascularRisk', 'homocysteine', 'µmol/L')}
          </View>

          <View style={styles.row}>
            {renderInputField('Apolipoprotein A1', 'cardiovascularRisk', 'apolipoproteinA1', 'mg/dL')}
            {renderInputField('Apolipoprotein B', 'cardiovascularRisk', 'apolipoproteinB', 'mg/dL')}
          </View>

          <View style={styles.row}>
            {renderInputField('Lipoprotein(a)', 'cardiovascularRisk', 'lipoproteinA', 'nmol/L')}
          </View>
        </View>
      )}

      {/* Tab 5: Organs, Inflammation & Hormones */}
      {activeTab === 'organs' && (
        <View style={styles.formGrid}>
          <Text style={styles.subSectionTitle}>Renal & Hepatic Functions</Text>
          <View style={styles.row}>
            {renderInputField('Serum Creatinine', 'organFunction', 'creatinine', 'mg/dL')}
            {renderInputField('eGFR', 'organFunction', 'egfr', 'mL/min')}
          </View>

          <View style={styles.row}>
            {renderInputField('Uric Acid', 'organFunction', 'uricAcid', 'mg/dL')}
            {renderInputField('AST / SGOT', 'organFunction', 'astSgot', 'U/L')}
          </View>

          <View style={styles.row}>
            {renderInputField('ALT / SGPT', 'organFunction', 'altSgpt', 'U/L')}
            {renderInputField('GGT Enzyme', 'organFunction', 'ggt', 'U/L')}
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

          <View style={styles.row}>
            {renderInputField('Estradiol', 'hormones', 'estradiol', 'pg/mL')}
            {renderInputField('Progesterone', 'hormones', 'progesterone', 'ng/mL')}
          </View>

          <View style={styles.row}>
            {renderInputField('DHEA-S', 'hormones', 'dheas', 'µg/dL')}
          </View>
        </View>
      )}

      {/* Tab 6: Micronutrients & Nutrigenomics */}
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
            <Text style={styles.inputLabel}>MTHFR Mutation Status</Text>
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
            {renderInputField('Gut Diversity Score', 'geneticAndGut', 'gutMicrobiomeDiversityScore', '0-100')}
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
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
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
    color: colors.textMuted,
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.textCyan,
    marginTop: 10,
    marginBottom: 4,
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
    color: colors.textSecondary,
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
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
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
    color: colors.textMuted,
    fontWeight: '600',
  },
  pickerTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
});

export default VitalsFormSection;

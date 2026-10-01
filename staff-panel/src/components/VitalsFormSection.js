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
    {
      id: 'physical',
      label: 'Body',
      icon: Zap,
    },
    {
      id: 'vitals',
      label: 'Vitals & BP',
      icon: Heart,
    },
    {
      id: 'hematology',
      label: 'CBC & Blood',
      icon: Droplets,
    },
    {
      id: 'metabolic',
      label: 'Glycemic',
      icon: Activity,
    },
    {
      id: 'lipids',
      label: 'Lipid Panel',
      icon: HeartPulse,
    },
    {
      id: 'organs',
      label: 'Organs & Horm',
      icon: ShieldAlert,
    },
    {
      id: 'micro',
      label: 'Vitamins & Gut',
      icon: Dna,
    },
  ];

  const renderInputField = (
    label,
    category,
    field,
    unit,
    subField = null,
    keyboardType = 'numeric'
  ) => {
    const rawVal = subField
      ? vitals[category]?.[field]?.[subField]
      : vitals[category]?.[field];

    const val =
      rawVal !== undefined && rawVal !== null
        ? String(rawVal)
        : '';

    return (
      <View
        style={styles.inputGroup}
        key={`${category}-${field}-${subField || ''}`}
      >
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>
            {label}
          </Text>

          {unit ? (
            <Text style={styles.unitBadge}>
              {unit}
            </Text>
          ) : null}
        </View>

        <TextInput
          style={styles.textInput}
          value={val}
          onChangeText={(txt) =>
            updateMetric(
              category,
              field,
              txt,
              subField
            )
          }
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          selectionColor={colors.primary}
        />
      </View>
    );
  };

  return (
    <GlassCard style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.headerIcon}>
              <Activity
                size={17}
                color={colors.primaryLight}
                strokeWidth={2.2}
              />
            </View>

            <Text style={styles.title}>
              Clinical Vitals & Biomarkers
            </Text>
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
            <Sparkles
              size={13}
              color={colors.textPrimary}
              strokeWidth={2.2}
            />

            <Text style={styles.quickFillText}>
              Auto-Fill Norms
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DOMAIN NAVIGATION */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabChip,
                isActive &&
                  styles.tabChipActive,
              ]}
              onPress={() =>
                setActiveTab(tab.id)
              }
              activeOpacity={0.7}
            >
              <Icon
                size={14}
                color={
                  isActive
                    ? colors.primaryLight
                    : colors.textMuted
                }
                strokeWidth={2.1}
              />

              <Text
                style={[
                  styles.tabText,
                  isActive &&
                    styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* BODY COMPOSITION */}
      {activeTab === 'physical' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField(
              'Height',
              'bodyMetrics',
              'heightCm',
              'cm'
            )}

            {renderInputField(
              'Weight',
              'bodyMetrics',
              'weightKg',
              'kg'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'BMI (Auto)',
              'bodyMetrics',
              'bmi',
              'kg/m²'
            )}

            {renderInputField(
              'Body Fat',
              'bodyMetrics',
              'bodyFatPercentage',
              '%'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Muscle Mass',
              'bodyMetrics',
              'muscleMassKg',
              'kg'
            )}

            {renderInputField(
              'Bone Mass',
              'bodyMetrics',
              'boneMassKg',
              'kg'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Visceral Fat',
              'bodyMetrics',
              'visceralFatIndex',
              '1-59'
            )}

            {renderInputField(
              'Water Ratio',
              'bodyMetrics',
              'waterPercentage',
              '%'
            )}
          </View>

          <Text style={styles.subSectionTitle}>
            Body Circumference
          </Text>

          <View style={styles.row}>
            {renderInputField(
              'Waist',
              'bodyMetrics',
              'measurements',
              'cm',
              'waistCm'
            )}

            {renderInputField(
              'Hip',
              'bodyMetrics',
              'measurements',
              'cm',
              'hipCm'
            )}

            {renderInputField(
              'Neck',
              'bodyMetrics',
              'measurements',
              'cm',
              'neckCm'
            )}
          </View>
        </View>
      )}

      {/* VITALS & BP */}
      {activeTab === 'vitals' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField(
              'BP Systolic',
              'cardiovascularRisk',
              'systolic',
              'mmHg'
            )}

            {renderInputField(
              'BP Diastolic',
              'cardiovascularRisk',
              'diastolic',
              'mmHg'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'MAP (Auto)',
              'cardiovascularRisk',
              'meanArterialPressure',
              'mmHg'
            )}

            {renderInputField(
              'Pulse Pressure',
              'cardiovascularRisk',
              'pulsePressure',
              'mmHg'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Resting Pulse',
              'continuousMetrics',
              'restingHeartRate',
              'bpm'
            )}

            {renderInputField(
              'SpO2 Oxygen',
              'continuousMetrics',
              'oxygenSaturationSpO2',
              '%'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Body Temp',
              'continuousMetrics',
              'basalBodyTemperatureF',
              '°F'
            )}

            {renderInputField(
              'HRV Index',
              'continuousMetrics',
              'hrv',
              'ms'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'VO2 Max',
              'continuousMetrics',
              'vo2Max',
              'mL/kg/min'
            )}

            {renderInputField(
              'Daily Steps',
              'continuousMetrics',
              'dailyStepCount',
              'steps'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Active Calorie',
              'continuousMetrics',
              'activeCaloriesBurned',
              'kcal'
            )}
          </View>
        </View>
      )}

      {/* CBC & HEMATOLOGY */}
      {activeTab === 'hematology' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField(
              'Hemoglobin',
              'hematology',
              'hemoglobin',
              'g/dL'
            )}

            {renderInputField(
              'Hematocrit',
              'hematology',
              'hematocrit',
              '%'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'RBC Count',
              'hematology',
              'rbc',
              '10⁶/µL'
            )}

            {renderInputField(
              'Platelet Count',
              'hematology',
              'platelets',
              '10³/µL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'WBC Count',
              'hematology',
              'wbc',
              '10³/µL'
            )}

            {renderInputField(
              'RDW Width',
              'hematology',
              'rdw',
              '%'
            )}
          </View>

          <Text style={styles.subSectionTitle}>
            WBC Differential & Immune Indices
          </Text>

          <View style={styles.row}>
            {renderInputField(
              'Neutrophils',
              'hematology',
              'neutrophilsPercent',
              '%'
            )}

            {renderInputField(
              'Lymphocytes',
              'hematology',
              'lymphocytesPercent',
              '%'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Monocytes',
              'hematology',
              'monocytesPercent',
              '%'
            )}

            {renderInputField(
              'Eosinophils',
              'hematology',
              'eosinophilsPercent',
              '%'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'NLR Ratio (Auto)',
              'hematology',
              'nlr',
              'ratio'
            )}

            {renderInputField(
              'SII Index (Auto)',
              'hematology',
              'sii',
              'index'
            )}
          </View>
        </View>
      )}

      {/* GLYCEMIC */}
      {activeTab === 'metabolic' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField(
              'Fasting Glucose',
              'metabolicHealth',
              'glucoseFasting',
              'mg/dL'
            )}

            {renderInputField(
              'Post-Prandial Gluc',
              'metabolicHealth',
              'glucosePostPrandial',
              'mg/dL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'HbA1c',
              'metabolicHealth',
              'hba1c',
              '%'
            )}

            {renderInputField(
              'Fasting Insulin',
              'metabolicHealth',
              'fastingInsulin',
              'µIU/mL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'HOMA-IR (Auto)',
              'metabolicHealth',
              'homaIR',
              'index'
            )}

            {renderInputField(
              'TyG Index (Auto)',
              'metabolicHealth',
              'tygIndex',
              'index'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'eAG (Auto)',
              'metabolicHealth',
              'estimatedAvgGlucose',
              'mg/dL'
            )}

            {renderInputField(
              'Blood Ketones',
              'metabolicHealth',
              'bloodKetones',
              'mmol/L'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'C-Peptide',
              'metabolicHealth',
              'cPeptide',
              'ng/mL'
            )}

            {renderInputField(
              'Fructosamine',
              'metabolicHealth',
              'fructosamine',
              'µmol/L'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Leptin',
              'metabolicHealth',
              'leptin',
              'ng/mL'
            )}

            {renderInputField(
              'Adiponectin',
              'metabolicHealth',
              'adiponectin',
              'µg/mL'
            )}
          </View>
        </View>
      )}

      {/* LIPIDS */}
      {activeTab === 'lipids' && (
        <View style={styles.formGrid}>
          <View style={styles.row}>
            {renderInputField(
              'Total Cholesterol',
              'cardiovascularRisk',
              'totalCholesterol',
              'mg/dL'
            )}

            {renderInputField(
              'LDL Cholesterol',
              'cardiovascularRisk',
              'ldlCholesterol',
              'mg/dL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'HDL Cholesterol',
              'cardiovascularRisk',
              'hdlCholesterol',
              'mg/dL'
            )}

            {renderInputField(
              'Triglycerides',
              'cardiovascularRisk',
              'triglycerides',
              'mg/dL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Non-HDL (Auto)',
              'cardiovascularRisk',
              'nonHdlCholesterol',
              'mg/dL'
            )}

            {renderInputField(
              'AIP Index (Auto)',
              'cardiovascularRisk',
              'atherogenicIndexPlasma',
              'index'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Apolipoprotein A1',
              'cardiovascularRisk',
              'apolipoproteinA1',
              'mg/dL'
            )}

            {renderInputField(
              'Apolipoprotein B',
              'cardiovascularRisk',
              'apolipoproteinB',
              'mg/dL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'ApoB/A1 (Auto)',
              'cardiovascularRisk',
              'apoBApoA1Ratio',
              'ratio'
            )}

            {renderInputField(
              'Homocysteine',
              'cardiovascularRisk',
              'homocysteine',
              'µmol/L'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Lipoprotein(a)',
              'cardiovascularRisk',
              'lipoproteinA',
              'nmol/L'
            )}

            {renderInputField(
              'hs-Troponin I',
              'cardiovascularRisk',
              'hsTroponinI',
              'ng/mL'
            )}
          </View>
        </View>
      )}

      {/* ORGANS & HORMONES */}
      {activeTab === 'organs' && (
        <View style={styles.formGrid}>
          <Text style={styles.subSectionTitle}>
            Renal & Hepatic Functions
          </Text>

          <View style={styles.row}>
            {renderInputField(
              'Serum Creatinine',
              'organFunction',
              'creatinine',
              'mg/dL'
            )}

            {renderInputField(
              'eGFR',
              'organFunction',
              'egfr',
              'mL/min'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'BUN (Urea)',
              'organFunction',
              'bun',
              'mg/dL'
            )}

            {renderInputField(
              'BUN/Cr (Auto)',
              'organFunction',
              'bunCreatinineRatio',
              'ratio'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'AST / SGOT',
              'organFunction',
              'astSgot',
              'U/L'
            )}

            {renderInputField(
              'ALT / SGPT',
              'organFunction',
              'altSgpt',
              'U/L'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'De Ritis (Auto)',
              'organFunction',
              'deRitisRatio',
              'ratio'
            )}

            {renderInputField(
              'GGT Enzyme',
              'organFunction',
              'ggt',
              'U/L'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'ALP Enzyme',
              'organFunction',
              'alp',
              'U/L'
            )}

            {renderInputField(
              'Uric Acid',
              'organFunction',
              'uricAcid',
              'mg/dL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Total Protein',
              'organFunction',
              'totalProtein',
              'g/dL'
            )}

            {renderInputField(
              'Serum Albumin',
              'organFunction',
              'albumin',
              'g/dL'
            )}
          </View>

          <Text style={styles.subSectionTitle}>
            Serum Electrolytes
          </Text>

          <View style={styles.row}>
            {renderInputField(
              'Sodium (Na+)',
              'organFunction',
              'electrolytes',
              'mEq/L',
              'sodium'
            )}

            {renderInputField(
              'Potassium (K+)',
              'organFunction',
              'electrolytes',
              'mEq/L',
              'potassium'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Chloride (Cl-)',
              'organFunction',
              'electrolytes',
              'mEq/L',
              'chloride'
            )}

            {renderInputField(
              'Bicarbonate',
              'organFunction',
              'electrolytes',
              'mEq/L',
              'bicarbonate'
            )}
          </View>

          <Text style={styles.subSectionTitle}>
            Immunology & Inflammation
          </Text>

          <View style={styles.row}>
            {renderInputField(
              'hs-CRP',
              'immunology',
              'hsCRP',
              'mg/L'
            )}

            {renderInputField(
              'ESR Rate',
              'immunology',
              'esr',
              'mm/hr'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Serum Ferritin',
              'immunology',
              'ferritin',
              'ng/mL'
            )}

            {renderInputField(
              'Interleukin-6',
              'immunology',
              'interleukin6',
              'pg/mL'
            )}
          </View>

          <Text style={styles.subSectionTitle}>
            Endocrine (Hormones)
          </Text>

          <View style={styles.row}>
            {renderInputField(
              'TSH Thyroid',
              'hormones',
              'tsh',
              'µIU/mL'
            )}

            {renderInputField(
              'Morning Cortisol',
              'hormones',
              'cortisolFasting',
              'µg/dL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Free T3',
              'hormones',
              'freeT3',
              'pg/mL'
            )}

            {renderInputField(
              'Free T4',
              'hormones',
              'freeT4',
              'ng/dL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Total Testosterone',
              'hormones',
              'testosteroneTotal',
              'ng/dL'
            )}

            {renderInputField(
              'Free Testosterone',
              'hormones',
              'testosteroneFree',
              'pg/mL'
            )}
          </View>
        </View>
      )}

      {/* VITAMINS & GUT */}
      {activeTab === 'micro' && (
        <View style={styles.formGrid}>
          <Text style={styles.subSectionTitle}>
            Micronutrients & Vitamins
          </Text>

          <View style={styles.row}>
            {renderInputField(
              'Vitamin D3',
              'micronutrients',
              'vitaminD3',
              'ng/mL'
            )}

            {renderInputField(
              'Vitamin B12',
              'micronutrients',
              'vitaminB12',
              'pg/mL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Total Calcium',
              'micronutrients',
              'calciumTotal',
              'mg/dL'
            )}

            {renderInputField(
              'Serum Iron',
              'micronutrients',
              'ironTotal',
              'µg/dL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Magnesium',
              'micronutrients',
              'magnesium',
              'mg/dL'
            )}

            {renderInputField(
              'Serum Zinc',
              'micronutrients',
              'zinc',
              'µg/dL'
            )}
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Serum Folate',
              'micronutrients',
              'folate',
              'ng/mL'
            )}

            {renderInputField(
              'Omega-3 Index',
              'micronutrients',
              'omega3Index',
              '%'
            )}
          </View>

          <Text style={styles.subSectionTitle}>
            Nutrigenomics & Gut Flora
          </Text>

          {/* MTHFR */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              MTHFR Status
            </Text>

            <View style={styles.optionRow}>
              {[
                'Negative',
                'Heterozygous',
                'Homozygous',
              ].map((opt) => {
                const isSelected =
                  vitals.geneticAndGut
                    ?.mthfrMutationStatus ===
                  opt;

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.pickerChip,
                      isSelected &&
                        styles.pickerChipActive,
                    ]}
                    onPress={() =>
                      updateMetric(
                        'geneticAndGut',
                        'mthfrMutationStatus',
                        opt
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        isSelected &&
                          styles.pickerTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* APOE */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              APOE Genotype
            </Text>

            <View style={styles.optionRow}>
              {[
                'E2/E3',
                'E3/E3',
                'E3/E4',
                'E4/E4',
              ].map((opt) => {
                const isSelected =
                  vitals.geneticAndGut
                    ?.apoeGenotype === opt;

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.pickerChip,
                      isSelected &&
                        styles.pickerChipActive,
                    ]}
                    onPress={() =>
                      updateMetric(
                        'geneticAndGut',
                        'apoeGenotype',
                        opt
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        isSelected &&
                          styles.pickerTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.row}>
            {renderInputField(
              'Gut Diversity',
              'geneticAndGut',
              'gutMicrobiomeDiversityScore',
              '0-100'
            )}

            {renderInputField(
              'F/B Ratio',
              'geneticAndGut',
              'firmicutesToBacteroidetesRatio',
              'ratio'
            )}
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,

    backgroundColor: colors.bgCard,

    borderColor: colors.borderSubtle,
  },

  // HEADER
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 13,
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 8,
  },

  headerIcon: {
    width: 30,
    height: 30,

    borderRadius: 9,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.alphaCyan10,

    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  title: {
    flexShrink: 1,

    fontSize: 14,
    fontWeight: '800',

    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: 10.5,

    color: colors.textMuted,

    marginTop: 4,

    lineHeight: 15,
  },

  // QUICK FILL
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,

    marginLeft: 8,

    backgroundColor: colors.alphaCyan15,

    borderWidth: 1,
    borderColor: colors.borderCyanStrong,

    paddingVertical: 7,
    paddingHorizontal: 9,

    borderRadius: 10,
  },

  quickFillText: {
    fontSize: 9.5,

    fontWeight: '800',

    color: colors.primaryLight,
  },

  // TABS
  tabsScroll: {
    flexDirection: 'row',

    gap: 7,

    paddingVertical: 3,

    paddingRight: 4,

    marginBottom: 13,
  },

  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,

    paddingVertical: 7,
    paddingHorizontal: 11,

    borderRadius: 10,

    backgroundColor: colors.glass,

    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  tabChipActive: {
    backgroundColor: colors.alphaCyan10,

    borderColor: colors.borderCyanStrong,
  },

  tabText: {
    fontSize: 10,

    color: colors.textMuted,

    fontWeight: '600',
  },

  tabTextActive: {
    color: colors.primaryLight,

    fontWeight: '800',
  },

  // FORM
  formGrid: {
    gap: 7,
  },

  row: {
    flexDirection: 'row',

    gap: 9,

    width: '100%',
  },

  subSectionTitle: {
    fontSize: 9.5,

    fontWeight: '800',

    color: colors.primaryLight,

    marginTop: 10,
    marginBottom: 3,

    textTransform: 'uppercase',

    letterSpacing: 0.7,
  },

  // INPUT
  inputGroup: {
    flex: 1,

    marginBottom: 8,

    minWidth: 0,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 5,

    gap: 5,
  },

  inputLabel: {
    flexShrink: 1,

    fontSize: 10.5,

    fontWeight: '600',

    color: colors.textSecondary,
  },

  unitBadge: {
    flexShrink: 0,

    fontSize: 8,

    fontWeight: '800',

    color: colors.primaryLight,

    backgroundColor: colors.alphaCyan10,

    paddingHorizontal: 5,
    paddingVertical: 2,

    borderRadius: 5,
  },

  textInput: {
    minHeight: 39,

    backgroundColor: colors.bgDark,

    borderWidth: 1,
    borderColor: colors.borderSubtle,

    borderRadius: 10,

    paddingHorizontal: 10,
    paddingVertical: 7,

    color: colors.textPrimary,

    fontSize: 12,

    fontWeight: '600',
  },

  // PICKERS
  optionRow: {
    flexDirection: 'row',

    gap: 6,

    flexWrap: 'wrap',

    marginTop: 5,
  },

  pickerChip: {
    paddingVertical: 7,
    paddingHorizontal: 10,

    borderRadius: 8,

    backgroundColor: colors.glass,

    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  pickerChipActive: {
    backgroundColor: colors.alphaCyan15,

    borderColor: colors.primaryLight,
  },

  pickerText: {
    fontSize: 9.5,

    color: colors.textMuted,

    fontWeight: '600',
  },

  pickerTextActive: {
    color: colors.primaryLight,

    fontWeight: '800',
  },
});

export default VitalsFormSection;
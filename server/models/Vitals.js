import mongoose from 'mongoose';
import { calculateDerivedVitals } from '../utils/aiFeatureExtractor.js';

const vitalsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: {
    type: String,
    enum: ['Manual', 'PDF_Scan', 'Lab_Assistant', 'Doctor', 'Wearable_Sync', 'CGM_Sensor'],
    required: true,
    trim: true
  },

  // 1. ANTHROPOMETRICS & BODY COMPOSITION
  bodyMetrics: {
    heightCm: { type: Number },
    weightKg: { type: Number },
    bmi: { type: Number },
    bodyFatPercentage: { type: Number },
    muscleMassKg: { type: Number },
    boneMassKg: { type: Number },
    visceralFatIndex: { type: Number },
    waterPercentage: { type: Number },
    measurements: {
      waistCm: Number,
      hipCm: Number,
      neckCm: Number,
      waistToHipRatio: Number,
      waistToHeightRatio: Number
    }
  },

  // 2. CONTINUOUS WEARABLE & OBSERVATIONAL METRICS
  continuousMetrics: {
    restingHeartRate: { type: Number },
    hrv: { type: Number },
    vo2Max: { type: Number },
    oxygenSaturationSpO2: { type: Number },
    basalBodyTemperatureF: { type: Number },
    respirationRate: { type: Number },
    sleepStaging: {
      deepSleepMinutes: { type: Number },
      remSleepMinutes: { type: Number },
      lightSleepMinutes: { type: Number },
      awakeMinutes: { type: Number }
    },
    dailyStepCount: { type: Number },
    activeCaloriesBurned: { type: Number }
  },

  // 3. GLYCEMIC & METABOLIC HEALTH
  metabolicHealth: {
    glucoseFasting: { type: Number },
    glucosePostPrandial: { type: Number },
    hba1c: { type: Number },
    fructosamine: { type: Number },
    fastingInsulin: { type: Number },
    cPeptide: { type: Number },
    homaIR: { type: Number },
    homaBeta: { type: Number },
    quicki: { type: Number },
    tygIndex: { type: Number },
    estimatedAvgGlucose: { type: Number },
    bloodKetones: { type: Number },
    betaHydroxybutyrate: { type: Number },
    leptin: { type: Number },
    ghrelin: { type: Number },
    adiponectin: { type: Number }
  },

  // 4. ADVANCED LIPID & CARDIOVASCULAR FRACTIONS
  cardiovascularRisk: {
    systolic: { type: Number },
    diastolic: { type: Number },
    meanArterialPressure: { type: Number },
    pulsePressure: { type: Number },
    totalCholesterol: { type: Number },
    ldlCholesterol: { type: Number },
    hdlCholesterol: { type: Number },
    vldlCholesterol: { type: Number },
    triglycerides: { type: Number },
    nonHdlCholesterol: { type: Number },
    cholesterolHdlRatio: { type: Number },
    ldlHdlRatio: { type: Number },
    trigHdlRatio: { type: Number },
    atherogenicIndexPlasma: { type: Number },
    apolipoproteinA1: { type: Number },
    apolipoproteinB: { type: Number },
    apoBApoA1Ratio: { type: Number },
    lipoproteinA: { type: Number },
    homocysteine: { type: Number },
    hsTroponinI: { type: Number },
    ntProBNP: { type: Number }
  },

  // 5. HEMATOLOGY & COMPLETE BLOOD COUNT (CBC WITH DIFFERENTIAL)
  hematology: {
    hemoglobin: { type: Number },
    hematocrit: { type: Number },
    rbc: { type: Number },
    mcv: { type: Number },
    mch: { type: Number },
    mchc: { type: Number },
    rdw: { type: Number },
    wbc: { type: Number },
    neutrophilsPercent: { type: Number },
    lymphocytesPercent: { type: Number },
    monocytesPercent: { type: Number },
    eosinophilsPercent: { type: Number },
    basophilsPercent: { type: Number },
    platelets: { type: Number },
    mpv: { type: Number },
    nlr: { type: Number },
    plr: { type: Number },
    mlr: { type: Number },
    sii: { type: Number }
  },

  // 6. INFLAMMATION & IMMUNOLOGY
  immunology: {
    hsCRP: { type: Number },
    esr: { type: Number },
    ferritin: { type: Number },
    interleukin6: { type: Number },
    tnfAlpha: { type: Number },
    fibrinogen: { type: Number }
  },

  // 7. ENDOCRINOLOGY (Hormones)
  hormones: {
    cortisolFasting: { type: Number },
    tsh: { type: Number },
    freeT3: { type: Number },
    freeT4: { type: Number },
    testosteroneTotal: { type: Number },
    testosteroneFree: { type: Number },
    shbg: { type: Number },
    freeAndrogenIndex: { type: Number },
    estradiol: { type: Number },
    progesterone: { type: Number },
    dheas: { type: Number }
  },

  // 8. RENAL, HEPATIC & ELECTROLYTES (CMP)
  organFunction: {
    astSgot: { type: Number },
    altSgpt: { type: Number },
    deRitisRatio: { type: Number },
    ggt: { type: Number },
    alp: { type: Number },
    totalBilirubin: { type: Number },
    directBilirubin: { type: Number },
    indirectBilirubin: { type: Number },
    creatinine: { type: Number },
    egfr: { type: Number },
    bun: { type: Number },
    bunCreatinineRatio: { type: Number },
    uricAcid: { type: Number },
    microalbumin: { type: Number },
    totalProtein: { type: Number },
    albumin: { type: Number },
    globulin: { type: Number },
    albuminGlobulinRatio: { type: Number },
    electrolytes: {
      sodium: Number,
      potassium: Number,
      chloride: Number,
      bicarbonate: Number,
      anionGap: Number
    }
  },

  // 9. MICRONUTRIENTS & MINERALS
  micronutrients: {
    calciumTotal: { type: Number },
    ionizedCalcium: { type: Number },
    ironTotal: { type: Number },
    tibc: { type: Number },
    transferrinSaturation: { type: Number },
    magnesium: { type: Number },
    zinc: { type: Number },
    copper: { type: Number },
    zincCopperRatio: { type: Number },
    vitaminD3: { type: Number },
    vitaminB12: { type: Number },
    folate: { type: Number },
    omega3Index: { type: Number }
  },

  // 10. AI CALCULATED CLINICAL INDICES & BIOLOGICAL LONGEVITY
  aiCalculatedScores: {
    biologicalAge: { type: Number },
    phenotypicAgeDelta: { type: Number },
    framinghamRiskScore: { type: Number },
    metabolicSyndromeScore: { type: Number },
    fib4Index: { type: Number },
    ascvdRiskScore: { type: Number }
  },

  // 11. NUTRIGENOMICS & MICROBIOME
  geneticAndGut: {
    mthfrMutationStatus: {
      type: String,
      enum: ['Negative', 'Heterozygous', 'Homozygous', 'Unknown'],
      default: 'Unknown',
      trim: true
    },
    apoeGenotype: {
      type: String,
      enum: ['E2/E2', 'E2/E3', 'E3/E3', 'E3/E4', 'E4/E4', 'Unknown'],
      default: 'Unknown',
      trim: true
    },
    gutMicrobiomeDiversityScore: { type: Number },
    firmicutesToBacteroidetesRatio: { type: Number }
  },

  // 12. METADATA & VERIFICATION AUDITING
  pdfRawText: { type: String, trim: true },
  documentUrl: { type: String, trim: true },
  isVerifiedByUser: { type: Boolean, default: false },
  isInitialBaseline: { type: Boolean, default: false },
  recordedAt: { type: Date, default: Date.now },
  criticalAlertTriggered: { type: Boolean, default: false },
  criticalAlertDetails: [{
    biomarker: { type: String, trim: true },
    recordedValue: Number,
    severity: { type: String, enum: ['Low', 'High', 'Critical'], trim: true },
    status: { type: String, enum: ['Unresolved', 'Doctor_Notified', 'Resolved'], default: 'Unresolved', trim: true }
  }],

}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

// Auto-derive composite clinical ratios and indices prior to saving
vitalsSchema.pre('save', function () {
  try {
    const derived = calculateDerivedVitals(this.toObject());
    
    // Merge derived fields back onto this document
    if (derived.bodyMetrics) Object.assign(this.bodyMetrics, derived.bodyMetrics);
    if (derived.cardiovascularRisk) Object.assign(this.cardiovascularRisk, derived.cardiovascularRisk);
    if (derived.metabolicHealth) Object.assign(this.metabolicHealth, derived.metabolicHealth);
    if (derived.hematology) Object.assign(this.hematology, derived.hematology);
    if (derived.organFunction) Object.assign(this.organFunction, derived.organFunction);
    if (derived.micronutrients) Object.assign(this.micronutrients, derived.micronutrients);
    if (derived.hormones) Object.assign(this.hormones, derived.hormones);
    if (derived.aiCalculatedScores) Object.assign(this.aiCalculatedScores, derived.aiCalculatedScores);

    // Auto-detect critical out-of-range clinical alerts
    const alerts = [];
    const sbp = this.cardiovascularRisk?.systolic;
    const dbp = this.cardiovascularRisk?.diastolic;
    const fastingGluc = this.metabolicHealth?.glucoseFasting;
    const hr = this.continuousMetrics?.restingHeartRate;
    const spO2 = this.continuousMetrics?.oxygenSaturationSpO2;
    const trop = this.cardiovascularRisk?.hsTroponinI;
    const k = this.organFunction?.electrolytes?.potassium;

    if (sbp >= 180 || dbp >= 120) {
      alerts.push({ biomarker: 'Hypertensive Crisis (BP)', recordedValue: sbp, severity: 'Critical' });
    }
    if (fastingGluc >= 300) {
      alerts.push({ biomarker: 'Severe Hyperglycemia', recordedValue: fastingGluc, severity: 'Critical' });
    } else if (fastingGluc > 0 && fastingGluc < 55) {
      alerts.push({ biomarker: 'Severe Hypoglycemia', recordedValue: fastingGluc, severity: 'Critical' });
    }
    if (spO2 > 0 && spO2 < 90) {
      alerts.push({ biomarker: 'Severe Hypoxia (SpO2)', recordedValue: spO2, severity: 'Critical' });
    }
    if (hr >= 140 || (hr > 0 && hr < 40)) {
      alerts.push({ biomarker: 'Cardiac Dysrhythmia Rate', recordedValue: hr, severity: 'Critical' });
    }
    if (trop > 0.04) {
      alerts.push({ biomarker: 'Elevated hs-Troponin I (Myocardial Strain)', recordedValue: trop, severity: 'Critical' });
    }
    if (k >= 6.0 || (k > 0 && k < 3.0)) {
      alerts.push({ biomarker: 'Serum Potassium Derangement', recordedValue: k, severity: 'Critical' });
    }

    if (alerts.length > 0) {
      this.criticalAlertTriggered = true;
      this.criticalAlertDetails = alerts;
    }
  } catch (err) {
    console.warn('[Vitals Pre-Save Error]:', err.message);
  }
});

vitalsSchema.index({ user: 1, recordedAt: -1 });

export default mongoose.model('Vitals', vitalsSchema);
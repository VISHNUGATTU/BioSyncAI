import mongoose from 'mongoose';

const vitalsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: {
    type: String,
    enum: ['Manual', 'PDF_Scan', 'Lab_Assistant', 'Wearable_Sync', 'CGM_Sensor'],
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
      neckCm: Number
    }
  },

  // 2. CONTINUOUS WEARABLE DATA
  continuousMetrics: {
    restingHeartRate: { type: Number },
    hrv: { type: Number },
    vo2Max: { type: Number },
    oxygenSaturationSpO2: { type: Number },
    basalBodyTemperatureF: { type: Number },
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
    leptin: { type: Number },
    ghrelin: { type: Number },
    adiponectin: { type: Number }
  },

  // 4. ADVANCED LIPID & CARDIOVASCULAR
  cardiovascularRisk: {
    systolic: { type: Number },
    diastolic: { type: Number },
    totalCholesterol: { type: Number },
    ldlCholesterol: { type: Number },
    hdlCholesterol: { type: Number },
    vldlCholesterol: { type: Number },
    triglycerides: { type: Number },
    apolipoproteinA1: { type: Number },
    apolipoproteinB: { type: Number },
    lipoproteinA: { type: Number },
    homocysteine: { type: Number }
  },

  // 5. INFLAMMATION & IMMUNOLOGY
  immunology: {
    hsCRP: { type: Number },
    esr: { type: Number },
    ferritin: { type: Number },
    interleukin6: { type: Number }
  },

  // 6. ENDOCRINOLOGY (Hormones)
  hormones: {
    cortisolFasting: { type: Number },
    tsh: { type: Number },
    freeT3: { type: Number },
    freeT4: { type: Number },
    testosteroneTotal: { type: Number },
    testosteroneFree: { type: Number },
    estradiol: { type: Number },
    progesterone: { type: Number },
    dheas: { type: Number }
  },

  // 7. RENAL & HEPATIC
  organFunction: {
    astSgot: { type: Number },
    altSgpt: { type: Number },
    ggt: { type: Number },
    creatinine: { type: Number },
    egfr: { type: Number },
    uricAcid: { type: Number }
  },

  // 8. MICRONUTRIENTS
  micronutrients: {
    calciumTotal: { type: Number },
    ironTotal: { type: Number },
    magnesium: { type: Number },
    zinc: { type: Number },
    vitaminD3: { type: Number },
    vitaminB12: { type: Number },
    folate: { type: Number },
    omega3Index: { type: Number }
  },

  // 9. NUTRIGENOMICS & MICROBIOME
  geneticAndGut: {
    mthfrMutationStatus: {
      type: String,
      enum: ['Negative', 'Heterozygous', 'Homozygous', 'Unknown'],
      trim: true
    },
    apoeGenotype: {
      type: String,
      enum: ['E2/E2', 'E2/E3', 'E3/E3', 'E3/E4', 'E4/E4', 'Unknown'],
      trim: true
    },
    gutMicrobiomeDiversityScore: { type: Number },
    firmicutesToBacteroidetesRatio: { type: Number }
  },

  // 10. METADATA
  pdfRawText: { type: String, trim: true },
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

vitalsSchema.index({ user: 1, recordedAt: -1 });

export default mongoose.model('Vitals', vitalsSchema);
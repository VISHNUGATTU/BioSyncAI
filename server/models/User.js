import mongoose from 'mongoose';

// ------------------------------------------------------------------
// 1. THE CLINICAL PROFILE SUB-SCHEMA
// We separate this so the main User object isn't bloated when just logging in.
// ------------------------------------------------------------------
const clinicalProfileSchema = new mongoose.Schema({
  
  // Vital Signs
  vitals: {
    bp_systolic: { type: Number },
    bp_diastolic: { type: Number },
    heart_rate: { type: Number },
    body_temperature: { type: Number },
    respiratory_rate: { type: Number },
    oxygen_saturation: { type: Number }
  },

  // Blood Sugar / Diabetes
  bloodSugar: {
    fasting_blood_sugar: { type: Number }, // mg/dL
    postprandial_blood_sugar: { type: Number }, // mg/dL
    hba1c: { type: Number } // %
  },

  // Lipid Profile
  lipidProfile: {
    total_cholesterol: { type: Number },
    ldl: { type: Number },
    hdl: { type: Number },
    triglycerides: { type: Number }
  },

  // Organ Function (Kidney & Liver)
  organFunction: {
    creatinine: { type: Number },
    blood_urea_nitrogen: { type: Number },
    uric_acid: { type: Number },
    alt_sgpt: { type: Number },
    ast_sgot: { type: Number },
    bilirubin: { type: Number }
  },

  // Body Composition (Advanced Metrics)
  bodyComposition: {
    bmi: { type: Number },
    body_fat_percentage: { type: Number },
    muscle_mass: { type: Number },
    waist_to_hip_ratio: { type: Number }
  },

  // Hormonal / Metabolic
  hormones: {
    insulin_resistance: { type: Number }, // HOMA-IR
    basal_metabolic_rate: { type: Number },
    tsh: { type: Number },
    t3: { type: Number },
    t4: { type: Number },
    cortisol: { type: Number }
  },

  // Clinical Booleans (Fast querying for the AI heuristic engine)
  conditions: {
    has_hypertension: { type: Boolean, default: false },
    has_heart_disease: { type: Boolean, default: false },
    has_stroke_history: { type: Boolean, default: false },
    has_diabetes: { type: Boolean, default: false },
    has_obesity: { type: Boolean, default: false },
    has_kidney_disease: { type: Boolean, default: false },
    has_coronary_artery_disease: { type: Boolean, default: false },
    has_thyroid_disorder: { type: Boolean, default: false },
    has_pcos: { type: Boolean, default: false },
    has_lactose_intolerance: { type: Boolean, default: false },
    has_gluten_intolerance: { type: Boolean, default: false }
  },

  // Medications
  medications: {
    on_bp_medication: { type: Boolean, default: false },
    on_diabetes_medication: { type: Boolean, default: false },
    on_cholesterol_medication: { type: Boolean, default: false },
    takes_supplements: { type: Boolean, default: false }
  },

  // Lifestyle Medical Factors
  lifestyle: {
    sleep_hours: { type: Number },
    sleep_quality: { type: String, enum: ['Poor', 'Fair', 'Good', 'Excellent'] },
    stress_level: { type: String, enum: ['Low', 'Moderate', 'High', 'Severe'] },
    smoking_status: { type: String, enum: ['Never', 'Former', 'Current'] },
    alcohol_consumption: { type: String, enum: ['None', 'Occasional', 'Moderate', 'Heavy'] }
  },

  // Family History Array
  familyHistory: [{ 
    type: String, 
    enum: ['Diabetes', 'Hypertension', 'Heart Disease', 'Obesity', 'Cancer', 'None'] 
  }],

  // The Master Lock: The AI cannot run unless this is true.
  isComplete: { type: Boolean, default: false }

}, { _id: false }); // Prevents MongoDB from creating a useless ID just for this subdocument

// ------------------------------------------------------------------
// 2. THE MAIN USER SCHEMA
// ------------------------------------------------------------------
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Basic Identity (Filled out on sign-up / Profile Tab)
  baselineHealth: {
    age: { type: Number },
    weight: { type: Number }, // KG
    height: { type: Number }, // CM
    biologicalSex: { type: String, enum: ['Male', 'Female', 'Other'] },
    activityLevel: { type: String, enum: ['Sedentary', 'Light', 'Moderate', 'Active', 'Athlete'], default: 'Moderate' },
    dietaryPreference: { type: String, enum: ['Standard', 'Keto', 'Vegan', 'Paleo', 'Vegetarian'], default: 'Standard' },
    allergies: [{ type: String }]
  },

  // The Clinical Payload (Filled out by Medical Assistant/Lab)
  clinicalProfile: {
    type: clinicalProfileSchema,
    default: () => ({}) // Initializes an empty object so it's never undefined
  }

}, { timestamps: true });

export default mongoose.model('User', userSchema);
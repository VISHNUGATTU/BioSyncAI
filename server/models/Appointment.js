import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  appointmentType: { 
    type: String, 
    enum: ['Lab_Collection', 'Doctor_Consultation'], 
    required: true,
    trim: true 
  },
  
  testCatalog: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCatalog' },
  labAssistant: { type: mongoose.Schema.Types.ObjectId, ref: 'LabAssistant' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  
  scheduledDate: { type: Date, required: true },
  timeSlot: { type: String, required: true, trim: true },
  preparationInstructions: { type: String, trim: true },
  
  status: {
    type: String,
    enum: [
      'Booked', 
      'Pending', 
      'Confirmed', 
      'Assistant_Assigned', 
      'Assigned', 
      'On_The_Way', 
      'On_Route', 
      'Arrived', 
      'Collecting', 
      'Sample_Collected', 
      'At_Laboratory', 
      'Processing', 
      'Report_Generated', 
      'Completed', 
      'Modified', 
      'No_Show', 
      'Failed', 
      'Cancelled'
    ],
    default: 'Booked',
    trim: true
  },
  
  trackingLogs: [{
    status: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String, trim: true }
  }],
  
  cancellationReason: { type: String, trim: true },
  failureReason: { type: String, trim: true },
  failureNotes: { type: String, trim: true },
  exceptionType: {
    type: String,
    enum: [
      'None',
      'Unreachable_Patient',
      'Patient_Refusal',
      'Vein_Collapse_Difficult_Draw',
      'Sample_Compromised_Hemolyzed',
      'Patient_Not_Fasting',
      'Address_Untraceable',
      'Other'
    ],
    default: 'None',
    trim: true
  },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  
  address: {
    houseNumber: { type: String, trim: true },
    street: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  collectionOTP: { type: String, trim: true },

  paymentDetails: {
    isPaid: { type: Boolean, default: false },
    amount: { type: Number, default: 499 },
    method: { type: String, enum: ['Cash', 'UPI', 'Card', 'Online', 'None'], default: 'None' },
    collectedAt: { type: Date },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'LabAssistant' }
  },

  clinicalIntake: {
    vitals: {
      systolic: { type: Number },
      diastolic: { type: Number },
      pulse: { type: Number },
      spO2: { type: Number },
      temperatureF: { type: Number },
      heightCm: { type: Number },
      weightKg: { type: Number },
      bmi: { type: Number },
      waistCm: { type: Number }
    },
    medicalHistory: {
      chronicConditions: [{ type: String, trim: true }],
      currentMedications: { type: String, trim: true },
      knownAllergies: { type: String, trim: true },
      familyHistory: [{ type: String, trim: true }]
    },
    lifestyle: {
      smokingHabit: { type: String, trim: true },
      alcoholConsumption: { type: String, trim: true },
      dietPreference: { type: String, trim: true },
      activityLevel: { type: String, trim: true },
      sleepHours: { type: Number },
      stressLevel: { type: String, trim: true }
    },
    preScreening: {
      fastingObserved: { type: Boolean, default: true },
      fastingDurationHours: { type: Number, default: 10 },
      morningMedicationsTaken: { type: String, trim: true },
      bleedingDisorderHistory: { type: Boolean, default: false },
      faintingHistory: { type: Boolean, default: false },
      activeSymptoms: { type: String, trim: true },
      phlebotomistObservations: { type: String, trim: true }
    }
  },

  specimens: {
    blood: {
      collected: { type: Boolean, default: false },
      tubesCount: { type: Number, default: 3 },
      barcode: { type: String, trim: true },
      barcodePhoto: { type: String, trim: true }
    },
    urine: {
      collected: { type: Boolean, default: false },
      barcode: { type: String, trim: true },
      barcodePhoto: { type: String, trim: true }
    },
    stool: {
      collected: { type: Boolean, default: false },
      barcode: { type: String, trim: true },
      barcodePhoto: { type: String, trim: true }
    },
    coldChainSecured: { type: Boolean, default: true }
  },

  questionnaire: {
    fastingObserved: { type: Boolean, default: true },
    fastingDurationHours: { type: Number, default: 10 },
    morningMedications: { type: String, trim: true },
    bleedingDisorderHistory: { type: Boolean, default: false },
    faintingHistory: { type: Boolean, default: false },
    activeSymptoms: { type: String, trim: true },
    clinicalNotes: { type: String, trim: true }
  }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

appointmentSchema.index({ user: 1, scheduledDate: -1 });
appointmentSchema.index({ labAssistant: 1, status: 1 });
appointmentSchema.index({ status: 1 });

export default mongoose.model('Appointment', appointmentSchema);
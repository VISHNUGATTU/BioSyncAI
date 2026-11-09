import mongoose from 'mongoose';

const foodOrderSchema = new mongoose.Schema({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    index: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  restaurant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true, 
    index: true 
  },

  items: [{
    foodItem: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'FoodItem', 
      required: true 
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    appliedModifications: [{
      code: String,
      label: String,
      priceDelta: { type: Number, default: 0 }
    }],
    itemTotal: { type: Number, required: true }
  }],

  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 35 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true, min: 0 },

  // ========================================================
  // DUAL-MODE COMMERCE ARCHITECTURE
  // ========================================================
  orderMode: {
    type: String,
    enum: ['VITALS_GUARD', 'CHEAT_MODE_OVERRIDE'],
    default: 'VITALS_GUARD',
    required: true,
    index: true,
    comment: 'VITALS_GUARD enforces physiological boundaries; CHEAT_MODE allows user risk override with mandatory mitigation'
  },

  // Snapshot of physiological state at time of order
  userVitalsAtOrderTime: {
    fastingGlucose: Number,
    currentCGMGlucose: Number,
    cgmTrendArrow: String, // 'FLAT', 'SINGLE_UP', 'DOUBLE_UP', etc.
    systolicBP: Number,
    diastolicBP: Number,
    heartRate: Number,
    eGFR: Number,
    activeMedications: [String]
  },

  // ========================================================
  // IN-SILICO PRE-ORDER SIMULATION TRAJECTORY
  // ========================================================
  inSilicoPreOrderForecast: {
    simulatedPeakGlucose: { type: Number, required: true },
    timeToPeakMin: { type: Number, required: true },
    projectedAUC: { type: Number },
    simulatedSystolicPeak: { type: Number },
    simulatedDiastolicPeak: { type: Number },
    glycemicExcursionCategory: {
      type: String,
      enum: ['SAFE_STABLE', 'MILD_ELEVATION', 'DANGEROUS_SPIKE', 'HYPO_RISK'],
      required: true
    },
    simulationTrajectory: [{
      timeMin: Number,
      plasmaGlucose: Number,
      interstitialGlucose: Number,
      systolicBP: Number
    }]
  },

  // ========================================================
  // AUTONOMOUS BIO-HACK & MITIGATION PLAN (Active in Cheat Mode)
  // ========================================================
  mitigationPlan: {
    requiredAmbulationMinutes: { type: Number, default: 0 },
    targetStepsToBurnExcursion: { type: Number, default: 0 },
    recommendedWalkStartTimeMin: { type: Number, default: 25 },
    
    // Food sequencing checklist for user delivery box
    preBiteSequencing: [{
      stepNumber: { type: Number, required: true },
      phase: { 
        type: String, 
        enum: ['Fiber_Salad_First', 'Protein_Fat_Second', 'Starch_Carb_Last'] 
      },
      instructions: String,
      durationMin: Number
    }],

    vinegarPreloadRecommended: { type: Boolean, default: false },
    insulinSplitBolusAdvice: String
  },

  // ========================================================
  // SINGLE-POT JOINT FAMILY DISAGGREGATION
  // ========================================================
  isFamilyOrder: { type: Boolean, default: false },
  singlePotFamilyAllocation: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    memberName: String,
    relation: String,
    clinicalCondition: String,
    allocatedPortionWeightGrams: Number,
    allocatedDishes: [{
      dishName: String,
      gramWeight: Number,
      dietaryNote: String
    }],
    predictedMemberPeakGlucose: Number
  }],

  // ========================================================
  // CLOUD KITCHEN DISPLAY SYSTEM (KDS) DISPATCH TICKET
  // ========================================================
  kitchenDispatchTicket: {
    dispatchedAt: { type: Date, default: Date.now },
    kdsAcknowledged: { type: Boolean, default: false },
    instructionsPrinted: [String]
  },

  deliveryAddress: {
    houseNumber: String,
    street: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: { lat: Number, lng: Number }
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Card', 'NetBanking', 'COD', 'HealthWallet'],
    default: 'UPI'
  },

  orderStatus: {
    type: String,
    enum: [
      'Placed',
      'Kitchen_Confirmed',
      'Cooking',
      'Out_For_Delivery',
      'Delivered',
      'Cancelled'
    ],
    default: 'Placed',
    index: true
  },

  deliveredAt: Date
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

export default mongoose.model('FoodOrder', foodOrderSchema);


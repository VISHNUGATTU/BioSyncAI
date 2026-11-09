import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, trim: true },
  cuisineTypes: [{
    type: String,
    enum: [
      'South Indian',
      'North Indian',
      'Mughlai',
      'Sattvic',
      'Diabetic-Friendly',
      'Millet Bowls & Health',
      'Street Food',
      'Bengali',
      'Maharashtrian',
      'Continental & Salads'
    ]
  }],
  fssaiLicenseNumber: { type: String, required: true, trim: true },
  hygieneRating: { type: Number, min: 1, max: 5, default: 4.5 },
  
  // Biophysical & Oil Quality Surveillance
  oilQualityIndex: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 85,
    index: true,
    comment: 'Quantifies oil purity, low polar compounds (TPC < 15%), and frequent frying turnover.'
  },
  oilReplacementCycleHours: { type: Number, default: 24 },
  primaryCookingMedium: {
    type: String,
    enum: [
      'Cold_Pressed_Mustard_Oil',
      'Cold_Pressed_Sesame_Oil',
      'Desi_Cow_Ghee',
      'Extra_Virgin_Olive_Oil',
      'Refined_Sunflower_Oil',
      'Refined_Palm_Olein',
      'Rice_Bran_Oil',
      'Coconut_Oil'
    ],
    default: 'Cold_Pressed_Mustard_Oil'
  },
  
  isCloudKitchen: { type: Boolean, default: false, index: true },
  
  // Kitchen Display System (KDS) & Automated Nutritional Modification Integration
  kitchenDisplaySystem: {
    enabled: { type: Boolean, default: true },
    webhookUrl: { type: String, trim: true },
    autoApplyModifications: { type: Boolean, default: true },
    supportedModifiers: [{
      type: String,
      enum: [
        'LOW_SODIUM_KSALT',
        'SUB_FOXTAIL_MILLET',
        'SUB_BROWN_RICE',
        'NO_REFINED_SUGAR_STEVIA',
        'SUB_CURD_FOR_CREAM',
        'EXTRA_FIBER_VEG_BULK',
        'COLD_PRESSED_OIL_ONLY',
        'LEACH_POTASSIUM_BOIL'
      ]
    }]
  },

  address: {
    street: { type: String, trim: true },
    area: { type: String, trim: true, index: true },
    city: { type: String, trim: true, default: 'Hyderabad', index: true },
    state: { type: String, trim: true, default: 'Telangana' },
    pincode: { type: String, trim: true },
    coordinates: {
      lat: { type: Number, min: -90, max: 90, default: 17.5398 }, // Default VNRVJIET / Bachupally coords
      lng: { type: Number, min: -180, max: 180, default: 78.3867 }
    }
  },

  contact: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true }
  },

  rating: {
    average: { type: Number, min: 1, max: 5, default: 4.6 },
    count: { type: Number, default: 120 }
  },

  deliveryTimeEstimateMin: { type: Number, default: 30 },
  costForTwo: { type: Number, default: 400 },
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' },
  bannerUrl: { type: String, default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836' },

  isVitalsGuardCertified: { 
    type: Boolean, 
    default: true, 
    index: true,
    comment: 'Certified to support real-time digital twin recipe micro-modifications'
  },
  
  status: {
    type: String,
    enum: ['Active', 'Busy', 'Closed', 'Suspended'],
    default: 'Active',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

// 2dsphere index for geo-spatial distance queries from patient location
restaurantSchema.index({ 'address.coordinates': '2dsphere' });

export default mongoose.model('Restaurant', restaurantSchema);


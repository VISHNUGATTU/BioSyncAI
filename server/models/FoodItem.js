import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  restaurant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true, 
    index: true 
  },
  name: { type: String, required: true, trim: true, index: true },
  slug: { type: String, trim: true, lowercase: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    enum: [
      'Main_Course',
      'Appetizer',
      'Breakfast',
      'Breads',
      'Rice_Biryani',
      'Dessert',
      'Beverage',
      'Side_Salad',
      'Millet_Specialty',
      'Ayur_Therapeutic'
    ],
    required: true,
    index: true
  },
  dietaryType: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Vegan', 'Egg'],
    required: true,
    index: true
  },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' },
  isAvailable: { type: Boolean, default: true, index: true },

  // ========================================================
  // CORE BIOPHYSICAL & NUTRITIONAL QUANTITIES (Per Serving)
  // ========================================================
  servingWeightGrams: { type: Number, required: true, min: 10 },
  calories: { type: Number, required: true, min: 0 },
  carbohydrates_g: { type: Number, required: true, min: 0 },
  netCarbohydrates_g: { type: Number, min: 0 },
  protein_g: { type: Number, required: true, min: 0 },
  fat_g: { type: Number, required: true, min: 0 },
  fiber_g: { type: Number, default: 0, min: 0 },
  sugar_g: { type: Number, default: 0, min: 0 },
  sodium_mg: { type: Number, default: 0, min: 0, index: true },
  potassium_mg: { type: Number, default: 0, min: 0 },
  saturatedFat_g: { type: Number, default: 0, min: 0 },
  transFat_g: { type: Number, default: 0, min: 0 },

  // ========================================================
  // GLYCEMIC & METABOLIC KINETICS
  // ========================================================
  glycemicIndex: { type: Number, min: 0, max: 120, required: true, index: true },
  glycemicLoad: { type: Number, min: 0, max: 100 },
  
  // Specific Indian Starch & Biochemical Decomposition
  grainType: {
    type: String,
    enum: [
      'Sona_Masoori_White_Rice',
      'Basmati_Aged_Rice',
      'Brown_Rice',
      'Foxtail_Millet',
      'Ragi_Finger_Millet',
      'Jowar_Sorghum',
      'Refined_Maida',
      'Whole_Wheat_Atta',
      'Besan_Gram_Flour',
      'Lentil_Dal',
      'Tubers_Potato',
      'None'
    ],
    default: 'None',
    index: true
  },
  
  // Amylose / Amylopectin Ratio (R_A)
  // High Amylose (>0.25) slows enzymatic cleavage; Low (<0.18) causes rapid spikes
  amyloseRatio: { 
    type: Number, 
    min: 0, 
    max: 1.0, 
    default: 0.20,
    comment: 'Amylose fraction in starch; determines alpha-amylase digestion rate'
  },
  
  // Resistant Starch Factor (RS3) due to retrogradation or parboiling (0.0 to 1.0)
  resistantStarchFactor: { 
    type: Number, 
    min: 0, 
    max: 1.0, 
    default: 0.05,
    comment: 'Degree of starch retrogradation (e.g. chilled parboiled rice RS3 factor ~ 0.35)'
  },

  fermentationType: {
    type: String,
    enum: ['None', 'Lactic_Acid_Fermented', 'Yeast_Leavened'],
    default: 'None',
    comment: 'Lactic acid fermentation (e.g. Idli/Dosa) delays gastric emptying rate'
  },

  // Active Ayurvedic Botanicals (For Ayur-Allopathic cross-interaction screening)
  activeBotanicals: [{
    name: {
      type: String,
      enum: [
        'Karela',
        'Methi',
        'Jamun',
        'Giloy',
        'Ashwagandha',
        'Turmeric_Curcumin',
        'Cinnamon',
        'Triphala',
        'Neem',
        'Amla',
        'None'
      ],
      required: true
    },
    concentration_mg: { type: Number, min: 0, default: 0 },
    activeMarker: { type: String, trim: true } // e.g. Charantin, 4-hydroxyisoleucine, Curcuminoids
  }],

  // Cooking Oil Spec
  cookingMedium: {
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

  // ========================================================
  // KITCHEN DISPLAY SYSTEM (KDS) MODIFICATION PRESETS
  // ========================================================
  allowModifications: { type: Boolean, default: true },
  modificationsAvailable: [{
    code: {
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
      ],
      required: true
    },
    label: { type: String, required: true },
    description: String,
    calorieDelta: { type: Number, default: 0 },
    carbDelta_g: { type: Number, default: 0 },
    sodiumDelta_mg: { type: Number, default: 0 },
    priceDelta: { type: Number, default: 0 }
  }],

  // Clinical contraindications (Auto-block in Vitals Guard Mode)
  contraindications: [{
    type: String,
    enum: [
      'CKD_POTASSIUM_RESTRICTION',
      'SULPHONYLUREA_HYPO_HAZARD',
      'SEVERE_HYPERTENSION_SODIUM',
      'CELIAC_GLUTEN',
      'SEVERE_TRIGLYCERIDE_SURGE'
    ]
  }],

  // Metadata tags for quick filtering
  tags: [{ type: String, trim: true, index: true }]
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => { 
      delete ret.__v; 
      if (!ret.netCarbohydrates_g && ret.carbohydrates_g !== undefined) {
        ret.netCarbohydrates_g = Math.max(0, ret.carbohydrates_g - (ret.fiber_g || 0));
      }
      return ret; 
    } 
  }
});

// Auto-calculate netCarbohydrates and glycemicLoad before saving
foodItemSchema.pre('save', function(next) {
  if (this.carbohydrates_g !== undefined && this.fiber_g !== undefined) {
    this.netCarbohydrates_g = Math.max(0, this.carbohydrates_g - this.fiber_g);
  }
  if (this.glycemicIndex && this.netCarbohydrates_g !== undefined) {
    this.glycemicLoad = Number(((this.glycemicIndex * this.netCarbohydrates_g) / 100).toFixed(1));
  }
  next();
});

export default mongoose.model('FoodItem', foodItemSchema);


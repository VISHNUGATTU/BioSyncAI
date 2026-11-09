import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

import crypto from 'crypto';
import Restaurant from './models/Restaurant.js';
import FoodItem from './models/FoodItem.js';
import User from './models/User.js';
import FamilyGroup from './models/FamilyGroup.js';
import FoodOrder from './models/FoodOrder.js';
import IoTTelemetry from './models/IoTTelemetry.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/biosyncai';

export async function seedFoodTech() {
  console.log('\n======================================================');
  console.log('  BioSync AI - Phase 1: Food-Tech & Kitchen Master Seeder');
  console.log('======================================================');
  console.log(`Connecting to: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
    }
    console.log('Connected to MongoDB.');

    // 1. Purge existing food tech documents
    console.log('Purging existing Restaurant, FoodItem, FamilyGroup, FoodOrder, and IoTTelemetry records...');
    await Promise.all([
      Restaurant.deleteMany({}),
      FoodItem.deleteMany({}),
      FamilyGroup.deleteMany({}),
      FoodOrder.deleteMany({}),
      IoTTelemetry.deleteMany({})
    ]);

    // 2. Seed 10 Certified Cloud Kitchens & Regional Restaurants
    console.log('Seeding 10 Certified Cloud Kitchens & Regional Restaurants...');
    const restaurantsData = [
      {
        name: 'Arogya Sattva Cloud Kitchen',
        slug: 'arogya-sattva-cloud-kitchen',
        description: 'Pioneering biophysically-formulated meals with certified cold-pressed oils, unpolished millets, and zero reused cooking oil.',
        cuisineTypes: ['Sattvic', 'Millet Bowls & Health', 'Diabetic-Friendly', 'South Indian'],
        fssaiLicenseNumber: '13622011000452',
        hygieneRating: 4.9,
        oilQualityIndex: 96,
        oilReplacementCycleHours: 12,
        primaryCookingMedium: 'Cold_Pressed_Mustard_Oil',
        isCloudKitchen: true,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/arogya-sattva',
          autoApplyModifications: true,
          supportedModifiers: [
            'LOW_SODIUM_KSALT',
            'SUB_FOXTAIL_MILLET',
            'SUB_BROWN_RICE',
            'NO_REFINED_SUGAR_STEVIA',
            'SUB_CURD_FOR_CREAM',
            'EXTRA_FIBER_VEG_BULK',
            'COLD_PRESSED_OIL_ONLY'
          ]
        },
        address: {
          street: 'Plot 42, Hitec City Main Road',
          area: 'Madhapur',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          coordinates: { lat: 17.4483, lng: 78.3915 }
        },
        contact: { phone: '+91 98490 12345', email: 'kitchen@arogyasattva.in' },
        rating: { average: 4.85, count: 342 },
        deliveryTimeEstimateMin: 25,
        costForTwo: 350,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        bannerUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        isVitalsGuardCertified: true,
        status: 'Active'
      },
      {
        name: "Nizam's Royal Heritage Biryani & Curries",
        slug: 'nizams-royal-heritage-biryani',
        description: 'Authentic Hyderabadi dum handis, succulent tandoor meats, and rich salans with smart starch and lipid modification options.',
        cuisineTypes: ['Mughlai', 'North Indian'],
        fssaiLicenseNumber: '13621014000981',
        hygieneRating: 4.6,
        oilQualityIndex: 88,
        oilReplacementCycleHours: 24,
        primaryCookingMedium: 'Desi_Cow_Ghee',
        isCloudKitchen: true,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/nizams-heritage',
          autoApplyModifications: true,
          supportedModifiers: [
            'SUB_BROWN_RICE',
            'LOW_SODIUM_KSALT',
            'EXTRA_FIBER_VEG_BULK',
            'SUB_CURD_FOR_CREAM'
          ]
        },
        address: {
          street: 'Road No 12, Banjara Hills',
          area: 'Banjara Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500034',
          coordinates: { lat: 17.4156, lng: 78.4357 }
        },
        contact: { phone: '+91 98765 43210', email: 'orders@nizamsroyal.in' },
        rating: { average: 4.7, count: 520 },
        deliveryTimeEstimateMin: 35,
        costForTwo: 550,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8',
        bannerUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0',
        isVitalsGuardCertified: true,
        status: 'Active'
      },
      {
        name: 'Dakshin Delights Pure Veg & Tiffin',
        slug: 'dakshin-delights-pure-veg',
        description: 'Traditional fermented dosas, steamed idlis, ragi mudde, and medicinal rasams naturally rich in digestive organic acids.',
        cuisineTypes: ['South Indian', 'Diabetic-Friendly'],
        fssaiLicenseNumber: '13623015000312',
        hygieneRating: 4.8,
        oilQualityIndex: 94,
        oilReplacementCycleHours: 18,
        primaryCookingMedium: 'Cold_Pressed_Sesame_Oil',
        isCloudKitchen: false,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/dakshin-delights',
          autoApplyModifications: true,
          supportedModifiers: [
            'SUB_FOXTAIL_MILLET',
            'LOW_SODIUM_KSALT',
            'EXTRA_FIBER_VEG_BULK'
          ]
        },
        address: {
          street: 'Opposite JNTU Metro Station, KPHB Colony',
          area: 'Kukatpally',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500072',
          coordinates: { lat: 17.4947, lng: 78.3996 }
        },
        contact: { phone: '+91 97000 11223', email: 'care@dakshindelights.in' },
        rating: { average: 4.65, count: 280 },
        deliveryTimeEstimateMin: 20,
        costForTwo: 250,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
        bannerUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4',
        isVitalsGuardCertified: true,
        status: 'Active'
      },
      {
        name: 'Punjab Da Royal Kitchen & Tandoor',
        slug: 'punjab-da-royal-kitchen',
        description: 'Hearty Punjabi gravies, clay-oven tandoor breads, and protein-packed dals with zero artificial coloring and low sodium modifications.',
        cuisineTypes: ['North Indian'],
        fssaiLicenseNumber: '13620012000843',
        hygieneRating: 4.5,
        oilQualityIndex: 86,
        oilReplacementCycleHours: 24,
        primaryCookingMedium: 'Cold_Pressed_Mustard_Oil',
        isCloudKitchen: false,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/punjab-royal',
          autoApplyModifications: true,
          supportedModifiers: [
            'LOW_SODIUM_KSALT',
            'SUB_CURD_FOR_CREAM',
            'EXTRA_FIBER_VEG_BULK'
          ]
        },
        address: {
          street: 'Indiranagar 100ft Road',
          area: 'Gachibowli',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500032',
          coordinates: { lat: 17.4401, lng: 78.3489 }
        },
        contact: { phone: '+91 96111 88990', email: 'tandoor@punjabroyal.in' },
        rating: { average: 4.55, count: 410 },
        deliveryTimeEstimateMin: 30,
        costForTwo: 450,
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db',
        bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        isVitalsGuardCertified: true,
        status: 'Active'
      },
      {
        name: 'AyurBite Herb & Wellness Kitchen',
        slug: 'ayurbite-herb-wellness-kitchen',
        description: 'Therapeutic Ayurvedic formulations with standardized doses of Karela, Methi, Jamun seed, and organic herbs cross-referenced for drug interactions.',
        cuisineTypes: ['Diabetic-Friendly', 'Sattvic', 'Millet Bowls & Health'],
        fssaiLicenseNumber: '13624019000109',
        hygieneRating: 5.0,
        oilQualityIndex: 98,
        oilReplacementCycleHours: 12,
        primaryCookingMedium: 'Desi_Cow_Ghee',
        isCloudKitchen: true,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/ayurbite-wellness',
          autoApplyModifications: true,
          supportedModifiers: [
            'NO_REFINED_SUGAR_STEVIA',
            'LOW_SODIUM_KSALT',
            'SUB_FOXTAIL_MILLET',
            'COLD_PRESSED_OIL_ONLY'
          ]
        },
        address: {
          street: 'Near VNRVJIET Campus, Bachupally',
          area: 'Bachupally',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500090',
          coordinates: { lat: 17.5398, lng: 78.3867 }
        },
        contact: { phone: '+91 99887 76655', email: 'wellness@ayurbite.in' },
        rating: { average: 4.92, count: 195 },
        deliveryTimeEstimateMin: 20,
        costForTwo: 320,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        bannerUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352',
        isVitalsGuardCertified: true,
        status: 'Active'
      },
      {
        name: 'Bengaluru Millet & Dose Labs',
        slug: 'bengaluru-millet-dose-labs',
        description: 'Bio-optimized fermented batter kitchen specializing in low-glycemic ancient grains, barnyard millet idlis, and coconut-oil tempered chutneys.',
        cuisineTypes: ['Millet Bowls & Health', 'South Indian', 'Diabetic-Friendly'],
        fssaiLicenseNumber: '11222002000511',
        hygieneRating: 4.85,
        oilQualityIndex: 95,
        oilReplacementCycleHours: 14,
        primaryCookingMedium: 'Cold_Pressed_Sesame_Oil',
        isCloudKitchen: true,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/blr-millet-labs',
          autoApplyModifications: true,
          supportedModifiers: ['SUB_FOXTAIL_MILLET', 'LOW_SODIUM_KSALT', 'EXTRA_FIBER_VEG_BULK']
        },
        address: {
          street: '12th Main, 100ft Road, Indiranagar',
          area: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          coordinates: { lat: 12.9784, lng: 77.6408 }
        },
        contact: { phone: '+91 98450 44556', email: 'hello@blrmilletlabs.in' },
        rating: { average: 4.88, count: 412 },
        deliveryTimeEstimateMin: 25,
        costForTwo: 380,
        imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4',
        bannerUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
        isVitalsGuardCertified: true,
        status: 'Active'
      },
      {
        name: 'Mumbai Healthy Thali Co.',
        slug: 'mumbai-healthy-thali-co',
        description: 'Balanced Maharastrian and Gujarati sattvic bowls crafted with cold-pressed peanut and mustard oils, jowar bhakris, and sprouted pulse usals.',
        cuisineTypes: ['Sattvic', 'Millet Bowls & Health', 'Diabetic-Friendly'],
        fssaiLicenseNumber: '11521008000723',
        hygieneRating: 4.75,
        oilQualityIndex: 92,
        oilReplacementCycleHours: 16,
        primaryCookingMedium: 'Cold_Pressed_Mustard_Oil',
        isCloudKitchen: true,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/mumbai-healthy-thali',
          autoApplyModifications: true,
          supportedModifiers: ['LOW_SODIUM_KSALT', 'SUB_BROWN_RICE', 'EXTRA_FIBER_VEG_BULK']
        },
        address: {
          street: 'Hill Road, Near Mehboob Studio',
          area: 'Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          coordinates: { lat: 19.0544, lng: 72.8402 }
        },
        contact: { phone: '+91 98200 88776', email: 'orders@mumbaithali.in' },
        rating: { average: 4.72, count: 389 },
        deliveryTimeEstimateMin: 30,
        costForTwo: 420,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        bannerUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        isVitalsGuardCertified: true,
        status: 'Active'
      },
      {
        name: 'Dilli Darbar Low-Sodium Kitchen',
        slug: 'dilli-darbar-low-sodium',
        description: 'Traditional North Indian cuisine reconstructed with strict potassium-balanced sendha namak formulations, zero palm oil, and high-protein gravies.',
        cuisineTypes: ['North Indian', 'Diabetic-Friendly'],
        fssaiLicenseNumber: '13320005000419',
        hygieneRating: 4.7,
        oilQualityIndex: 90,
        oilReplacementCycleHours: 20,
        primaryCookingMedium: 'Desi_Cow_Ghee',
        isCloudKitchen: false,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/dilli-darbar',
          autoApplyModifications: true,
          supportedModifiers: ['LOW_SODIUM_KSALT', 'SUB_CURD_FOR_CREAM', 'SUB_BROWN_RICE']
        },
        address: {
          street: 'Inner Circle, Connaught Place',
          area: 'Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          coordinates: { lat: 28.6315, lng: 77.2167 }
        },
        contact: { phone: '+91 98110 33221', email: 'info@dillidarbar.in' },
        rating: { average: 4.68, count: 470 },
        deliveryTimeEstimateMin: 35,
        costForTwo: 480,
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db',
        bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        isVitalsGuardCertified: true,
        status: 'Active'
      },
      {
        name: 'Chennai Sattvic Tiffin & Podi House',
        slug: 'chennai-sattvic-tiffin',
        description: 'Zero-onion zero-garlic ancient Tamil kitchen crafting wood-pressed sesame oil tiffins, medicinal kootus, and moringa rasams.',
        cuisineTypes: ['South Indian', 'Sattvic'],
        fssaiLicenseNumber: '12423001000889',
        hygieneRating: 4.9,
        oilQualityIndex: 97,
        oilReplacementCycleHours: 12,
        primaryCookingMedium: 'Cold_Pressed_Sesame_Oil',
        isCloudKitchen: false,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/chennai-sattvic',
          autoApplyModifications: true,
          supportedModifiers: ['LOW_SODIUM_KSALT', 'SUB_FOXTAIL_MILLET', 'EXTRA_FIBER_VEG_BULK']
        },
        address: {
          street: 'North Mada Street, Mylapore',
          area: 'Mylapore',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600004',
          coordinates: { lat: 13.0336, lng: 80.2694 }
        },
        contact: { phone: '+91 94440 99887', email: 'tiffin@chennaisattvic.in' },
        rating: { average: 4.89, count: 310 },
        deliveryTimeEstimateMin: 20,
        costForTwo: 280,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
        bannerUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4',
        isVitalsGuardCertified: true,
        status: 'Active'
      },
      {
        name: 'Pune Ketogenic & High-Protein Kitchen',
        slug: 'pune-keto-high-protein',
        description: 'Elite metabolic fitness kitchen preparing high-fat ketogenic thalis, almond-flour bhakris, grilled paneer tikka, and MCT-infused bone broths.',
        cuisineTypes: ['Millet Bowls & Health', 'Diabetic-Friendly'],
        fssaiLicenseNumber: '11522019000344',
        hygieneRating: 4.8,
        oilQualityIndex: 94,
        oilReplacementCycleHours: 18,
        primaryCookingMedium: 'Desi_Cow_Ghee',
        isCloudKitchen: true,
        kitchenDisplaySystem: {
          enabled: true,
          webhookUrl: 'https://kds.biosyncai.internal/webhook/pune-keto',
          autoApplyModifications: true,
          supportedModifiers: ['LOW_SODIUM_KSALT', 'COLD_PRESSED_OIL_ONLY', 'EXTRA_FIBER_VEG_BULK']
        },
        address: {
          street: 'Lane 7, Koregaon Park',
          area: 'Koregaon Park',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          coordinates: { lat: 18.5362, lng: 73.8940 }
        },
        contact: { phone: '+91 98900 12398', email: 'fit@puneketo.in' },
        rating: { average: 4.79, count: 260 },
        deliveryTimeEstimateMin: 25,
        costForTwo: 460,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        bannerUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        isVitalsGuardCertified: true,
        status: 'Active'
      }
    ];

    const createdRestaurants = await Restaurant.insertMany(restaurantsData);
    console.log(`Successfully seeded ${createdRestaurants.length} restaurants.`);

    const rMap = {};
    createdRestaurants.forEach(r => { rMap[r.slug] = r._id; });

    // 3. Seed 52 Biophysically Annotated Food Items
    console.log('Seeding 52 Biophysically Annotated Food Items...');
    const foodItemsData = [
      // -------------------------------------------------------------
      // 1. Arogya Sattva Cloud Kitchen
      // -------------------------------------------------------------
      {
        restaurant: rMap['arogya-sattva-cloud-kitchen'],
        name: 'Foxtail Millet Vegetable Dum Pulao',
        slug: 'foxtail-millet-veg-pulao',
        description: 'Slow-simmered unpolished foxtail millet loaded with French beans, carrots, and cold-pressed mustard oil temper. High amylose prevents glycemic spikes.',
        category: 'Millet_Specialty',
        dietaryType: 'Veg',
        price: 240,
        imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0',
        servingWeightGrams: 350,
        calories: 360,
        carbohydrates_g: 48,
        netCarbohydrates_g: 38,
        protein_g: 11,
        fat_g: 12,
        fiber_g: 10,
        sugar_g: 3,
        sodium_mg: 380,
        potassium_mg: 420,
        glycemicIndex: 44,
        glycemicLoad: 16.7,
        grainType: 'Foxtail_Millet',
        amyloseRatio: 0.32,
        resistantStarchFactor: 0.28,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 200, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak (Low Sodium)', sodiumDelta_mg: -180, priceDelta: 0 },
          { code: 'EXTRA_FIBER_VEG_BULK', label: 'Add Double Steamed Veggies (+5g Fiber)', carbDelta_g: -4, calorieDelta: 20, priceDelta: 30 }
        ],
        contraindications: [],
        tags: ['Diabetic-Safe', 'High Fiber', 'Low GI', 'Gluten-Free']
      },
      {
        restaurant: rMap['arogya-sattva-cloud-kitchen'],
        name: 'Steamed Sprouted Moong Dosa with Flax Chutney',
        slug: 'sprouted-moong-dosa-flax',
        description: '100% whole green gram sprouts batter, griddled with minimal cold-pressed sesame oil. Served with roasted flaxseed and mint raita.',
        category: 'Breakfast',
        dietaryType: 'Vegan',
        price: 180,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
        servingWeightGrams: 280,
        calories: 290,
        carbohydrates_g: 34,
        netCarbohydrates_g: 24,
        protein_g: 16,
        fat_g: 9,
        fiber_g: 10,
        sugar_g: 2,
        sodium_mg: 290,
        potassium_mg: 510,
        glycemicIndex: 38,
        glycemicLoad: 9.1,
        grainType: 'Lentil_Dal',
        amyloseRatio: 0.35,
        resistantStarchFactor: 0.30,
        fermentationType: 'Lactic_Acid_Fermented',
        activeBotanicals: [{ name: 'Methi', concentration_mg: 300, activeMarker: '4-hydroxyisoleucine' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak (Low Sodium)', sodiumDelta_mg: -120, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Diabetic-Safe', 'High Protein', 'Vegan', 'Superfood']
      },
      {
        restaurant: rMap['arogya-sattva-cloud-kitchen'],
        name: 'Ragi Finger Millet Roti with Palak Dal',
        slug: 'ragi-roti-palak-dal',
        description: 'Two hand-patted finger millet rotis rich in bioavailable calcium, accompanied by spinach-toor dal tempered with cumin and garlic.',
        category: 'Main_Course',
        dietaryType: 'Veg',
        price: 210,
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec',
        servingWeightGrams: 360,
        calories: 340,
        carbohydrates_g: 52,
        netCarbohydrates_g: 41,
        protein_g: 14,
        fat_g: 8,
        fiber_g: 11,
        sugar_g: 2,
        sodium_mg: 340,
        potassium_mg: 620,
        glycemicIndex: 48,
        glycemicLoad: 19.7,
        grainType: 'Ragi_Finger_Millet',
        amyloseRatio: 0.28,
        resistantStarchFactor: 0.22,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 250, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LEACH_POTASSIUM_BOIL', label: 'Double-Boil Leach Spinach (For CKD Patients)', sodiumDelta_mg: 0, priceDelta: 0 }
        ],
        contraindications: ['CKD_POTASSIUM_RESTRICTION'],
        tags: ['Calcium Rich', 'Heart Friendly', 'Traditional']
      },
      {
        restaurant: rMap['arogya-sattva-cloud-kitchen'],
        name: 'Kodo Millet Curd Rice with Fresh Pomegranate',
        slug: 'kodo-millet-curd-rice',
        description: 'Naturally cooled kodo millet folded into probiotic-rich A2 buffalo curd, mustard seed tadka, and antioxidant pomegranate.',
        category: 'Main_Course',
        dietaryType: 'Veg',
        price: 190,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        servingWeightGrams: 320,
        calories: 275,
        carbohydrates_g: 38,
        netCarbohydrates_g: 31,
        protein_g: 9,
        fat_g: 7,
        fiber_g: 7,
        sugar_g: 4,
        sodium_mg: 240,
        potassium_mg: 310,
        glycemicIndex: 42,
        glycemicLoad: 13.0,
        grainType: 'Foxtail_Millet',
        amyloseRatio: 0.30,
        resistantStarchFactor: 0.34,
        fermentationType: 'Lactic_Acid_Fermented',
        activeBotanicals: [{ name: 'Amla', concentration_mg: 120, activeMarker: 'Ascorbic_Acid_Tannins' }],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Rock Salt Sendha Namak', sodiumDelta_mg: -100, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Probiotic', 'Diabetic-Safe', 'Gut Health']
      },
      {
        restaurant: rMap['arogya-sattva-cloud-kitchen'],
        name: 'Ashwagandha Turmeric Golden Elixir',
        slug: 'ashwagandha-turmeric-golden-elixir',
        description: 'Warm almond milk infused with standardized 5% Withanolides KSM-66 extract, 95% Curcuminoids, and black pepper piperine.',
        category: 'Beverage',
        dietaryType: 'Vegan',
        price: 140,
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        servingWeightGrams: 220,
        calories: 95,
        carbohydrates_g: 7,
        netCarbohydrates_g: 5,
        protein_g: 4,
        fat_g: 5,
        fiber_g: 2,
        sugar_g: 1,
        sodium_mg: 60,
        potassium_mg: 180,
        glycemicIndex: 20,
        glycemicLoad: 1.0,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [
          { name: 'Ashwagandha', concentration_mg: 400, activeMarker: 'Withanolides' },
          { name: 'Turmeric_Curcumin', concentration_mg: 350, activeMarker: 'Curcuminoids' }
        ],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: false,
        contraindications: [],
        tags: ['Longevity', 'Anti-Inflammatory', 'Sleep Aid']
      },

      // -------------------------------------------------------------
      // 2. Nizam's Royal Heritage Biryani
      // -------------------------------------------------------------
      {
        restaurant: rMap['nizams-royal-heritage-biryani'],
        name: 'Hyderabadi Dum Chicken Biryani (Single-Pot 1kg)',
        slug: 'hyderabadi-dum-chicken-biryani-1kg',
        description: 'Traditional slow-cooked dum biryani with tender chicken pieces and long-grain Basmati rice infused with saffron and whole spices. Perfect for joint-family disaggregation.',
        category: 'Rice_Biryani',
        dietaryType: 'Non-Veg',
        price: 520,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8',
        servingWeightGrams: 1000,
        calories: 1450,
        carbohydrates_g: 160,
        netCarbohydrates_g: 148,
        protein_g: 85,
        fat_g: 52,
        fiber_g: 12,
        sugar_g: 6,
        sodium_mg: 1850,
        potassium_mg: 980,
        glycemicIndex: 58,
        glycemicLoad: 85.8,
        grainType: 'Basmati_Aged_Rice',
        amyloseRatio: 0.26,
        resistantStarchFactor: 0.15,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 150, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'SUB_BROWN_RICE', label: 'Use Aged Brown Basmati Rice (Lower GI)', carbDelta_g: -15, calorieDelta: -80, priceDelta: 50 },
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak (Reduce Sodium 40%)', sodiumDelta_mg: -700, priceDelta: 0 },
          { code: 'EXTRA_FIBER_VEG_BULK', label: 'Add Double Mint & Cucumber Raita', carbDelta_g: 4, calorieDelta: 60, priceDelta: 40 }
        ],
        contraindications: ['SEVERE_HYPERTENSION_SODIUM'],
        tags: ['Family Handi', 'High Protein', 'Basmati', 'Cheat Mode Favorite']
      },
      {
        restaurant: rMap['nizams-royal-heritage-biryani'],
        name: 'Tandoori Murgh (Half Chicken)',
        slug: 'tandoori-murgh-half',
        description: 'Half bone-in chicken marinated in hung curd, Kashmiri red chili, ginger-garlic paste, and tandoor roasted. Extremely low net carb profile.',
        category: 'Appetizer',
        dietaryType: 'Non-Veg',
        price: 340,
        imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28',
        servingWeightGrams: 420,
        calories: 520,
        carbohydrates_g: 6,
        netCarbohydrates_g: 4,
        protein_g: 62,
        fat_g: 26,
        fiber_g: 2,
        sugar_g: 1,
        sodium_mg: 620,
        potassium_mg: 580,
        glycemicIndex: 15,
        glycemicLoad: 0.6,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 300, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Low Sodium Sendha Salt', sodiumDelta_mg: -250, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Keto-Friendly', 'Diabetic-Safe', 'High Protein', 'Zero Carb']
      },
      {
        restaurant: rMap['nizams-royal-heritage-biryani'],
        name: 'Mutton Nihari with Khameeri Roti',
        slug: 'mutton-nihari-khameeri-roti',
        description: 'Slow-braised mutton shanks in rich spiced bone-marrow gravy, served with fermented khameeri roti. Highly indulgent rich cheat meal.',
        category: 'Main_Course',
        dietaryType: 'Non-Veg',
        price: 480,
        imageUrl: 'https://images.unsplash.com/photo-1545247181-516773cae754',
        servingWeightGrams: 500,
        calories: 820,
        carbohydrates_g: 72,
        netCarbohydrates_g: 66,
        protein_g: 48,
        fat_g: 42,
        fiber_g: 6,
        sugar_g: 4,
        sodium_mg: 1280,
        potassium_mg: 640,
        glycemicIndex: 72,
        glycemicLoad: 47.5,
        grainType: 'Refined_Maida',
        amyloseRatio: 0.16,
        resistantStarchFactor: 0.04,
        fermentationType: 'Yeast_Leavened',
        activeBotanicals: [],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'SUB_CURD_FOR_CREAM', label: 'Light Broth (Skim Floating Fat -18g Fat)', calorieDelta: -160, priceDelta: 0 }
        ],
        contraindications: ['SEVERE_TRIGLYCERIDE_SURGE', 'SEVERE_HYPERTENSION_SODIUM'],
        tags: ['Cheat Mode Only', 'Rich Gravy', 'High Fat']
      },
      {
        restaurant: rMap['nizams-royal-heritage-biryani'],
        name: 'Hyderabadi Mirchi Ka Salan (Diabetic Adjusted)',
        slug: 'hyderabadi-mirchi-ka-salan-adjusted',
        description: 'Spiced long Bhavnagri chillies simmered in roasted peanut, sesame, and dry coconut gravy, balanced with tamarind.',
        category: 'Side_Salad',
        dietaryType: 'Veg',
        price: 180,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        servingWeightGrams: 250,
        calories: 220,
        carbohydrates_g: 14,
        netCarbohydrates_g: 8,
        protein_g: 6,
        fat_g: 16,
        fiber_g: 6,
        sugar_g: 3,
        sodium_mg: 420,
        potassium_mg: 340,
        glycemicIndex: 35,
        glycemicLoad: 2.8,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Methi', concentration_mg: 180, activeMarker: '4-hydroxyisoleucine' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak', sodiumDelta_mg: -150, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Keto-Friendly', 'Low GI', 'Sesame Enriched']
      },
      {
        restaurant: rMap['nizams-royal-heritage-biryani'],
        name: 'Boti Kebab Skewers with Mint Chutney',
        slug: 'boti-kebab-skewers',
        description: 'Char-grilled tender lamb cubes marinated in green papaya, roasted cumin, and black cardamom. Zero starchy fillers.',
        category: 'Appetizer',
        dietaryType: 'Non-Veg',
        price: 380,
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
        servingWeightGrams: 300,
        calories: 410,
        carbohydrates_g: 4,
        netCarbohydrates_g: 2,
        protein_g: 44,
        fat_g: 24,
        fiber_g: 2,
        sugar_g: 1,
        sodium_mg: 580,
        potassium_mg: 490,
        glycemicIndex: 12,
        glycemicLoad: 0.2,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 120, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak (Low Sodium)', sodiumDelta_mg: -220, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Zero Carb', 'Keto', 'High Protein']
      },

      // -------------------------------------------------------------
      // 3. Dakshin Delights Pure Veg & Tiffin
      // -------------------------------------------------------------
      {
        restaurant: rMap['dakshin-delights-pure-veg'],
        name: 'Ghee Podi Idli (4 Pieces) with Sambar',
        slug: 'ghee-podi-idli-sambar',
        description: 'Steamed naturally fermented rice & urad dal cakes, coated in spiced gun powder and desi cow ghee. Sambar rich in drumstick & tamarind.',
        category: 'Breakfast',
        dietaryType: 'Veg',
        price: 140,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
        servingWeightGrams: 320,
        calories: 380,
        carbohydrates_g: 64,
        netCarbohydrates_g: 56,
        protein_g: 10,
        fat_g: 8,
        fiber_g: 8,
        sugar_g: 4,
        sodium_mg: 580,
        potassium_mg: 440,
        glycemicIndex: 65,
        glycemicLoad: 36.4,
        grainType: 'Sona_Masoori_White_Rice',
        amyloseRatio: 0.16,
        resistantStarchFactor: 0.12,
        fermentationType: 'Lactic_Acid_Fermented',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 80, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'SUB_FOXTAIL_MILLET', label: 'Switch to Foxtail Millet Idlis (Lower GI 45)', carbDelta_g: -8, calorieDelta: -40, priceDelta: 20 },
          { code: 'LOW_SODIUM_KSALT', label: 'Low Sodium Sambar', sodiumDelta_mg: -220, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Traditional', 'Breakfast', 'Fermented']
      },
      {
        restaurant: rMap['dakshin-delights-pure-veg'],
        name: 'Traditional Medu Vada (2 Pcs) with Coconut Chutney',
        slug: 'traditional-medu-vada-chutney',
        description: 'Crispy deep-fried black gram fritters. High in fat and rapid absorption.',
        category: 'Breakfast',
        dietaryType: 'Veg',
        price: 110,
        imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4',
        servingWeightGrams: 220,
        calories: 460,
        carbohydrates_g: 38,
        netCarbohydrates_g: 32,
        protein_g: 12,
        fat_g: 30,
        fiber_g: 6,
        sugar_g: 2,
        sodium_mg: 640,
        potassium_mg: 380,
        glycemicIndex: 59,
        glycemicLoad: 18.9,
        grainType: 'Lentil_Dal',
        amyloseRatio: 0.30,
        resistantStarchFactor: 0.08,
        fermentationType: 'None',
        activeBotanicals: [],
        cookingMedium: 'Refined_Sunflower_Oil',
        allowModifications: false,
        contraindications: ['SEVERE_TRIGLYCERIDE_SURGE'],
        tags: ['Cheat Mode', 'Deep Fried', 'Snack']
      },
      {
        restaurant: rMap['dakshin-delights-pure-veg'],
        name: 'Brown Rice Curd Rice with Pomegranate & Ginger',
        slug: 'brown-rice-curd-rice',
        description: 'Probiotic-rich tempered curd rice using fiber-rich brown rice, crushed fresh ginger, curry leaves, and antioxidant pomegranate arils.',
        category: 'Main_Course',
        dietaryType: 'Veg',
        price: 150,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        servingWeightGrams: 300,
        calories: 280,
        carbohydrates_g: 42,
        netCarbohydrates_g: 36,
        protein_g: 8,
        fat_g: 7,
        fiber_g: 6,
        sugar_g: 5,
        sodium_mg: 280,
        potassium_mg: 320,
        glycemicIndex: 45,
        glycemicLoad: 16.2,
        grainType: 'Brown_Rice',
        amyloseRatio: 0.24,
        resistantStarchFactor: 0.32,
        fermentationType: 'Lactic_Acid_Fermented',
        activeBotanicals: [{ name: 'Amla', concentration_mg: 150, activeMarker: 'Ascorbic_Acid_Tannins' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Rock Salt (Sendha Namak)', sodiumDelta_mg: -100, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Gut Health', 'Probiotic', 'Cooling', 'Diabetic-Safe']
      },
      {
        restaurant: rMap['dakshin-delights-pure-veg'],
        name: 'Ragi Mudde with Drumstick Sambar',
        slug: 'ragi-mudde-drumstick-sambar',
        description: 'Steamed finger millet dumpling packed with calcium, accompanied by aromatic slow-simmered drumstick and tomato sambar.',
        category: 'Main_Course',
        dietaryType: 'Vegan',
        price: 160,
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec',
        servingWeightGrams: 340,
        calories: 310,
        carbohydrates_g: 54,
        netCarbohydrates_g: 43,
        protein_g: 10,
        fat_g: 4,
        fiber_g: 11,
        sugar_g: 3,
        sodium_mg: 390,
        potassium_mg: 520,
        glycemicIndex: 46,
        glycemicLoad: 19.8,
        grainType: 'Ragi_Finger_Millet',
        amyloseRatio: 0.29,
        resistantStarchFactor: 0.24,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 150, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Low Sodium Sendha Namak', sodiumDelta_mg: -140, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Calcium Power', 'Gluten Free', 'Traditional']
      },
      {
        restaurant: rMap['dakshin-delights-pure-veg'],
        name: 'Oats & Flax Masala Dosa with Tomato Chutney',
        slug: 'oats-flax-masala-dosa',
        description: 'Crisp rolled crepe made of rolled oats and golden flax seeds with spicy potato-onion filling. High beta-glucan delays gastric transit.',
        category: 'Breakfast',
        dietaryType: 'Veg',
        price: 175,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
        servingWeightGrams: 290,
        calories: 320,
        carbohydrates_g: 44,
        netCarbohydrates_g: 35,
        protein_g: 11,
        fat_g: 10,
        fiber_g: 9,
        sugar_g: 3,
        sodium_mg: 380,
        potassium_mg: 410,
        glycemicIndex: 42,
        glycemicLoad: 14.7,
        grainType: 'Lentil_Dal',
        amyloseRatio: 0.32,
        resistantStarchFactor: 0.22,
        fermentationType: 'Lactic_Acid_Fermented',
        activeBotanicals: [{ name: 'Methi', concentration_mg: 200, activeMarker: '4-hydroxyisoleucine' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak', sodiumDelta_mg: -120, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Heart Friendly', 'Beta-Glucan', 'Diabetic-Safe']
      },

      // -------------------------------------------------------------
      // 4. Punjab Da Royal Kitchen & Tandoor
      // -------------------------------------------------------------
      {
        restaurant: rMap['punjab-da-royal-kitchen'],
        name: 'Dal Makhani (Slow-Cooked Black Lentils)',
        slug: 'dal-makhani-classic',
        description: 'Overnight simmered whole black urad and kidney beans, tempered with Kashmiri chili and butter. Rich in soluble fiber, but high in dairy fats.',
        category: 'Main_Course',
        dietaryType: 'Veg',
        price: 260,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        servingWeightGrams: 350,
        calories: 420,
        carbohydrates_g: 44,
        netCarbohydrates_g: 32,
        protein_g: 17,
        fat_g: 22,
        fiber_g: 12,
        sugar_g: 3,
        sodium_mg: 720,
        potassium_mg: 580,
        glycemicIndex: 42,
        glycemicLoad: 13.4,
        grainType: 'Lentil_Dal',
        amyloseRatio: 0.34,
        resistantStarchFactor: 0.25,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 200, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'SUB_CURD_FOR_CREAM', label: 'Use Low-Fat Curd Sub (Saves 12g Saturated Fat)', calorieDelta: -110, priceDelta: 0 },
          { code: 'LOW_SODIUM_KSALT', label: 'Low Sodium Sendha Namak', sodiumDelta_mg: -320, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['High Protein', 'Rich', 'North Indian Classic']
      },
      {
        restaurant: rMap['punjab-da-royal-kitchen'],
        name: 'Butter Chicken Masala with Butter Naan',
        slug: 'butter-chicken-with-butter-naan',
        description: 'Tender chicken tikka in a velvet tomato, cashew nut, and butter gravy, accompanied by refined maida butter naan. Classic high-spike combo.',
        category: 'Main_Course',
        dietaryType: 'Non-Veg',
        price: 420,
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db',
        servingWeightGrams: 520,
        calories: 910,
        carbohydrates_g: 88,
        netCarbohydrates_g: 82,
        protein_g: 54,
        fat_g: 45,
        fiber_g: 6,
        sugar_g: 8,
        sodium_mg: 1420,
        potassium_mg: 620,
        glycemicIndex: 78,
        glycemicLoad: 64.0,
        grainType: 'Refined_Maida',
        amyloseRatio: 0.14,
        resistantStarchFactor: 0.02,
        fermentationType: 'Yeast_Leavened',
        activeBotanicals: [],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'SUB_CURD_FOR_CREAM', label: 'Substitute Malai with Greek Curd', calorieDelta: -140, priceDelta: 0 },
          { code: 'LOW_SODIUM_KSALT', label: 'Low-Sodium Preparation', sodiumDelta_mg: -550, priceDelta: 0 }
        ],
        contraindications: ['SEVERE_HYPERTENSION_SODIUM', 'SEVERE_TRIGLYCERIDE_SURGE'],
        tags: ['Cheat Mode Only', 'High Carb', 'High Fat']
      },
      {
        restaurant: rMap['punjab-da-royal-kitchen'],
        name: 'Whole Wheat Tandoori Roti (3 Pcs)',
        slug: 'whole-wheat-tandoori-roti',
        description: 'Traditional tandoor-baked flatbread made with 100% whole wheat chakki atta without refined flour or added sugar.',
        category: 'Breads',
        dietaryType: 'Vegan',
        price: 90,
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641',
        servingWeightGrams: 180,
        calories: 270,
        carbohydrates_g: 52,
        netCarbohydrates_g: 44,
        protein_g: 9,
        fat_g: 2,
        fiber_g: 8,
        sugar_g: 1,
        sodium_mg: 180,
        potassium_mg: 240,
        glycemicIndex: 52,
        glycemicLoad: 22.9,
        grainType: 'Whole_Wheat_Atta',
        amyloseRatio: 0.22,
        resistantStarchFactor: 0.10,
        fermentationType: 'None',
        activeBotanicals: [],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: false,
        contraindications: ['CELIAC_GLUTEN'],
        tags: ['Whole Grain', 'Low Fat', 'Traditional Bread']
      },
      {
        restaurant: rMap['punjab-da-royal-kitchen'],
        name: 'Sarson Ka Saag with Makki Di Roti',
        slug: 'sarson-ka-saag-makki-roti',
        description: 'Slow-simmered winter mustard greens, bathua, and spinach with coarse yellow cornmeal flatbread, dollop of white butter.',
        category: 'Main_Course',
        dietaryType: 'Veg',
        price: 310,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        servingWeightGrams: 420,
        calories: 450,
        carbohydrates_g: 46,
        netCarbohydrates_g: 34,
        protein_g: 14,
        fat_g: 22,
        fiber_g: 12,
        sugar_g: 3,
        sodium_mg: 580,
        potassium_mg: 820,
        glycemicIndex: 48,
        glycemicLoad: 16.3,
        grainType: 'Whole_Wheat_Atta',
        amyloseRatio: 0.24,
        resistantStarchFactor: 0.18,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 220, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak', sodiumDelta_mg: -220, priceDelta: 0 },
          { code: 'LEACH_POTASSIUM_BOIL', label: 'Leach Greens for CKD Patients', sodiumDelta_mg: 0, priceDelta: 0 }
        ],
        contraindications: ['CKD_POTASSIUM_RESTRICTION'],
        tags: ['Winter Special', 'High Fiber', 'Iron Rich']
      },
      {
        restaurant: rMap['punjab-da-royal-kitchen'],
        name: 'Tandoori Paneer Tikka (6 Pcs)',
        slug: 'tandoori-paneer-tikka',
        description: 'Fresh cow milk cottage cheese cubes marinated in hung curd, carom seeds (ajwain), and mustard oil, smoked in tandoor.',
        category: 'Appetizer',
        dietaryType: 'Veg',
        price: 280,
        imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8',
        servingWeightGrams: 300,
        calories: 390,
        carbohydrates_g: 8,
        netCarbohydrates_g: 6,
        protein_g: 26,
        fat_g: 28,
        fiber_g: 2,
        sugar_g: 2,
        sodium_mg: 480,
        potassium_mg: 320,
        glycemicIndex: 18,
        glycemicLoad: 1.1,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 180, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak', sodiumDelta_mg: -180, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Keto Friendly', 'High Protein', 'Gluten Free']
      },

      // -------------------------------------------------------------
      // 5. AyurBite Herb & Wellness Kitchen
      // -------------------------------------------------------------
      {
        restaurant: rMap['ayurbite-herb-wellness-kitchen'],
        name: 'Karela Jamun Glucose Stabilizer Bowl',
        slug: 'karela-jamun-glucose-stabilizer-bowl',
        description: 'Steamed bitter gourd slices lightly crusted with roasted chana powder, fresh Jamun seed infusion, and cold-pressed mustard oil. Potent AMPK activator.',
        category: 'Ayur_Therapeutic',
        dietaryType: 'Vegan',
        price: 220,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        servingWeightGrams: 260,
        calories: 180,
        carbohydrates_g: 18,
        netCarbohydrates_g: 10,
        protein_g: 8,
        fat_g: 6,
        fiber_g: 8,
        sugar_g: 2,
        sodium_mg: 210,
        potassium_mg: 490,
        glycemicIndex: 24,
        glycemicLoad: 2.4,
        grainType: 'Besan_Gram_Flour',
        amyloseRatio: 0.32,
        resistantStarchFactor: 0.20,
        fermentationType: 'None',
        activeBotanicals: [
          { name: 'Karela', concentration_mg: 500, activeMarker: 'Charantin' },
          { name: 'Jamun', concentration_mg: 350, activeMarker: 'Jamboline' }
        ],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak', sodiumDelta_mg: -80, priceDelta: 0 }
        ],
        contraindications: ['SULPHONYLUREA_HYPO_HAZARD'],
        tags: ['Diabetic Miracle', 'AMPK Activator', 'Ayurvedic', 'Low Glycemic']
      },
      {
        restaurant: rMap['ayurbite-herb-wellness-kitchen'],
        name: 'Methi Moong High-Fiber Therapeutic Khichdi',
        slug: 'methi-moong-khichdi',
        description: 'Dehusked yellow moong dal and sprouted fenugreek seeds simmered with A2 cow ghee, cumin, and fresh turmeric. 4-hydroxyisoleucine stimulates basal insulin response.',
        category: 'Ayur_Therapeutic',
        dietaryType: 'Veg',
        price: 240,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        servingWeightGrams: 340,
        calories: 310,
        carbohydrates_g: 42,
        netCarbohydrates_g: 31,
        protein_g: 15,
        fat_g: 9,
        fiber_g: 11,
        sugar_g: 2,
        sodium_mg: 310,
        potassium_mg: 480,
        glycemicIndex: 36,
        glycemicLoad: 11.2,
        grainType: 'Lentil_Dal',
        amyloseRatio: 0.35,
        resistantStarchFactor: 0.30,
        fermentationType: 'None',
        activeBotanicals: [
          { name: 'Methi', concentration_mg: 600, activeMarker: '4-hydroxyisoleucine' },
          { name: 'Turmeric_Curcumin', concentration_mg: 400, activeMarker: 'Curcuminoids' }
        ],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Rock Salt (Sendha Namak)', sodiumDelta_mg: -120, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Insulin Sensitizer', 'Easy Digest', 'Ayurvedic Powerhouse']
      },
      {
        restaurant: rMap['ayurbite-herb-wellness-kitchen'],
        name: 'Amla Ashwagandha Rejuvenation Smoothie (Zero Added Sugar)',
        slug: 'amla-ashwagandha-smoothie',
        description: 'Fresh Indian gooseberry (120mg bio-identical Vitamin C) blended with KSM-66 organic Ashwagandha root extract and almond milk. Sweetened naturally with green stevia.',
        category: 'Beverage',
        dietaryType: 'Vegan',
        price: 160,
        imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888',
        servingWeightGrams: 250,
        calories: 120,
        carbohydrates_g: 12,
        netCarbohydrates_g: 8,
        protein_g: 4,
        fat_g: 6,
        fiber_g: 4,
        sugar_g: 3,
        sodium_mg: 45,
        potassium_mg: 280,
        glycemicIndex: 22,
        glycemicLoad: 1.8,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [
          { name: 'Amla', concentration_mg: 400, activeMarker: 'Ascorbic_Acid_Tannins' },
          { name: 'Ashwagandha', concentration_mg: 300, activeMarker: 'Withanolides' }
        ],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: false,
        contraindications: [],
        tags: ['Immunity Booster', 'Adaptogen', 'Zero Sugar', 'Anti-Aging']
      },
      {
        restaurant: rMap['ayurbite-herb-wellness-kitchen'],
        name: 'Giloy Neem Detox Rasam with Moringa Pods',
        slug: 'giloy-neem-detox-rasam',
        description: 'Warm, peppery botanical rasam with wild Giloy stem water, fresh neem leaf bitters, tender moringa drumsticks, and crushed black pepper.',
        category: 'Ayur_Therapeutic',
        dietaryType: 'Vegan',
        price: 150,
        imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554',
        servingWeightGrams: 280,
        calories: 85,
        carbohydrates_g: 10,
        netCarbohydrates_g: 6,
        protein_g: 3,
        fat_g: 3,
        fiber_g: 4,
        sugar_g: 1,
        sodium_mg: 280,
        potassium_mg: 380,
        glycemicIndex: 18,
        glycemicLoad: 1.1,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [
          { name: 'Giloy', concentration_mg: 450, activeMarker: 'Cordifolioside' },
          { name: 'Neem', concentration_mg: 200, activeMarker: 'Azadirachtin' }
        ],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak', sodiumDelta_mg: -100, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Immuno-Modulator', 'Liver Cleanser', 'Detox Broth']
      },
      {
        restaurant: rMap['ayurbite-herb-wellness-kitchen'],
        name: 'Triphala Digestion Elixir (Herbal Night Brew)',
        slug: 'triphala-digestion-elixir',
        description: 'Harmonious blend of Haritaki, Bibhitaki, and Amalaki decoction brewed with a dash of ginger juice and licorice root.',
        category: 'Beverage',
        dietaryType: 'Vegan',
        price: 130,
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        servingWeightGrams: 200,
        calories: 45,
        carbohydrates_g: 6,
        netCarbohydrates_g: 4,
        protein_g: 1,
        fat_g: 0.5,
        fiber_g: 2,
        sugar_g: 1,
        sodium_mg: 30,
        potassium_mg: 160,
        glycemicIndex: 15,
        glycemicLoad: 0.6,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [
          { name: 'Triphala', concentration_mg: 500, activeMarker: 'Tannins_Chebulinic_Acid' },
          { name: 'Amla', concentration_mg: 250, activeMarker: 'Ascorbic_Acid' }
        ],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: false,
        contraindications: [],
        tags: ['Digestive Tonic', 'Colon Cleanser', 'Ayurvedic Classic']
      },

      // -------------------------------------------------------------
      // 6. Bengaluru Millet & Dose Labs
      // -------------------------------------------------------------
      {
        restaurant: rMap['bengaluru-millet-dose-labs'],
        name: 'Barnyard Millet & Urad Crispy Benne Dosa',
        slug: 'barnyard-millet-benne-dosa',
        description: 'Fermented for 18 hours, rich in lactic acid and short-chain fatty acids. Griddled with dollop of pure A2 cultured butter.',
        category: 'Breakfast',
        dietaryType: 'Veg',
        price: 195,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
        servingWeightGrams: 270,
        calories: 320,
        carbohydrates_g: 36,
        netCarbohydrates_g: 28,
        protein_g: 12,
        fat_g: 14,
        fiber_g: 8,
        sugar_g: 2,
        sodium_mg: 320,
        potassium_mg: 380,
        glycemicIndex: 40,
        glycemicLoad: 11.2,
        grainType: 'Foxtail_Millet',
        amyloseRatio: 0.33,
        resistantStarchFactor: 0.31,
        fermentationType: 'Lactic_Acid_Fermented',
        activeBotanicals: [{ name: 'Methi', concentration_mg: 220, activeMarker: '4-hydroxyisoleucine' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak (Low Sodium)', sodiumDelta_mg: -130, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Millet Superfood', 'Fermented Gut Health', 'Low GI']
      },
      {
        restaurant: rMap['bengaluru-millet-dose-labs'],
        name: 'Little Millet Bisi Bele Bath with Flax Boondi',
        slug: 'little-millet-bisi-bele-bath',
        description: 'Authentic Karnataka spicy lentil-millet pot dish with assorted vegetables, tamarind, and roasted flaxseed crunch.',
        category: 'Main_Course',
        dietaryType: 'Veg',
        price: 230,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        servingWeightGrams: 360,
        calories: 370,
        carbohydrates_g: 50,
        netCarbohydrates_g: 38,
        protein_g: 13,
        fat_g: 11,
        fiber_g: 12,
        sugar_g: 3,
        sodium_mg: 420,
        potassium_mg: 490,
        glycemicIndex: 43,
        glycemicLoad: 16.3,
        grainType: 'Foxtail_Millet',
        amyloseRatio: 0.31,
        resistantStarchFactor: 0.26,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 160, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak', sodiumDelta_mg: -160, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Nutritious Lunch', 'High Fiber', 'Slow Digesting']
      },
      {
        restaurant: rMap['bengaluru-millet-dose-labs'],
        name: 'Steamed Kodo Idlis with Flax Mint Podi',
        slug: 'steamed-kodo-idlis-podi',
        description: 'Pillow-soft steamed idlis prepared entirely with unpolished Kodo millet and black gram. Zero white rice.',
        category: 'Breakfast',
        dietaryType: 'Vegan',
        price: 150,
        imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4',
        servingWeightGrams: 280,
        calories: 250,
        carbohydrates_g: 42,
        netCarbohydrates_g: 34,
        protein_g: 9,
        fat_g: 4,
        fiber_g: 8,
        sugar_g: 2,
        sodium_mg: 280,
        potassium_mg: 330,
        glycemicIndex: 41,
        glycemicLoad: 13.9,
        grainType: 'Foxtail_Millet',
        amyloseRatio: 0.34,
        resistantStarchFactor: 0.28,
        fermentationType: 'Lactic_Acid_Fermented',
        activeBotanicals: [],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Low Sodium Sendha Namak', sodiumDelta_mg: -100, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Breakfast', 'Diabetic-Safe', 'Gluten Free']
      },
      {
        restaurant: rMap['bengaluru-millet-dose-labs'],
        name: 'Proso Millet Vegetable Pongal',
        slug: 'proso-millet-veg-pongal',
        description: 'Creamy southern porridge made of Proso millet, split yellow moong dal, whole peppercorns, cumin, and roasted cashews.',
        category: 'Breakfast',
        dietaryType: 'Veg',
        price: 180,
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec',
        servingWeightGrams: 320,
        calories: 330,
        carbohydrates_g: 44,
        netCarbohydrates_g: 35,
        protein_g: 12,
        fat_g: 11,
        fiber_g: 9,
        sugar_g: 2,
        sodium_mg: 340,
        potassium_mg: 410,
        glycemicIndex: 44,
        glycemicLoad: 15.4,
        grainType: 'Foxtail_Millet',
        amyloseRatio: 0.29,
        resistantStarchFactor: 0.25,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 180, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak', sodiumDelta_mg: -120, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Comfort Food', 'Warm Porridge', 'High Fiber']
      },
      {
        restaurant: rMap['bengaluru-millet-dose-labs'],
        name: 'Spiced Buttermilk with Curry Leaves & Hing',
        slug: 'spiced-buttermilk-curry-hing',
        description: 'Lightly churned skimmed yogurt drink infused with crushed ginger, green chili, toasted asafoetida, and fresh curry leaves.',
        category: 'Beverage',
        dietaryType: 'Veg',
        price: 70,
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        servingWeightGrams: 250,
        calories: 65,
        carbohydrates_g: 5,
        netCarbohydrates_g: 4,
        protein_g: 4,
        fat_g: 2,
        fiber_g: 1,
        sugar_g: 3,
        sodium_mg: 210,
        potassium_mg: 260,
        glycemicIndex: 25,
        glycemicLoad: 1.0,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'Lactic_Acid_Fermented',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 50, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak', sodiumDelta_mg: -90, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Digestive', 'Cooling', 'Low Calorie']
      },

      // -------------------------------------------------------------
      // 7. Mumbai Healthy Thali Co.
      // -------------------------------------------------------------
      {
        restaurant: rMap['mumbai-healthy-thali-co'],
        name: 'Jowar Bhakri with Sprouted Matki Usal',
        slug: 'jowar-bhakri-matki-usal',
        description: 'Two gluten-free sorghum flatbreads served with sprouted moth bean usal seasoned with goda masala and grated fresh coconut.',
        category: 'Main_Course',
        dietaryType: 'Vegan',
        price: 240,
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec',
        servingWeightGrams: 380,
        calories: 360,
        carbohydrates_g: 54,
        netCarbohydrates_g: 42,
        protein_g: 16,
        fat_g: 7,
        fiber_g: 12,
        sugar_g: 3,
        sodium_mg: 380,
        potassium_mg: 560,
        glycemicIndex: 46,
        glycemicLoad: 19.3,
        grainType: 'Jowar_Sorghum',
        amyloseRatio: 0.28,
        resistantStarchFactor: 0.22,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 200, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak', sodiumDelta_mg: -140, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Maharashtrian', 'High Protein', 'Gluten Free']
      },
      {
        restaurant: rMap['mumbai-healthy-thali-co'],
        name: 'Methi Thepla (4 Pcs) with Chunda & Curd',
        slug: 'methi-thepla-chunda-curd',
        description: 'Thin Gujarati whole wheat and fenugreek flatbreads spiced with carom and sesame seeds. High trigonelline content slows postprandial rise.',
        category: 'Breads',
        dietaryType: 'Veg',
        price: 180,
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641',
        servingWeightGrams: 280,
        calories: 320,
        carbohydrates_g: 46,
        netCarbohydrates_g: 37,
        protein_g: 10,
        fat_g: 10,
        fiber_g: 9,
        sugar_g: 4,
        sodium_mg: 360,
        potassium_mg: 410,
        glycemicIndex: 45,
        glycemicLoad: 16.6,
        grainType: 'Whole_Wheat_Atta',
        amyloseRatio: 0.24,
        resistantStarchFactor: 0.15,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Methi', concentration_mg: 450, activeMarker: '4-hydroxyisoleucine' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak', sodiumDelta_mg: -120, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Travel Friendly', 'Fiber Rich', 'Fenugreek Enriched']
      },
      {
        restaurant: rMap['mumbai-healthy-thali-co'],
        name: 'Kothimbir Vadi (Steamed, Non-Fried)',
        slug: 'kothimbir-vadi-steamed',
        description: 'Savory coriander and chickpea flour cakes steamed to perfection and lightly tempered with sesame seeds and mustard.',
        category: 'Appetizer',
        dietaryType: 'Vegan',
        price: 160,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        servingWeightGrams: 220,
        calories: 210,
        carbohydrates_g: 26,
        netCarbohydrates_g: 19,
        protein_g: 9,
        fat_g: 7,
        fiber_g: 7,
        sugar_g: 2,
        sodium_mg: 290,
        potassium_mg: 350,
        glycemicIndex: 38,
        glycemicLoad: 7.2,
        grainType: 'Besan_Gram_Flour',
        amyloseRatio: 0.32,
        resistantStarchFactor: 0.18,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 150, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: false,
        contraindications: [],
        tags: ['Low Calorie', 'Steamed Snack', 'High Protein']
      },
      {
        restaurant: rMap['mumbai-healthy-thali-co'],
        name: 'Sprouted Chana Dal Chaat with Roasted Peanuts',
        slug: 'sprouted-chana-dal-chaat',
        description: 'Crunchy sprouted Bengal gram tossed with diced English cucumbers, Roma tomatoes, lemon juice, roasted cumin, and mint.',
        category: 'Side_Salad',
        dietaryType: 'Vegan',
        price: 150,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        servingWeightGrams: 250,
        calories: 220,
        carbohydrates_g: 28,
        netCarbohydrates_g: 19,
        protein_g: 12,
        fat_g: 6,
        fiber_g: 9,
        sugar_g: 3,
        sodium_mg: 220,
        potassium_mg: 440,
        glycemicIndex: 32,
        glycemicLoad: 6.1,
        grainType: 'Lentil_Dal',
        amyloseRatio: 0.35,
        resistantStarchFactor: 0.25,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Amla', concentration_mg: 180, activeMarker: 'Ascorbic_Acid' }],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak', sodiumDelta_mg: -80, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Raw Salad', 'Digestive Enzymes', 'High Protein']
      },
      {
        restaurant: rMap['mumbai-healthy-thali-co'],
        name: 'Solkadhi Kokum Coconut Digestive Drink',
        slug: 'solkadhi-kokum-coconut-digestive',
        description: 'Traditional coastal digestive infusion of wild kokum (hydroxycitric acid HCA) and fresh pressed coconut milk infused with garlic and chili.',
        category: 'Beverage',
        dietaryType: 'Vegan',
        price: 90,
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        servingWeightGrams: 220,
        calories: 110,
        carbohydrates_g: 7,
        netCarbohydrates_g: 5,
        protein_g: 2,
        fat_g: 8,
        fiber_g: 2,
        sugar_g: 2,
        sodium_mg: 180,
        potassium_mg: 220,
        glycemicIndex: 20,
        glycemicLoad: 1.0,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: false,
        contraindications: [],
        tags: ['HCA Metabolism', 'Kokum Acid', 'Digestive Tonic']
      },

      // -------------------------------------------------------------
      // 8. Dilli Darbar Low-Sodium Kitchen
      // -------------------------------------------------------------
      {
        restaurant: rMap['dilli-darbar-low-sodium'],
        name: 'Amritsari Chole with Missi Roti (Low Sodium)',
        slug: 'amritsari-chole-missi-roti-low-sodium',
        description: 'Authentic dark kabuli chana steeped in dried amla, anardana, and whole spices, paired with two high-protein chickpea-wheat missi rotis.',
        category: 'Main_Course',
        dietaryType: 'Veg',
        price: 270,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        servingWeightGrams: 420,
        calories: 440,
        carbohydrates_g: 58,
        netCarbohydrates_g: 44,
        protein_g: 18,
        fat_g: 13,
        fiber_g: 14,
        sugar_g: 4,
        sodium_mg: 390,
        potassium_mg: 680,
        glycemicIndex: 40,
        glycemicLoad: 17.6,
        grainType: 'Besan_Gram_Flour',
        amyloseRatio: 0.33,
        resistantStarchFactor: 0.28,
        fermentationType: 'None',
        activeBotanicals: [
          { name: 'Amla', concentration_mg: 300, activeMarker: 'Ascorbic_Acid_Tannins' },
          { name: 'Cinnamon', concentration_mg: 150, activeMarker: 'Cinnamaldehyde' }
        ],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Ultra Low Sodium Sendha Namak', sodiumDelta_mg: -150, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['DASH Diet Friendly', 'High Protein', 'Rich in Iron']
      },
      {
        restaurant: rMap['dilli-darbar-low-sodium'],
        name: 'Palak Paneer (Sendha Salt & A2 Cow Milk)',
        slug: 'palak-paneer-sendha-salt',
        description: 'Blanched iron-rich spinach puree folded with house-made artisanal paneer cubes, tempered in roasted garlic and cold-pressed mustard oil.',
        category: 'Main_Course',
        dietaryType: 'Veg',
        price: 290,
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db',
        servingWeightGrams: 360,
        calories: 380,
        carbohydrates_g: 12,
        netCarbohydrates_g: 6,
        protein_g: 22,
        fat_g: 27,
        fiber_g: 6,
        sugar_g: 3,
        sodium_mg: 310,
        potassium_mg: 720,
        glycemicIndex: 22,
        glycemicLoad: 1.3,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 250, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LEACH_POTASSIUM_BOIL', label: 'Boil Leach Spinach (CKD Safe)', sodiumDelta_mg: 0, priceDelta: 0 }
        ],
        contraindications: ['CKD_POTASSIUM_RESTRICTION'],
        tags: ['Keto', 'Low Carb', 'High Calcium']
      },
      {
        restaurant: rMap['dilli-darbar-low-sodium'],
        name: 'Murgh Malai Tikka (Low Sodium Sendha Namak)',
        slug: 'murgh-malai-tikka-low-sodium',
        description: 'Tender chicken breast chunks marinated in hung greek yogurt, cardamom powder, white pepper, and green chilies. Soft and juicy.',
        category: 'Appetizer',
        dietaryType: 'Non-Veg',
        price: 360,
        imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28',
        servingWeightGrams: 320,
        calories: 420,
        carbohydrates_g: 6,
        netCarbohydrates_g: 4,
        protein_g: 52,
        fat_g: 20,
        fiber_g: 2,
        sugar_g: 2,
        sodium_mg: 340,
        potassium_mg: 520,
        glycemicIndex: 14,
        glycemicLoad: 0.6,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'SUB_CURD_FOR_CREAM', label: 'Zero Cream Yogurt Marinade', calorieDelta: -80, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['High Protein', 'Lean Poultry', 'Keto']
      },
      {
        restaurant: rMap['dilli-darbar-low-sodium'],
        name: 'Pindi Chana Salad with Pomegranate & Radish',
        slug: 'pindi-chana-salad',
        description: 'Dry roasted chickpeas tossed with crisp white radish shreds, pomegranate arils, fresh coriander, and cold-pressed mustard oil drizzle.',
        category: 'Side_Salad',
        dietaryType: 'Vegan',
        price: 160,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        servingWeightGrams: 260,
        calories: 240,
        carbohydrates_g: 32,
        netCarbohydrates_g: 22,
        protein_g: 11,
        fat_g: 6,
        fiber_g: 10,
        sugar_g: 4,
        sodium_mg: 190,
        potassium_mg: 480,
        glycemicIndex: 35,
        glycemicLoad: 7.7,
        grainType: 'Lentil_Dal',
        amyloseRatio: 0.34,
        resistantStarchFactor: 0.26,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Amla', concentration_mg: 150, activeMarker: 'Ascorbic_Acid' }],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: false,
        contraindications: [],
        tags: ['High Fiber', 'Vegan Protein', 'Digestive Radish']
      },
      {
        restaurant: rMap['dilli-darbar-low-sodium'],
        name: 'Sugar-Free Phirni with Crushed Pistachio & Stevia',
        slug: 'sugar-free-phirni-stevia',
        description: 'Slow-simmered ground brown basmati rice in double-toned A2 cow milk, naturally flavored with green cardamom, saffron, and stevia.',
        category: 'Dessert',
        dietaryType: 'Veg',
        price: 150,
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87',
        servingWeightGrams: 180,
        calories: 140,
        carbohydrates_g: 16,
        netCarbohydrates_g: 14,
        protein_g: 6,
        fat_g: 5,
        fiber_g: 2,
        sugar_g: 4,
        sodium_mg: 75,
        potassium_mg: 210,
        glycemicIndex: 36,
        glycemicLoad: 5.0,
        grainType: 'Brown_Rice',
        amyloseRatio: 0.25,
        resistantStarchFactor: 0.20,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 100, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: false,
        contraindications: [],
        tags: ['Guilt Free Dessert', 'Zero Refined Sugar', 'Diabetic-Safe']
      },

      // -------------------------------------------------------------
      // 9. Chennai Sattvic Tiffin & Podi House
      // -------------------------------------------------------------
      {
        restaurant: rMap['chennai-sattvic-tiffin'],
        name: 'Sattvic Moringa Leaves Rasam with Brown Rice',
        slug: 'sattvic-moringa-rasam-brown-rice',
        description: 'Fresh organic drumstick greens and crushed black pepper simmered in spiced tomato broth, served with steaming hot aged brown rice.',
        category: 'Main_Course',
        dietaryType: 'Vegan',
        price: 210,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        servingWeightGrams: 380,
        calories: 320,
        carbohydrates_g: 48,
        netCarbohydrates_g: 39,
        protein_g: 9,
        fat_g: 6,
        fiber_g: 9,
        sugar_g: 3,
        sodium_mg: 320,
        potassium_mg: 580,
        glycemicIndex: 44,
        glycemicLoad: 17.2,
        grainType: 'Brown_Rice',
        amyloseRatio: 0.26,
        resistantStarchFactor: 0.28,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 220, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Rock Salt Sendha Namak', sodiumDelta_mg: -120, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Moringa Superfood', 'Pure Sattvic', 'Digestive Broth']
      },
      {
        restaurant: rMap['chennai-sattvic-tiffin'],
        name: 'Vazhaipoo (Banana Blossom) Usili with Kodo Millet',
        slug: 'banana-blossom-usili-kodo',
        description: 'Traditional Tamil preparation of fiber-rich banana flower steamed with crumbled spiced pigeon pea lentils and kodo millet.',
        category: 'Main_Course',
        dietaryType: 'Vegan',
        price: 230,
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec',
        servingWeightGrams: 340,
        calories: 290,
        carbohydrates_g: 40,
        netCarbohydrates_g: 27,
        protein_g: 13,
        fat_g: 7,
        fiber_g: 13,
        sugar_g: 2,
        sodium_mg: 290,
        potassium_mg: 620,
        glycemicIndex: 35,
        glycemicLoad: 9.5,
        grainType: 'Foxtail_Millet',
        amyloseRatio: 0.34,
        resistantStarchFactor: 0.30,
        fermentationType: 'None',
        activeBotanicals: [],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak', sodiumDelta_mg: -110, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['High Insoluble Fiber', 'PCOS Friendly', 'Diabetic-Safe']
      },
      {
        restaurant: rMap['chennai-sattvic-tiffin'],
        name: 'Steamed Keerai (Amaranth) Vadai',
        slug: 'steamed-keerai-vadai',
        description: 'Steamed split Bengal gram and red amaranth patties spiced with green chillies, ginger, and curry leaves. Zero oil absorption.',
        category: 'Breakfast',
        dietaryType: 'Vegan',
        price: 130,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        servingWeightGrams: 200,
        calories: 195,
        carbohydrates_g: 24,
        netCarbohydrates_g: 17,
        protein_g: 10,
        fat_g: 4,
        fiber_g: 7,
        sugar_g: 1,
        sodium_mg: 230,
        potassium_mg: 380,
        glycemicIndex: 34,
        glycemicLoad: 5.8,
        grainType: 'Lentil_Dal',
        amyloseRatio: 0.33,
        resistantStarchFactor: 0.20,
        fermentationType: 'None',
        activeBotanicals: [],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: false,
        contraindications: [],
        tags: ['Iron Rich', 'Steamed Fritter', 'Fiber Heavy']
      },
      {
        restaurant: rMap['chennai-sattvic-tiffin'],
        name: 'Sukku Malli Herbal Coffee (Dry Ginger & Coriander)',
        slug: 'sukku-malli-herbal-coffee',
        description: 'Traditional South Indian caffeine-free decoction of roasted coriander seeds, dry ginger, black pepper, and pure palm candy.',
        category: 'Beverage',
        dietaryType: 'Vegan',
        price: 80,
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        servingWeightGrams: 180,
        calories: 45,
        carbohydrates_g: 9,
        netCarbohydrates_g: 8,
        protein_g: 1,
        fat_g: 0.5,
        fiber_g: 1,
        sugar_g: 6,
        sodium_mg: 20,
        potassium_mg: 140,
        glycemicIndex: 30,
        glycemicLoad: 2.4,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 100, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: false,
        contraindications: [],
        tags: ['Caffeine Free', 'Digestive Hot Brew', 'Throat Soother']
      },
      {
        restaurant: rMap['chennai-sattvic-tiffin'],
        name: 'Millet Idiyappam with Coconut-Cardamom Paal',
        slug: 'millet-idiyappam-coconut-paal',
        description: 'Delicate steamed string hoppers made of unpolished foxtail millet flour, paired with lightly sweet fresh coconut milk flavored with cardamom.',
        category: 'Breakfast',
        dietaryType: 'Vegan',
        price: 170,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
        servingWeightGrams: 280,
        calories: 270,
        carbohydrates_g: 38,
        netCarbohydrates_g: 31,
        protein_g: 7,
        fat_g: 9,
        fiber_g: 7,
        sugar_g: 5,
        sodium_mg: 180,
        potassium_mg: 290,
        glycemicIndex: 42,
        glycemicLoad: 13.0,
        grainType: 'Foxtail_Millet',
        amyloseRatio: 0.31,
        resistantStarchFactor: 0.25,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 80, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: false,
        contraindications: [],
        tags: ['Steamed Hopper', 'Sattvic', 'Millet Special']
      },

      // -------------------------------------------------------------
      // 10. Pune Ketogenic & High-Protein Kitchen
      // -------------------------------------------------------------
      {
        restaurant: rMap['pune-keto-high-protein'],
        name: 'Almond Flour Keto Roti (3 Pcs) with Palak Paneer',
        slug: 'almond-flour-keto-roti-palak-paneer',
        description: 'Ultra-low carb flatbreads made from fine California almond flour, paired with rich whole-milk spinach paneer curry.',
        category: 'Main_Course',
        dietaryType: 'Veg',
        price: 360,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        servingWeightGrams: 360,
        calories: 540,
        carbohydrates_g: 14,
        netCarbohydrates_g: 6,
        protein_g: 28,
        fat_g: 42,
        fiber_g: 8,
        sugar_g: 3,
        sodium_mg: 380,
        potassium_mg: 520,
        glycemicIndex: 12,
        glycemicLoad: 0.7,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 200, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Use Sendha Namak', sodiumDelta_mg: -150, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Ketogenic', 'Under 10g Net Carb', 'High Fat Low Carb']
      },
      {
        restaurant: rMap['pune-keto-high-protein'],
        name: 'Soya Chunk Bhurji Bowl with Roasted Walnuts',
        slug: 'soya-chunk-bhurji-bowl',
        description: 'High-protein minced defatted soya granules scrambled with onions, bell peppers, tomatoes, and crushed antioxidant walnuts.',
        category: 'Main_Course',
        dietaryType: 'Vegan',
        price: 240,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        servingWeightGrams: 320,
        calories: 340,
        carbohydrates_g: 18,
        netCarbohydrates_g: 9,
        protein_g: 36,
        fat_g: 14,
        fiber_g: 9,
        sugar_g: 3,
        sodium_mg: 360,
        potassium_mg: 640,
        glycemicIndex: 15,
        glycemicLoad: 1.4,
        grainType: 'Lentil_Dal',
        amyloseRatio: 0.35,
        resistantStarchFactor: 0.25,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Turmeric_Curcumin', concentration_mg: 180, activeMarker: 'Curcuminoids' }],
        cookingMedium: 'Cold_Pressed_Mustard_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak (Low Sodium)', sodiumDelta_mg: -140, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Massive Protein', 'Gym Enthusiast', 'Vegan Fitness']
      },
      {
        restaurant: rMap['pune-keto-high-protein'],
        name: 'Grilled Herb Tofu Steak with Cauliflower Mash',
        slug: 'grilled-tofu-cauliflower-mash',
        description: 'Pressed non-GMO organic soybean tofu steak seasoned with rosemary, thyme, and garlic, served on velvety garlic cauliflower mash.',
        category: 'Main_Course',
        dietaryType: 'Vegan',
        price: 310,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        servingWeightGrams: 340,
        calories: 310,
        carbohydrates_g: 12,
        netCarbohydrates_g: 6,
        protein_g: 26,
        fat_g: 18,
        fiber_g: 6,
        sugar_g: 3,
        sodium_mg: 340,
        potassium_mg: 490,
        glycemicIndex: 14,
        glycemicLoad: 0.8,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [],
        cookingMedium: 'Extra_Virgin_Olive_Oil',
        allowModifications: true,
        modificationsAvailable: [
          { code: 'LOW_SODIUM_KSALT', label: 'Rock Salt', sodiumDelta_mg: -120, priceDelta: 0 }
        ],
        contraindications: [],
        tags: ['Zero Spike', 'High Protein', 'Keto Approved']
      },
      {
        restaurant: rMap['pune-keto-high-protein'],
        name: 'Keto Chia Coconut Pudding with Roasted Almonds',
        slug: 'keto-chia-coconut-pudding',
        description: 'Omega-3 rich black chia seeds plumped in fresh thick coconut milk, lightly sweetened with pure stevia drops, topped with slivered almonds.',
        category: 'Dessert',
        dietaryType: 'Vegan',
        price: 190,
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87',
        servingWeightGrams: 200,
        calories: 220,
        carbohydrates_g: 12,
        netCarbohydrates_g: 3,
        protein_g: 7,
        fat_g: 18,
        fiber_g: 9,
        sugar_g: 1,
        sodium_mg: 50,
        potassium_mg: 240,
        glycemicIndex: 10,
        glycemicLoad: 0.3,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 120, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Cold_Pressed_Sesame_Oil',
        allowModifications: false,
        contraindications: [],
        tags: ['Omega 3', 'Keto Sweet', 'Stevia Sweetened']
      },
      {
        restaurant: rMap['pune-keto-high-protein'],
        name: 'Bulletproof Coffee with A2 Ghee & MCT Oil',
        slug: 'bulletproof-coffee-mct',
        description: 'Freshly brewed single-origin Arabica espresso whipped frothy with 10g of A2 cow ghee and pure C8/C10 medium-chain triglycerides.',
        category: 'Beverage',
        dietaryType: 'Veg',
        price: 160,
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        servingWeightGrams: 240,
        calories: 190,
        carbohydrates_g: 1,
        netCarbohydrates_g: 0.5,
        protein_g: 1,
        fat_g: 21,
        fiber_g: 0.5,
        sugar_g: 0,
        sodium_mg: 20,
        potassium_mg: 110,
        glycemicIndex: 5,
        glycemicLoad: 0.0,
        grainType: 'None',
        amyloseRatio: 0,
        resistantStarchFactor: 0,
        fermentationType: 'None',
        activeBotanicals: [{ name: 'Cinnamon', concentration_mg: 80, activeMarker: 'Cinnamaldehyde' }],
        cookingMedium: 'Desi_Cow_Ghee',
        allowModifications: false,
        contraindications: ['SEVERE_TRIGLYCERIDE_SURGE'],
        tags: ['MCT Brain Fuel', 'Fasting Approved', 'Ketone Generator']
      }
    ];

    const createdFoodItems = await FoodItem.insertMany(foodItemsData);
    console.log(`Successfully seeded ${createdFoodItems.length} biophysically annotated food items.`);

    const fMap = {};
    createdFoodItems.forEach(f => { fMap[f.slug] = f; });

    // 4. Seed Multi-Generational Family Groups
    console.log('\nSeeding Multi-Generational Family Groups...');
    // Find or create primary user
    let primaryUser = await User.findOne({ phoneNumber: '9876543210' }) || await User.findOne({});
    if (!primaryUser) {
      primaryUser = await User.create({
        phoneNumber: '9876543210',
        firstName: 'Vikram',
        lastName: 'Sharma',
        dateOfBirth: new Date('1982-08-15'),
        gender: 'Male',
        bloodGroup: 'B+',
        vitalsStatus: 'Lab_Verified',
        lifestyle: { dietPreference: 'Veg', smokingHabit: 'Non-smoker', alcoholConsumption: 'None', activityLevel: 'Active' },
        address: {
          houseNumber: 'Villa 12, Palm Meadows',
          street: 'Gachibowli Road',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500032',
          coordinates: { lat: 17.4401, lng: 78.3489 }
        }
      });
    }

    const familyGroupsData = [
      {
        name: 'The Sharma Joint Family',
        headUser: primaryUser._id,
        members: [
          {
            user: primaryUser._id,
            nickname: 'Vikram (Self - Pre-diabetic)',
            relation: 'Self',
            age: 44,
            clinicalConditions: ['Prediabetes', 'Dyslipidemia'],
            metabolicTargets: {
              maxPostprandialGlucose: 140,
              maxSodiumPerMeal_mg: 500,
              maxCarbsPerMeal_g: 45,
              minProteinPerMeal_g: 25,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.35
          },
          {
            user: primaryUser._id,
            nickname: 'Dadaji (Grandfather)',
            relation: 'Grandfather',
            age: 72,
            clinicalConditions: ['Type_2_Diabetes', 'CKD'],
            metabolicTargets: {
              maxPostprandialGlucose: 130,
              maxSodiumPerMeal_mg: 400,
              maxCarbsPerMeal_g: 35,
              minProteinPerMeal_g: 15,
              isPotassiumRestricted: true // Strict renal restriction
            },
            defaultPortionWeightFraction: 0.20
          },
          {
            user: primaryUser._id,
            nickname: 'Papaji (Father)',
            relation: 'Father',
            age: 64,
            clinicalConditions: ['Hypertension'],
            metabolicTargets: {
              maxPostprandialGlucose: 160,
              maxSodiumPerMeal_mg: 350, // Strict DASH protocol
              maxCarbsPerMeal_g: 60,
              minProteinPerMeal_g: 20,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.25
          },
          {
            user: primaryUser._id,
            nickname: 'Aman (Son - Gym Enthusiast)',
            relation: 'Son',
            age: 18,
            clinicalConditions: ['None'],
            metabolicTargets: {
              maxPostprandialGlucose: 180,
              maxSodiumPerMeal_mg: 1000,
              maxCarbsPerMeal_g: 90,
              minProteinPerMeal_g: 40,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.20
          }
        ],
        status: 'Active'
      },
      {
        name: 'The Rao Family Wellness Group',
        headUser: primaryUser._id,
        members: [
          {
            user: primaryUser._id,
            nickname: 'Srinivas Rao (Head)',
            relation: 'Self',
            age: 58,
            clinicalConditions: ['Type_2_Diabetes', 'Hypertension'],
            metabolicTargets: {
              maxPostprandialGlucose: 135,
              maxSodiumPerMeal_mg: 450,
              maxCarbsPerMeal_g: 40,
              minProteinPerMeal_g: 22,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.35
          },
          {
            user: primaryUser._id,
            nickname: 'Padmavathi Rao (Spouse)',
            relation: 'Spouse',
            age: 54,
            clinicalConditions: ['Dyslipidemia', 'Hypothyroidism'],
            metabolicTargets: {
              maxPostprandialGlucose: 145,
              maxSodiumPerMeal_mg: 500,
              maxCarbsPerMeal_g: 45,
              minProteinPerMeal_g: 20,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.30
          },
          {
            user: primaryUser._id,
            nickname: 'Divya Rao (Daughter)',
            relation: 'Daughter',
            age: 26,
            clinicalConditions: ['PCOS'],
            metabolicTargets: {
              maxPostprandialGlucose: 130,
              maxSodiumPerMeal_mg: 600,
              maxCarbsPerMeal_g: 35,
              minProteinPerMeal_g: 25,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.35
          }
        ],
        status: 'Active'
      },
      {
        name: 'The Patel Sattvic Parivar',
        headUser: primaryUser._id,
        members: [
          {
            user: primaryUser._id,
            nickname: 'Ramesh Patel',
            relation: 'Self',
            age: 68,
            clinicalConditions: ['Hypertension', 'Fatty_Liver_MASLD'],
            metabolicTargets: {
              maxPostprandialGlucose: 140,
              maxSodiumPerMeal_mg: 380,
              maxCarbsPerMeal_g: 50,
              minProteinPerMeal_g: 18,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.50
          },
          {
            user: primaryUser._id,
            nickname: 'Tarla Patel',
            relation: 'Spouse',
            age: 65,
            clinicalConditions: ['Prediabetes', 'Dyslipidemia'],
            metabolicTargets: {
              maxPostprandialGlucose: 135,
              maxSodiumPerMeal_mg: 400,
              maxCarbsPerMeal_g: 40,
              minProteinPerMeal_g: 18,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.50
          }
        ],
        status: 'Active'
      },
      {
        name: 'The Gupta Metabolic Health Group',
        headUser: primaryUser._id,
        members: [
          {
            user: primaryUser._id,
            nickname: 'Alok Gupta',
            relation: 'Self',
            age: 50,
            clinicalConditions: ['Type_2_Diabetes', 'Fatty_Liver_MASLD'],
            metabolicTargets: {
              maxPostprandialGlucose: 130,
              maxSodiumPerMeal_mg: 450,
              maxCarbsPerMeal_g: 35,
              minProteinPerMeal_g: 24,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.40
          },
          {
            user: primaryUser._id,
            nickname: 'Sunita Gupta',
            relation: 'Spouse',
            age: 47,
            clinicalConditions: ['Prediabetes'],
            metabolicTargets: {
              maxPostprandialGlucose: 140,
              maxSodiumPerMeal_mg: 500,
              maxCarbsPerMeal_g: 45,
              minProteinPerMeal_g: 20,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.35
          },
          {
            user: primaryUser._id,
            nickname: 'Rohan Gupta',
            relation: 'Son',
            age: 21,
            clinicalConditions: ['None'],
            metabolicTargets: {
              maxPostprandialGlucose: 170,
              maxSodiumPerMeal_mg: 800,
              maxCarbsPerMeal_g: 80,
              minProteinPerMeal_g: 35,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.25
          }
        ],
        status: 'Active'
      },
      {
        name: 'The Verma Active Family',
        headUser: primaryUser._id,
        members: [
          {
            user: primaryUser._id,
            nickname: 'Rajesh Verma',
            relation: 'Self',
            age: 38,
            clinicalConditions: ['None'],
            metabolicTargets: {
              maxPostprandialGlucose: 150,
              maxSodiumPerMeal_mg: 700,
              maxCarbsPerMeal_g: 70,
              minProteinPerMeal_g: 30,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.50
          },
          {
            user: primaryUser._id,
            nickname: 'Anjali Verma',
            relation: 'Spouse',
            age: 35,
            clinicalConditions: ['Hypothyroidism'],
            metabolicTargets: {
              maxPostprandialGlucose: 140,
              maxSodiumPerMeal_mg: 500,
              maxCarbsPerMeal_g: 45,
              minProteinPerMeal_g: 22,
              isPotassiumRestricted: false
            },
            defaultPortionWeightFraction: 0.50
          }
        ],
        status: 'Active'
      }
    ];

    const createdFamilyGroups = await FamilyGroup.insertMany(familyGroupsData);
    console.log(`Successfully created ${createdFamilyGroups.length} multi-generational family groups.`);

    // 5. Seed 36 Realistic Food Orders (Across all statuses and modes)
    console.log('\nSeeding 36 Diverse Food Orders Across Complete Lifecycle...');
    const allUsers = await User.find({}).limit(15);
    const orderStatuses = ['Placed', 'Kitchen_Confirmed', 'Cooking', 'Out_For_Delivery', 'Delivered', 'Cancelled'];
    const paymentStatuses = ['Paid', 'Pending', 'Paid', 'Paid', 'Paid', 'Refunded'];
    const paymentMethods = ['UPI', 'Card', 'HealthWallet', 'NetBanking', 'COD'];

    const foodOrdersToInsert = [];
    const foodItemsList = Object.values(fMap);
    const restaurantsList = createdRestaurants;

    for (let i = 0; i < 36; i++) {
      const u = allUsers[i % allUsers.length] || primaryUser;
      const rest = restaurantsList[i % restaurantsList.length];
      const status = orderStatuses[i % orderStatuses.length];
      const isCheatMode = i % 3 === 0;
      const orderMode = isCheatMode ? 'CHEAT_MODE_OVERRIDE' : 'VITALS_GUARD';

      // Pick 1 to 3 items
      const item1 = foodItemsList[(i * 3) % foodItemsList.length];
      const item2 = foodItemsList[(i * 3 + 1) % foodItemsList.length];
      const itemsSelected = [
        {
          foodItem: item1._id,
          name: item1.name,
          price: item1.price,
          quantity: 1,
          appliedModifications: item1.modificationsAvailable?.length ? [item1.modificationsAvailable[0]] : [],
          itemTotal: item1.price
        }
      ];

      if (i % 2 === 0 && item2) {
        itemsSelected.push({
          foodItem: item2._id,
          name: item2.name,
          price: item2.price,
          quantity: 1,
          appliedModifications: [],
          itemTotal: item2.price
        });
      }

      const subtotal = itemsSelected.reduce((acc, it) => acc + it.itemTotal, 0);
      const deliveryFee = 35;
      const tax = Math.round(subtotal * 0.05);
      const totalAmount = subtotal + deliveryFee + tax;

      // Realistic trajectory points
      const trajectory = [];
      const peakG = isCheatMode ? 188 + (i % 30) : 128 + (i % 18);
      const peakTime = isCheatMode ? 45 : 35;
      for (let t = 0; t <= 120; t += 10) {
        let val;
        if (t <= peakTime) {
          val = 95 + ((peakG - 95) * (t / peakTime));
        } else {
          val = peakG - ((peakG - 98) * ((t - peakTime) / (120 - peakTime)));
        }
        trajectory.push({
          timeMin: t,
          plasmaGlucose: Math.round(val),
          interstitialGlucose: Math.round(val - 3),
          systolicBP: Math.round(118 + (t > 20 && t < 60 ? 10 : 0))
        });
      }

      const ticketPayload = `TICKET|ORDER-${1000 + i}|${rest.name}|${new Date().toISOString()}`;
      const custodyHash = crypto.createHash('sha256').update(ticketPayload).digest('hex');

      foodOrdersToInsert.push({
        orderNumber: `ORD-${Date.now().toString().slice(-6)}-${String(1000 + i).slice(-3)}`,
        user: u._id,
        restaurant: rest._id,
        items: itemsSelected,
        subtotal,
        deliveryFee,
        tax,
        totalAmount,
        orderMode,
        userVitalsAtOrderTime: {
          fastingGlucose: 92 + (i % 20),
          currentCGMGlucose: 104 + (i % 25),
          cgmTrendArrow: isCheatMode ? 'SINGLE_UP' : 'FLAT',
          systolicBP: 122 + (i % 15),
          diastolicBP: 78 + (i % 10),
          heartRate: 72 + (i % 12),
          eGFR: 98 - (i % 10),
          activeMedications: isCheatMode ? ['Metformin 500mg'] : []
        },
        inSilicoPreOrderForecast: {
          simulatedPeakGlucose: peakG,
          timeToPeakMin: peakTime,
          projectedAUC: Math.round(peakG * 110),
          simulatedSystolicPeak: 128 + (i % 10),
          simulatedDiastolicPeak: 82 + (i % 6),
          glycemicExcursionCategory: isCheatMode ? (peakG > 195 ? 'DANGEROUS_SPIKE' : 'MILD_ELEVATION') : 'SAFE_STABLE',
          simulationTrajectory: trajectory
        },
        mitigationPlan: {
          requiredAmbulationMinutes: isCheatMode ? 25 : 10,
          targetStepsToBurnExcursion: isCheatMode ? 2800 : 1200,
          recommendedWalkStartTimeMin: 30,
          preBiteSequencing: [
            { stepNumber: 1, phase: 'Fiber_Salad_First', instructions: 'Eat salad/greens with vinegar dress', durationMin: 5 },
            { stepNumber: 2, phase: 'Protein_Fat_Second', instructions: 'Consume grilled paneer/chicken/dal', durationMin: 10 },
            { stepNumber: 3, phase: 'Starch_Carb_Last', instructions: 'Consume rice or roti last', durationMin: 15 }
          ],
          vinegarPreloadRecommended: isCheatMode,
          insulinSplitBolusAdvice: isCheatMode ? 'Split bolus 50% upfront, 50% at 60 mins' : ''
        },
        isFamilyOrder: i % 4 === 0,
        singlePotFamilyAllocation: (i % 4 === 0) ? [
          {
            memberId: u._id,
            memberName: 'Vikram',
            relation: 'Self',
            clinicalCondition: 'Prediabetes',
            allocatedPortionWeightGrams: 350,
            allocatedDishes: [{ dishName: item1.name, gramWeight: 350, dietaryNote: 'Low sodium garnish' }],
            predictedMemberPeakGlucose: 132
          },
          {
            memberId: u._id,
            memberName: 'Dadaji',
            relation: 'Grandfather',
            clinicalCondition: 'Type_2_Diabetes',
            allocatedPortionWeightGrams: 200,
            allocatedDishes: [{ dishName: item1.name, gramWeight: 200, dietaryNote: 'Renal portion leached' }],
            predictedMemberPeakGlucose: 126
          }
        ] : [],
        kitchenDispatchTicket: {
          dispatchedAt: new Date(Date.now() - (36 - i) * 1800000),
          kdsAcknowledged: status !== 'Placed',
          instructionsPrinted: [
            `CRITICAL METABOLIC CHEF DIRECTIVE: Order ${orderMode}`,
            `CUSTODY-HASH: ${custodyHash}`,
            `MODIFICATIONS APPLIED: ${itemsSelected[0].appliedModifications?.[0]?.label || 'Standard Bio-Formulation'}`
          ]
        },
        deliveryAddress: {
          houseNumber: `${101 + i}, Tower B`,
          street: 'Hitec City Knowledge Hub',
          area: 'Madhapur',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          coordinates: { lat: 17.4483 + (i * 0.001), lng: 78.3915 + (i * 0.001) }
        },
        paymentStatus: paymentStatuses[i % paymentStatuses.length],
        paymentMethod: paymentMethods[i % paymentMethods.length],
        orderStatus: status,
        deliveredAt: status === 'Delivered' ? new Date(Date.now() - (36 - i) * 1200000) : undefined,
        createdAt: new Date(Date.now() - (36 - i) * 3600000)
      });
    }

    const createdFoodOrders = await FoodOrder.insertMany(foodOrdersToInsert);
    console.log(`Successfully seeded ${createdFoodOrders.length} food orders across all lifecycle states.`);

    // 6. Seed 160 Downsampled IoT Smartwatch Telemetry Buckets
    console.log('\nSeeding 160 Downsampled 1-Minute IoT Wearable Telemetry Buckets...');
    const telemetryDocs = [];
    const baseTime = Date.now() - (160 * 60000); // 160 minutes continuous

    for (let m = 0; m < 160; m++) {
      const bucketStart = new Date(baseTime + (m * 60000));
      const bucketEnd = new Date(baseTime + ((m + 1) * 60000));

      // Simulate postprandial spike between min 30 and 80, followed by ambulation steps
      const isMealSurge = m >= 30 && m <= 80;
      const isAmbulation = m >= 45 && m <= 75;

      const gluc = isMealSurge ? 110 + (m - 30) * 1.5 : (m > 80 ? 185 - (m - 80) * 1.2 : 95 + (m % 5));
      const hr = isAmbulation ? 105 + (m % 15) : 72 + (m % 8);
      const sbp = isAmbulation ? 128 + (m % 8) : 118 + (m % 6);
      const dbp = 76 + (m % 4);
      const steps = isAmbulation ? 95 + (m % 20) : (m % 4 === 0 ? 12 : 0);

      telemetryDocs.push({
        user: primaryUser._id,
        deviceId: 'biosync-smartwatch-fireboltt-01',
        bucketStartTime: bucketStart,
        bucketEndTime: bucketEnd,
        sampleCount: 60,
        heartRate: {
          min: hr - 4,
          max: hr + 6,
          mean: hr
        },
        spo2: {
          min: 97,
          max: 99,
          mean: 98
        },
        bloodPressure: {
          systolicMean: sbp,
          diastolicMean: dbp
        },
        glucose: {
          start: Math.round(gluc - 1),
          end: Math.round(gluc + 1),
          min: Math.round(gluc - 2),
          max: Math.round(gluc + 3),
          mean: Math.round(gluc),
          rateOfChangePerMinute: isMealSurge ? 1.5 : (m > 80 ? -1.2 : 0.1)
        },
        skinTemperature: {
          mean: 36.6 + (isAmbulation ? 0.4 : 0.1)
        },
        stepCount: steps,
        anomaliesDetected: isMealSurge && gluc > 175 ? 1 : 0,
        signalQualityIndex: 98
      });
    }

    const createdTelemetry = await IoTTelemetry.insertMany(telemetryDocs);
    console.log(`Successfully seeded ${createdTelemetry.length} downsampled IoT telemetry buckets.`);

    console.log('\n======================================================');
    console.log('  Master Food-Tech & IoT Seeding Complete & Verified!');
    console.log(`  • Restaurants:    ${createdRestaurants.length}`);
    console.log(`  • Food Items:     ${createdFoodItems.length}`);
    console.log(`  • Family Groups:  ${createdFamilyGroups.length}`);
    console.log(`  • Food Orders:    ${createdFoodOrders.length}`);
    console.log(`  • IoT Telemetry:  ${createdTelemetry.length}`);
    console.log('======================================================\n');

    return {
      restaurants: createdRestaurants.length,
      foodItems: createdFoodItems.length,
      familyGroups: createdFamilyGroups.length,
      foodOrders: createdFoodOrders.length,
      telemetry: createdTelemetry.length
    };
  } catch (error) {
    console.error('Error seeding Food-Tech ecosystem:', error);
    throw error;
  }
}

// Allow direct CLI execution: node seedFoodTech.js
if (process.argv[1] && process.argv[1].endsWith('seedFoodTech.js')) {
  seedFoodTech()
    .then(() => {
      console.log('Seeder process completed cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeder failed:', err);
      process.exit(1);
    });
}

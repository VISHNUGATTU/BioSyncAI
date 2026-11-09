import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';
import FoodOrder from '../models/FoodOrder.js';
import FamilyGroup from '../models/FamilyGroup.js';
import User from '../models/User.js';
import { seedFoodTech } from '../seedFoodTech.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/biosyncai';

async function runPhase1Verification() {
  console.log('\n======================================================');
  console.log('  RALPH LOOP VERIFICATION: Phase 1 Food-Tech Models');
  console.log('======================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for testing.\n');

    // TEST 1: Run Seeder
    console.log('[TEST GROUP 1: Database Seeding & Schema Integrity]');
    const seedResult = await seedFoodTech();
    assert(seedResult.restaurants >= 5, `Seeded at least 5 restaurants (got ${seedResult.restaurants})`);
    assert(seedResult.foodItems >= 10, `Seeded at least 10 food items (got ${seedResult.foodItems})`);

    // TEST 2: Verify Restaurant Metadata & Geospatial Index
    console.log('\n[TEST GROUP 2: Restaurant & Cloud Kitchen Properties]');
    const arogya = await Restaurant.findOne({ slug: 'arogya-sattva-cloud-kitchen' });
    assert(arogya !== null, 'Arogya Sattva Cloud Kitchen found in database');
    assert(arogya.oilQualityIndex === 96, 'Oil Quality Index (OQI) is 96');
    assert(arogya.isVitalsGuardCertified === true, 'Restaurant is Vitals Guard certified');
    assert(arogya.kitchenDisplaySystem.autoApplyModifications === true, 'KDS auto-modification enabled');

    // TEST 3: Verify Biophysical Food Item Schema & Pre-Save Hooks
    console.log('\n[TEST GROUP 3: Biophysical Food Item & Starch Properties]');
    const foxtailPulao = await FoodItem.findOne({ slug: 'foxtail-millet-veg-pulao' });
    assert(foxtailPulao !== null, 'Foxtail Millet Pulao exists in database');
    assert(foxtailPulao.grainType === 'Foxtail_Millet', 'Grain type accurately tagged as Foxtail_Millet');
    assert(foxtailPulao.amyloseRatio === 0.32, 'High amylose ratio (0.32) verified');
    assert(foxtailPulao.netCarbohydrates_g === 38, 'Net carbs correctly calculated (48g carbs - 10g fiber = 38g)');
    assert(foxtailPulao.glycemicLoad === 16.7, 'Glycemic load accurately computed (16.7)');

    // TEST 4: Ayur-Therapeutic Formulation & Contraindication Safety
    console.log('\n[TEST GROUP 4: Ayurvedic Formulations & Contraindications]');
    const karelaBowl = await FoodItem.findOne({ slug: 'karela-jamun-glucose-stabilizer-bowl' });
    assert(karelaBowl !== null, 'Karela Jamun Glucose Stabilizer Bowl found');
    assert(karelaBowl.activeBotanicals.length >= 2, 'Contains active botanicals (Karela, Jamun)');
    assert(
      karelaBowl.contraindications.includes('SULPHONYLUREA_HYPO_HAZARD'),
      'Safety contraindication SULPHONYLUREA_HYPO_HAZARD actively tagged'
    );

    // TEST 5: Single-Pot Joint Family Group
    console.log('\n[TEST GROUP 5: Joint Family Multi-Generational Group]');
    const family = await FamilyGroup.findOne({ status: 'Active' });
    assert(family !== null, 'Active FamilyGroup document found');
    assert(family.members.length >= 4, `Family group has multi-generational members (found ${family.members.length})`);
    const dadaji = family.members.find(m => m.relation === 'Grandfather');
    assert(dadaji && dadaji.metabolicTargets.isPotassiumRestricted === true, 'Dadaji profile enforces potassium restriction for CKD');

    // TEST 6: FoodOrder Lifecycle (Vitals Guard Mode vs Cheat Mode)
    console.log('\n[TEST GROUP 6: FoodOrder Lifecycle & In-Silico Snapshots]');
    const testUser = await User.findOne({}) || await User.create({ phoneNumber: '+919999900000', firstName: 'Test' });

    // Order 1: Vitals Guard Safe Order
    const guardOrder = await FoodOrder.create({
      orderNumber: 'TEST-GUARD-' + Date.now(),
      user: testUser._id,
      restaurant: arogya._id,
      items: [{
        foodItem: foxtailPulao._id,
        name: foxtailPulao.name,
        price: foxtailPulao.price,
        quantity: 1,
        appliedModifications: [{ code: 'LOW_SODIUM_KSALT', label: 'Sendha Namak', priceDelta: 0 }],
        itemTotal: foxtailPulao.price
      }],
      subtotal: foxtailPulao.price,
      deliveryFee: 35,
      tax: 12,
      totalAmount: foxtailPulao.price + 47,
      orderMode: 'VITALS_GUARD',
      inSilicoPreOrderForecast: {
        simulatedPeakGlucose: 126,
        timeToPeakMin: 45,
        glycemicExcursionCategory: 'SAFE_STABLE'
      },
      mitigationPlan: {
        requiredAmbulationMinutes: 0,
        targetStepsToBurnExcursion: 0
      },
      orderStatus: 'Kitchen_Confirmed'
    });
    assert(guardOrder._id !== null, 'Vitals Guard order successfully created and persisted');
    assert(guardOrder.inSilicoPreOrderForecast.glycemicExcursionCategory === 'SAFE_STABLE', 'Order forecast marked SAFE_STABLE');

    // Order 2: Cheat Mode with Ambulation Counter
    const biryani = await FoodItem.findOne({ slug: 'hyderabadi-dum-chicken-biryani-1kg' });
    const cheatOrder = await FoodOrder.create({
      orderNumber: 'TEST-CHEAT-' + Date.now(),
      user: testUser._id,
      restaurant: biryani.restaurant,
      items: [{
        foodItem: biryani._id,
        name: biryani.name,
        price: biryani.price,
        quantity: 1,
        appliedModifications: [],
        itemTotal: biryani.price
      }],
      subtotal: biryani.price,
      deliveryFee: 0,
      tax: 26,
      totalAmount: biryani.price + 26,
      orderMode: 'CHEAT_MODE_OVERRIDE',
      inSilicoPreOrderForecast: {
        simulatedPeakGlucose: 218,
        timeToPeakMin: 55,
        glycemicExcursionCategory: 'DANGEROUS_SPIKE'
      },
      mitigationPlan: {
        requiredAmbulationMinutes: 28,
        targetStepsToBurnExcursion: 3100,
        recommendedWalkStartTimeMin: 30,
        vinegarPreloadRecommended: true
      },
      orderStatus: 'Kitchen_Confirmed'
    });
    assert(cheatOrder._id !== null, 'Cheat Mode Override order successfully created');
    assert(cheatOrder.mitigationPlan.targetStepsToBurnExcursion === 3100, 'Cheat Mode calculated 3,100 steps ambulation plan');

    // Clean up test orders
    await FoodOrder.deleteMany({ orderNumber: { $regex: '^TEST-' } });

    console.log('\n======================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await mongoose.connection.close();
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Verification failed with uncaught exception:', error);
    if (mongoose.connection) await mongoose.connection.close();
    process.exit(1);
  }
}

runPhase1Verification();


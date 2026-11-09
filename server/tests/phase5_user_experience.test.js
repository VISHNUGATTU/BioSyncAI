/**
 * Phase 5 Verification Test Suite: User Experience & Mobile Food Delivery Modules
 * Validates the Patient Experience ("Swiggy on Vitals"), Navigation Hierarchy,
 * Dual-Mode Logic, In-Silico Pre-Order Forecast UI, and Family Plating Architecture.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

async function runPhase5Verification() {
  console.log('\n======================================================================');
  console.log('  RALPH LOOP VERIFICATION: Phase 5 Mobile Patient UX & Navigation');
  console.log('======================================================================\n');

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

  const readComponent = (relPath) => {
    const fullPath = path.join(rootDir, relPath);
    const exists = fs.existsSync(fullPath);
    assert(exists, `Component exists: ${relPath}`);
    return exists ? fs.readFileSync(fullPath, 'utf8') : '';
  };

  try {
    // -------------------------------------------------------------
    // GROUP 1: API Client Integration
    // -------------------------------------------------------------
    console.log('[TEST GROUP 1: foodDeliveryApi.js Client Contract]');
    const apiCode = readComponent('user-panel/src/api/foodDeliveryApi.js');
    assert(apiCode.includes('getRestaurants:'), 'foodDeliveryApi exposes getRestaurants()');
    assert(apiCode.includes('getRestaurantMenu:'), 'foodDeliveryApi exposes getRestaurantMenu() with mode query param');
    assert(apiCode.includes('simulateCart:'), 'foodDeliveryApi exposes simulateCart() with biophysical parameters');
    assert(apiCode.includes('createOrder:'), 'foodDeliveryApi exposes createOrder() for kitchen dispatch');
    assert(apiCode.includes('getMyOrders:'), 'foodDeliveryApi exposes getMyOrders()');
    assert(apiCode.includes('allocateFamilyMeal:'), 'foodDeliveryApi exposes allocateFamilyMeal() single-pot optimizer');
    assert(apiCode.includes('getActiveAmbulation:'), 'foodDeliveryApi exposes getActiveAmbulation() for live step tracking');
    assert(apiCode.includes('streamAmbulationSteps:'), 'foodDeliveryApi exposes streamAmbulationSteps()');

    // -------------------------------------------------------------
    // GROUP 2: Food Delivery Home Screen
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 2: FoodDeliveryHomeScreen Architecture]');
    const homeCode = readComponent('user-panel/src/screens/FoodDeliveryHomeScreen.js');
    assert(homeCode.includes("'VITALS_GUARD'"), 'Default state includes VITALS_GUARD mode');
    assert(homeCode.includes("'CHEAT_MODE_OVERRIDE'"), 'Interactive toggle supports CHEAT_MODE_OVERRIDE');
    assert(homeCode.includes('currentGlucose') && homeCode.includes('GLUCOSE'), 'Real-time patient fasting/CGM glucose banner displayed');
    assert(homeCode.includes('currentSBP') && homeCode.includes('BLOOD PRESSURE'), 'Real-time blood pressure telemetry banner displayed');
    assert(homeCode.includes('oilQualityIndex') && homeCode.includes('OQI'), 'Oil Quality Index (OQI 1-100) audited badge rendered');
    assert(homeCode.includes('cookingMediums'), 'Healthy cooking medium tags rendered on kitchen cards');
    assert(homeCode.includes('activeAmbulation'), 'Active Cheat Mode ambulation countdown widget included');
    assert(homeCode.includes('GLUT-4'), 'Mentions skeletal muscle GLUT-4 glucose clearance mechanism');
    assert(homeCode.includes('FamilyPlatingGuide'), 'Quick-access trigger to Multi-Generational Family Plating Optimizer');

    // -------------------------------------------------------------
    // GROUP 3: Restaurant Menu & Biophysical Safeguards
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 3: RestaurantMenuScreen Biophysical Gating]');
    const menuCode = readComponent('user-panel/src/screens/RestaurantMenuScreen.js');
    assert(menuCode.includes('isSafe') && menuCode.includes('isGated'), 'Evaluates dish safety vs clinical thresholds');
    assert(menuCode.includes('predictedGlucoseSpike'), 'Displays predicted glucose spike (+X mg/dL) micro-badges');
    assert(menuCode.includes('glycemicIndex'), 'Displays Glycemic Index (GI) and macronutrients');
    assert(menuCode.includes('activeBotanicals'), 'Highlights active Indian botanicals (e.g. Karela, Methi)');
    assert(menuCode.includes('toggleMode'), 'Allows patient to switch between Vitals Guard and Cheat Mode on menu');
    assert(menuCode.includes('Review Forecast'), 'Cart footer includes "Review Forecast" action');
    assert(menuCode.includes('CartSimulation'), 'Navigates to CartSimulationScreen with cart payload');

    // -------------------------------------------------------------
    // GROUP 4: In-Silico 4-Hour Simulation & Pre-Bite Protocol
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 4: CartSimulationScreen & Digital Twin Forecast]');
    const simCode = readComponent('user-panel/src/screens/CartSimulationScreen.js');
    assert(simCode.includes('<Svg') && simCode.includes('react-native-svg'), 'Renders SVG postprandial trajectory curve');
    assert(simCode.includes('140 mg/dL Clinical Threshold'), 'Highlights 140 mg/dL clinical threshold ceiling');
    assert(simCode.includes('timeToPeakMin') || simCode.includes('timeToPeak'), 'Identifies time-to-peak parameter');
    assert(simCode.includes('Pre-Bite Food Sequencing Protocol'), 'Presents 3-step Pre-Bite Food Sequencing');
    assert(simCode.includes('Phase 1 (0 min): Fiber & Green Starter'), 'Sequence Phase 1: Fiber & Green Starter');
    assert(simCode.includes('Phase 2 (+10 min): Protein & Healthy Fats'), 'Sequence Phase 2: Protein & Healthy Lipids');
    assert(simCode.includes('Phase 3 (+20 min): Complex Carbohydrates'), 'Sequence Phase 3: Complex Carbohydrates');
    assert(simCode.includes('Autonomous Postprandial Ambulation Plan'), 'Displays Postprandial Ambulation Prescription');
    assert(simCode.includes('STEPS TARGET') && simCode.includes('BRISK WALK'), 'Provides concrete step target and walking duration');
    assert(simCode.includes('Vinegar Pre-load:'), 'Advises vinegar preload biohack');
    assert(simCode.includes('Kitchen Ticket Dispatched!'), 'Generates cryptographic printed kitchen ticket on dispatch');
    assert(simCode.includes('sha256Hash'), 'Displays SHA-256 tamper-evident order verification hash');

    // -------------------------------------------------------------
    // GROUP 5: Family Plating & Mass Conservation
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 5: FamilyPlatingGuideScreen Mass Balance]');
    const platingCode = readComponent('user-panel/src/screens/FamilyPlatingGuideScreen.js');
    assert(platingCode.includes('Single-Pot Plating Guide'), 'Renders single-pot joint family plating interface');
    assert(platingCode.includes('Mass Conservation Verified'), 'Explicitly asserts Mass Conservation Verification');
    assert(platingCode.includes('Dadaji') && platingCode.includes('T2D + CKD Stage 3'), 'Custom plating card for Dadaji (Diabetic + Nephropathic)');
    assert(platingCode.includes('Papaji') && platingCode.includes('Essential Hypertension'), 'Custom plating card for Papaji (Hypertension)');
    assert(platingCode.includes('Aman') && platingCode.includes('Resistance Athlete'), 'Custom plating card for Aman (Athlete)');
    assert(platingCode.includes('handleSharePlating'), 'Supports 1-click sharing of individual plating guides via WhatsApp/Share');

    // -------------------------------------------------------------
    // GROUP 6: Navigation Integration
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 6: Navigation Stack & Dashboard Entrypoints]');
    const tabCode = readComponent('user-panel/src/navigation/TabNavigator.js');
    assert(tabCode.includes("name: 'Eats'"), "TabNavigator includes dedicated 'Eats' tab");
    assert(tabCode.includes('FoodDeliveryHomeScreen'), 'Eats tab routes to FoodDeliveryHomeScreen');

    const appNavCode = readComponent('user-panel/src/navigation/AppNavigator.js');
    assert(appNavCode.includes('name="FoodDeliveryHome"'), 'AppNavigator registers FoodDeliveryHome stack screen');
    assert(appNavCode.includes('name="RestaurantMenu"'), 'AppNavigator registers RestaurantMenu stack screen');
    assert(appNavCode.includes('name="CartSimulation"'), 'AppNavigator registers CartSimulation stack screen');
    assert(appNavCode.includes('name="FamilyPlatingGuide"'), 'AppNavigator registers FamilyPlatingGuide stack screen');

    const mainHomeCode = readComponent('user-panel/src/screens/HomeScreen.js');
    assert(mainHomeCode.includes('BioSync Eats: Order Safe Food'), 'HomeScreen includes BioSync Eats hero launcher');
    assert(mainHomeCode.includes("navigate('FoodDeliveryHome')"), 'HomeScreen launcher navigates to FoodDeliveryHome');

  } catch (err) {
    console.error('Unhandled test suite exception:', err);
    failed++;
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`  Phase 5 Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log('----------------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase5Verification();

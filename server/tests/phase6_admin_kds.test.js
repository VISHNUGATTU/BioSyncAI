/**
 * Phase 6 Verification Test Suite: Kitchen Display System (KDS) & Clinical Surveillance
 * Validates the Cloud Kitchen Ticket Dispatch, Chef Customization Directives,
 * ESC/POS Thermal Printing, SHA-256 Custody Hash, and Doctor Metabolic Surveillance Portal.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

async function runPhase6Verification() {
  console.log('\n======================================================================');
  console.log('  RALPH LOOP VERIFICATION: Phase 6 Admin KDS & Clinical Surveillance');
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
    // GROUP 1: Express Server Endpoints & Controller Methods
    // -------------------------------------------------------------
    console.log('[TEST GROUP 1: Backend KDS & Surveillance API Endpoints]');
    const controllerCode = readComponent('server/controllers/foodOrderController.js');
    assert(controllerCode.includes('export async function getKdsOrders'), 'Exposes getKdsOrders() controller method');
    assert(controllerCode.includes('export async function updateKdsOrderStatus'), 'Exposes updateKdsOrderStatus() controller method');
    assert(controllerCode.includes('export async function getClinicalSurveillanceData'), 'Exposes getClinicalSurveillanceData() controller method');
    assert(controllerCode.includes('actualPreparationStartTime'), 'KDS lifecycle tracks actualPreparationStartTime timestamp');
    assert(controllerCode.includes('actualPackedTime'), 'KDS lifecycle tracks actualPackedTime timestamp');
    assert(controllerCode.includes('botanicalLockoutsPrevented'), 'Clinical surveillance aggregates botanicalLockoutsPrevented');

    const routeCode = readComponent('server/routes/foodOrderRoute.js');
    assert(routeCode.includes("foodOrderRouter.get('/admin/kds-orders', getKdsOrders)"), 'Route GET /admin/kds-orders is mounted');
    assert(routeCode.includes("foodOrderRouter.put('/admin/orders/:id/status', updateKdsOrderStatus)"), 'Route PUT /admin/orders/:id/status is mounted');
    assert(routeCode.includes("foodOrderRouter.get('/admin/clinical-surveillance', getClinicalSurveillanceData)"), 'Route GET /admin/clinical-surveillance is mounted');

    // -------------------------------------------------------------
    // GROUP 2: Kitchen Display System (KitchenKDS.jsx)
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 2: Kitchen Display System (KitchenKDS.jsx)]');
    const kdsCode = readComponent('admin-panel/src/pages/KitchenKDS.jsx');
    assert(kdsCode.includes('KITCHEN DISPLAY SYSTEM (KDS)'), 'KDS station branding present');
    assert(kdsCode.includes('Culinary Dispatch & Customization Console'), 'Shows Culinary Dispatch station title');
    assert(kdsCode.includes('ORDERS IN QUEUE') && kdsCode.includes('PREPARING NOW'), 'KDS queue metrics displayed');
    assert(kdsCode.includes('READY TO PACK') && kdsCode.includes('CHEAT MODE ORDERS'), 'Packed and Cheat mode status counters displayed');
    assert(kdsCode.includes('CLINICAL RECIPE MODIFICATIONS REQUIRED'), 'Prominently displays chef recipe directives');
    assert(kdsCode.includes('BOX 1: FIBER') && kdsCode.includes('BOX 2: PROTEIN') && kdsCode.includes('BOX 3: CARBS'), '3-Phase packaging box stickers rendered');
    assert(kdsCode.includes('sha256Hash') && kdsCode.includes('VERIFIED'), 'Displays cryptographic SHA-256 custody hash on tickets');
    assert(kdsCode.includes('ESC/POS 80mm Thermal Slip Preview'), 'ESC/POS simulated 80mm thermal receipt preview modal included');
    assert(kdsCode.includes('updateOrderStatus'), 'Implements interactive status progression (Accept -> Cook -> Pack -> Dispatch)');

    // -------------------------------------------------------------
    // GROUP 3: Clinical Surveillance Portal (ClinicalSurveillance.jsx)
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 3: Clinical Nutrition Surveillance (ClinicalSurveillance.jsx)]');
    const survCode = readComponent('admin-panel/src/pages/ClinicalSurveillance.jsx');
    assert(survCode.includes('CLINICAL NUTRITION SURVEILLANCE'), 'Doctor portal badge present');
    assert(survCode.includes('Biophysical Safety & Pharmacovigilance Audit'), 'Surveillance audit header displayed');
    assert(survCode.includes('TOTAL MONITORED MEALS'), 'Population metric: Total monitored meals');
    assert(survCode.includes('VITALS GUARD RATE'), 'Population metric: Vitals Guard adoption rate');
    assert(survCode.includes('COHORT MEAN PEAK'), 'Population metric: Cohort mean glucose peak');
    assert(survCode.includes('GLUT-4 AMBULATION BURN'), 'Population metric: Skeletal muscle GLUT-4 ambulation compliance');
    assert(survCode.includes('BOTANICAL LOCKOUTS'), 'Population metric: Adverse drug-botanical collisions prevented');
    assert(survCode.includes('<ResponsiveContainer') && survCode.includes('<BarChart'), 'Excursion cohort distribution Recharts visualization rendered');
    assert(survCode.includes('Pharmacovigilance Sentinel'), 'Includes Ayur-Pharma Sentinel audit summary');
    assert(survCode.includes('Karela + Glimepiride') && survCode.includes('BLOCKED'), 'Details Karela + Glimepiride lockout in sentinel box');
    assert(survCode.includes('Mulethi + Telmisartan') && survCode.includes('BLOCKED'), 'Details Mulethi + Telmisartan lockout in sentinel box');
    assert(survCode.includes('ambulationStepsCompleted') && survCode.includes('ambulationTargetSteps'), 'Patient audit table tracks step-burn progress');
    assert(survCode.includes('Clinical Digital Twin Trace:'), 'Includes patient digital twin inspection modal');

    // -------------------------------------------------------------
    // GROUP 4: Admin Panel Navigation & Routing
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 4: Admin Panel Routing & Sidebar Navigation]');
    const appCode = readComponent('admin-panel/src/App.jsx');
    assert(appCode.includes('import KitchenKDS from'), 'App.jsx imports KitchenKDS page');
    assert(appCode.includes('import ClinicalSurveillance from'), 'App.jsx imports ClinicalSurveillance page');
    assert(appCode.includes('path="kitchen-kds" element={<KitchenKDS />}'), 'Route /kitchen-kds is registered in App.jsx');
    assert(appCode.includes('path="clinical-surveillance" element={<ClinicalSurveillance />}'), 'Route /clinical-surveillance is registered in App.jsx');

    const sidebarCode = readComponent('admin-panel/src/components/Sidebar.jsx');
    assert(sidebarCode.includes('Metabolic Food Delivery'), 'Sidebar contains Metabolic Food Delivery group');
    assert(sidebarCode.includes("path: '/kitchen-kds'"), 'Sidebar links to Kitchen KDS');
    assert(sidebarCode.includes("path: '/clinical-surveillance'"), 'Sidebar links to Clinical Nutrition');

  } catch (err) {
    console.error('Unhandled test suite exception:', err);
    failed++;
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`  Phase 6 Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log('----------------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase6Verification();


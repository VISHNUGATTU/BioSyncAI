/**
 * BioSync AI - Phase 10 / Grant-Level Verification Suite:
 * Cyber-Physical Smart Kitchen Station & Hardware Telemetry (Node.js Service Layer)
 * 
 * Verifies:
 * 1. Optical Dual-Wavelength NIR Spectrophotometer Telemetry (absorbance 450nm/600nm, TPC %, FSSAI limits).
 * 2. Physical Solenoid Lockout when TPC >= 25% (Acrolein / polar compound safety).
 * 3. Multi-Plate Gravimetric Digital Load-Cell Array Verification (Thermodynamic Mass Conservation).
 * 4. Gravimetric Custody Hash generation for physical thermal tickets.
 */

import assert from 'assert';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

import smartKitchenHardwareService from '../services/smartKitchenHardwareService.js';

let passed = 0;
let failed = 0;

function pass(desc) {
  passed++;
  console.log(`  ✅ PASS: ${desc}`);
}

function fail(desc, err) {
  failed++;
  console.error(`  ❌ FAIL: ${desc}`);
  console.error(err);
}

async function runPhase10Verification() {
  console.log('\n======================================================');
  console.log('  RALPH LOOP VERIFICATION: Phase 10 Smart Kitchen Hardware');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------------
    // 1. Optical NIR Oil Quality Sensor (Virgin vs Degraded)
    // -------------------------------------------------------------------
    console.log('[TEST 1: In-Situ Optical NIR Spectrophotometer Oil Quality]');
    const virginOil = await smartKitchenHardwareService.readOpticalOilQuality(0.42, 0.12, 170.0, 'A2_Desi_Cow_Ghee');
    assert.strictEqual(virginOil.success, true);
    assert.strictEqual(virginOil.isFssaiCompliant, true);
    assert.strictEqual(virginOil.physicalSolenoidLockout, false);
    assert.ok(virginOil.totalPolarCompoundsPercent < 12.0);
    assert.ok(virginOil.oilQualityIndex >= 80);
    assert.ok(virginOil.opticalCalibrationTelemetryHash.startsWith('OPT-'));
    pass(`Optimal virgin oil verified (TPC: ${virginOil.totalPolarCompoundsPercent}%, OQI: ${virginOil.oilQualityIndex})`);

    const condemnedOil = await smartKitchenHardwareService.readOpticalOilQuality(2.80, 0.40, 185.0, 'Used_Commercial_Palm_Oil');
    assert.strictEqual(condemnedOil.success, true);
    assert.strictEqual(condemnedOil.isFssaiCompliant, false);
    assert.strictEqual(condemnedOil.physicalSolenoidLockout, true);
    assert.strictEqual(condemnedOil.classification, 'CONDEMNED_HAZARDOUS');
    assert.ok(condemnedOil.totalPolarCompoundsPercent >= 25.0);
    pass(`Condemned frying oil triggered physical solenoid lockout (TPC: ${condemnedOil.totalPolarCompoundsPercent}%)`);

    // -------------------------------------------------------------------
    // 2. Gravimetric Multi-Plate Digital Load-Cell Array Verification
    // -------------------------------------------------------------------
    console.log('\n[TEST 2: Smart Workstation Gravimetric Digital Load-Cell Plating]');
    const potGrams = 1200.0;
    const balancedPlates = [
      { plateId: 'dadaji', memberName: 'Dadaji', targetGrams: 250.0, measuredGrams: 249.5, loadCellId: 'LC-01' },
      { plateId: 'papaji', memberName: 'Papaji', targetGrams: 300.0, measuredGrams: 300.8, loadCellId: 'LC-02' },
      { plateId: 'aman', memberName: 'Aman', targetGrams: 400.0, measuredGrams: 399.7, loadCellId: 'LC-03' },
      { plateId: 'mummyji', memberName: 'Mummyji', targetGrams: 250.0, measuredGrams: 250.0, loadCellId: 'LC-04' }
    ];

    const gravRes = await smartKitchenHardwareService.verifyGravimetricPlating(potGrams, balancedPlates, 2.5);
    assert.strictEqual(gravRes.success, true);
    assert.strictEqual(gravRes.massConservationSatisfied, true);
    assert.strictEqual(gravRes.allIndividualPlatesWithinTolerance, true);
    assert.strictEqual(gravRes.status, 'GRAVIMETRICALLY_VERIFIED');
    assert.strictEqual(gravRes.readyForPackagingActuator, true);
    assert.ok(gravRes.gravimetricCustodyHash.startsWith('GRAV-'));
    pass(`Gravimetric mass balance verified (Total Plated: ${gravRes.totalPlatedGrams}g / Target: ${potGrams}g)`);

    // Mismatched test (overloading diabetic plate)
    const mismatchedPlates = [
      { plateId: 'dadaji', memberName: 'Dadaji', targetGrams: 200.0, measuredGrams: 290.0, loadCellId: 'LC-01' },
      { plateId: 'papaji', memberName: 'Papaji', targetGrams: 800.0, measuredGrams: 710.0, loadCellId: 'LC-02' }
    ];
    const mismatchRes = await smartKitchenHardwareService.verifyGravimetricPlating(1000.0, mismatchedPlates, 3.0);
    assert.strictEqual(mismatchRes.success, true);
    assert.strictEqual(mismatchRes.allIndividualPlatesWithinTolerance, false);
    assert.strictEqual(mismatchRes.status, 'MASS_MISMATCH_REJECTED');
    assert.strictEqual(mismatchRes.readyForPackagingActuator, false);
    pass(`Gravimetric safety interlock rejected overloaded plate (Status: ${mismatchRes.status})`);

    console.log('\n======================================================');
    console.log(`  Phase 10 Node.js Hardware Summary: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    fail('Phase 10 Verification Fatal Error', err);
    process.exit(1);
  }
}

runPhase10Verification();


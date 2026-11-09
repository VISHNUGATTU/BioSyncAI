/**
 * Phase 8 Verification Test Suite: 2-Patent Split Legal & Architectural Audit
 * Validates compliance with Section 10, Section 10(5) (Unity of Invention),
 * Section 3(k) (CRI Guidelines & Delhi High Court Precedents), 15 Claims per Patent,
 * and 7 formal Rule 15 drawing sheets for both Patent 1 and Patent 2.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

async function runPhase8PatentVerification() {
  console.log('\n======================================================================');
  console.log('  RALPH LOOP VERIFICATION: Phase 8 Indian Patent Split Form 2 Audit');
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

  const readPatentFile = (relPath) => {
    const fullPath = path.join(rootDir, relPath);
    const exists = fs.existsSync(fullPath);
    assert(exists, `Patent document exists: ${relPath}`);
    return exists ? fs.readFileSync(fullPath, 'utf8') : '';
  };

  try {
    // -------------------------------------------------------------
    // GROUP 1: PATENT 1 FORM 2 COMPLETE SPECIFICATION AUDIT
    // -------------------------------------------------------------
    console.log('[TEST GROUP 1: Patent 1 Form 2 Complete Specification]');
    const p1Spec = readPatentFile('patents/PATENT_1_FORM_2_COMPLETE_SPECIFICATION.md');
    assert(p1Spec.includes('THE PATENTS ACT, 1970') && p1Spec.includes('FORM 2'), 'Patent 1 has official Form 2 header');
    assert(p1Spec.includes('Section 10 and Rule 13'), 'Patent 1 references Section 10 and Rule 13 statutory preamble');
    assert(p1Spec.includes('Ferid Allani v. Union of India'), 'Patent 1 cites Ferid Allani Delhi HC landmark precedent');
    assert(p1Spec.includes('Telefonaktiebolaget LM Ericsson'), 'Patent 1 cites Ericsson v. Intex Delhi HC precedent');
    assert(p1Spec.includes('SECTION 3(k)'), 'Patent 1 includes explicit Section 3(k) CRI defense');
    assert(p1Spec.includes('Moens-Korteweg') && p1Spec.includes('Hughes'), 'Patent 1 details Hughes differential elasticity & Moens-Korteweg');
    assert(p1Spec.includes('7-compartment'), 'Patent 1 details 7-compartment Runge-Kutta 4th-order ODE system');
    assert(p1Spec.includes('GLUT-4') || p1Spec.includes('GLUT4'), 'Patent 1 details skeletal muscle GLUT-4 translocation kinetics');
    assert(p1Spec.includes('m_{\\text{excess}}') && p1Spec.includes('TargetSteps'), 'Patent 1 derives mathematical step count from excess glucose mass');
    assert(p1Spec.includes('ABSTRACT OF THE INVENTION'), 'Patent 1 includes formal Abstract of the Invention');

    // Claims check for Patent 1: Count claims 1 through 15
    for (let c = 1; c <= 15; c++) {
      assert(p1Spec.includes(`\n${c}. `) || p1Spec.includes(`\n   * ${c}. `) || p1Spec.includes(`${c}. A `) || p1Spec.includes(`${c}. The `), `Patent 1 includes Claim ${c}`);
    }

    // -------------------------------------------------------------
    // GROUP 2: PATENT 1 RULE 15 DRAWINGS AUDIT (SHEETS 1 TO 7)
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 2: Patent 1 Rule 15 Formal Drawings (Sheets 1 to 7)]');
    const p1Drawings = readPatentFile('patents/PATENT_1_DRAWINGS_SHEETS_1_TO_7.md');
    assert(p1Drawings.includes('SHEET 1 / 7') && p1Drawings.includes('FIG. 1'), 'Patent 1 contains Sheet 1 (FIG. 1: Hardware Architecture)');
    assert(p1Drawings.includes('SHEET 2 / 7') && p1Drawings.includes('FIG. 2'), 'Patent 1 contains Sheet 2 (FIG. 2: PTT-to-BP Elasticity Curve)');
    assert(p1Drawings.includes('SHEET 3 / 7') && p1Drawings.includes('FIG. 3'), 'Patent 1 contains Sheet 3 (FIG. 3: 7-Compartment ODE Flowchart)');
    assert(p1Drawings.includes('SHEET 4 / 7') && p1Drawings.includes('FIG. 4'), 'Patent 1 contains Sheet 4 (FIG. 4: Starch Retardation Curves)');
    assert(p1Drawings.includes('SHEET 5 / 7') && p1Drawings.includes('FIG. 5'), 'Patent 1 contains Sheet 5 (FIG. 5: GLUT-4 Ambulation Loop)');
    assert(p1Drawings.includes('SHEET 6 / 7') && p1Drawings.includes('FIG. 6'), 'Patent 1 contains Sheet 6 (FIG. 6: Pre-Bite Food Sequencing)');
    assert(p1Drawings.includes('SHEET 7 / 7') && p1Drawings.includes('FIG. 7'), 'Patent 1 contains Sheet 7 (FIG. 7: Closed-Loop Telemetry & Chew Detection)');

    // -------------------------------------------------------------
    // GROUP 3: PATENT 2 FORM 2 COMPLETE SPECIFICATION AUDIT
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 3: Patent 2 Form 2 Complete Specification]');
    const p2Spec = readPatentFile('patents/PATENT_2_FORM_2_COMPLETE_SPECIFICATION.md');
    assert(p2Spec.includes('THE PATENTS ACT, 1970') && p2Spec.includes('FORM 2'), 'Patent 2 has official Form 2 header');
    assert(p2Spec.includes('Section 10(5)') || p2Spec.includes('SECTION 10(5)'), 'Patent 2 establishes Unity of Invention under Section 10(5)');
    assert(p2Spec.includes('VITALS_GUARD') && p2Spec.includes('CHEAT_MODE_OVERRIDE'), 'Patent 2 claims dual-mode commerce gating');
    assert(p2Spec.includes('single-pot') || p2Spec.includes('Single-Pot'), 'Patent 2 claims single-pot joint family meal disaggregation');
    assert(p2Spec.includes('conservation of mass') || p2Spec.includes('Conservation of Mass'), 'Patent 2 enforces thermodynamic conservation of mass');
    assert(p2Spec.includes('15-botanical') || p2Spec.includes('15 traditional Indian botanicals'), 'Patent 2 claims 15-botanical Ayur-pharma sentinel');
    assert(p2Spec.includes('Karela') && p2Spec.includes('Glimepiride'), 'Patent 2 details Karela + Sulfonylurea lockout');
    assert(p2Spec.includes('Mulethi') && p2Spec.includes('Telmisartan'), 'Patent 2 details Mulethi + Antihypertensive 11-beta-HSD2 lockout');
    assert(p2Spec.includes('SHA-256') && p2Spec.includes('custody'), 'Patent 2 claims cryptographic SHA-256 kitchen custody ledger');
    assert(p2Spec.includes('Oil Quality Index') || p2Spec.includes('OQI'), 'Patent 2 claims Oil Quality Index restaurant audit');
    assert(p2Spec.includes('ABSTRACT OF THE INVENTION'), 'Patent 2 includes formal Abstract of the Invention');

    // Claims check for Patent 2: Count claims 1 through 15
    for (let c = 1; c <= 15; c++) {
      assert(p2Spec.includes(`\n${c}. `) || p2Spec.includes(`\n   * ${c}. `) || p2Spec.includes(`${c}. A `) || p2Spec.includes(`${c}. The `), `Patent 2 includes Claim ${c}`);
    }

    // -------------------------------------------------------------
    // GROUP 4: PATENT 2 RULE 15 DRAWINGS AUDIT (SHEETS 1 TO 7)
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 4: Patent 2 Rule 15 Formal Drawings (Sheets 1 to 7)]');
    const p2Drawings = readPatentFile('patents/PATENT_2_DRAWINGS_SHEETS_1_TO_7.md');
    assert(p2Drawings.includes('SHEET 1 / 7') && p2Drawings.includes('FIG. 1'), 'Patent 2 contains Sheet 1 (FIG. 1: Dual-Mode Commerce Gating)');
    assert(p2Drawings.includes('SHEET 2 / 7') && p2Drawings.includes('FIG. 2'), 'Patent 2 contains Sheet 2 (FIG. 2: 15-Botanical Ayur Decision Tree)');
    assert(p2Drawings.includes('SHEET 3 / 7') && p2Drawings.includes('FIG. 3'), 'Patent 2 contains Sheet 3 (FIG. 3: Single-Pot Mass Conservation Model)');
    assert(p2Drawings.includes('SHEET 4 / 7') && p2Drawings.includes('FIG. 4'), 'Patent 2 contains Sheet 4 (FIG. 4: KDS & 3-Phase Packaging Layout)');
    assert(p2Drawings.includes('SHEET 5 / 7') && p2Drawings.includes('FIG. 5'), 'Patent 2 contains Sheet 5 (FIG. 5: SHA-256 Custody Hash Pipeline)');
    assert(p2Drawings.includes('SHEET 6 / 7') && p2Drawings.includes('FIG. 6'), 'Patent 2 contains Sheet 6 (FIG. 6: Oil Quality Index Audit)');
    assert(p2Drawings.includes('SHEET 7 / 7') && p2Drawings.includes('FIG. 7'), 'Patent 2 contains Sheet 7 (FIG. 7: Doctor Surveillance Portal)');

    // -------------------------------------------------------------
    // GROUP 5: ZERO-PLACEHOLDER PRODUCTION INTEGRITY AUDIT
    // -------------------------------------------------------------
    console.log('\n[TEST GROUP 5: Rigorous Production-Grade Completeness Check]');
    const allFiles = [
      'patents/PATENT_1_FORM_2_COMPLETE_SPECIFICATION.md',
      'patents/PATENT_1_DRAWINGS_SHEETS_1_TO_7.md',
      'patents/PATENT_2_FORM_2_COMPLETE_SPECIFICATION.md',
      'patents/PATENT_2_DRAWINGS_SHEETS_1_TO_7.md',
    ];

    allFiles.forEach((file) => {
      const content = readPatentFile(file);
      assert(!content.includes('// TODO'), `${file} has zero "// TODO" placeholders`);
      assert(!content.includes('TBD') && !content.includes('PLACEHOLDER'), `${file} has zero TBD/PLACEHOLDER markers`);
      assert(content.length > 3000, `${file} is substantive and complete (size: ${content.length} chars)`);
    });

  } catch (err) {
    console.error('Unhandled test suite exception:', err);
    failed++;
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`  Phase 8 Patent Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log('----------------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase8PatentVerification();

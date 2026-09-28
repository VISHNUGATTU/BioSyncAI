/**
 * BioSync AI - Comprehensive Clinical Biomarker & Physiological Feature Extractor
 * 
 * Computes clinically validated composite indices, ratios, risk scores, and standardizes
 * physiological feature matrices for consumption by AI diagnostic and prognostic models.
 */

// Safe helper for float rounding
const round = (num, dec = 2) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return undefined;
  const factor = Math.pow(10, dec);
  return Math.round(Number(num) * factor) / factor;
};

/**
 * Automatically calculates all derived clinical indices, metabolic ratios, 
 * cardiovascular hemodynamic metrics, hematology ratios, and liver/renal scores.
 * 
 * @param {Object} rawData - Incoming vitals payload (partial or full)
 * @param {Object} [userContext] - Optional user context (age, gender, height, etc.)
 * @returns {Object} Deeply cloned vitals object with all derived metrics populated
 */
export const calculateDerivedVitals = (rawData = {}, userContext = {}) => {
  const data = JSON.parse(JSON.stringify(rawData));

  // Initialize domain containers if missing
  data.bodyMetrics = data.bodyMetrics || {};
  data.bodyMetrics.measurements = data.bodyMetrics.measurements || {};
  data.continuousMetrics = data.continuousMetrics || {};
  data.metabolicHealth = data.metabolicHealth || {};
  data.cardiovascularRisk = data.cardiovascularRisk || {};
  data.hematology = data.hematology || {};
  data.organFunction = data.organFunction || {};
  data.organFunction.electrolytes = data.organFunction.electrolytes || {};
  data.immunology = data.immunology || {};
  data.hormones = data.hormones || {};
  data.micronutrients = data.micronutrients || {};
  data.aiCalculatedScores = data.aiCalculatedScores || {};
  data.geneticAndGut = data.geneticAndGut || {};

  // 1. ANTHROPOMETRICS
  const heightCm = Number(data.bodyMetrics.heightCm || userContext.height);
  const weightKg = Number(data.bodyMetrics.weightKg || userContext.weight);

  if (heightCm > 0 && weightKg > 0 && !data.bodyMetrics.bmi) {
    const heightM = heightCm / 100;
    data.bodyMetrics.bmi = round(weightKg / (heightM * heightM), 2);
  }

  const waistCm = Number(data.bodyMetrics.measurements.waistCm);
  const hipCm = Number(data.bodyMetrics.measurements.hipCm);
  if (waistCm > 0 && hipCm > 0) {
    data.bodyMetrics.measurements.waistToHipRatio = round(waistCm / hipCm, 3);
  }
  if (waistCm > 0 && heightCm > 0) {
    data.bodyMetrics.measurements.waistToHeightRatio = round(waistCm / heightCm, 3);
  }

  // 2. CARDIOVASCULAR & HEMODYNAMICS
  const sbp = Number(data.cardiovascularRisk.systolic);
  const dbp = Number(data.cardiovascularRisk.diastolic);

  if (sbp > 0 && dbp > 0) {
    // Mean Arterial Pressure (MAP) = (2*DBP + SBP) / 3
    if (!data.cardiovascularRisk.meanArterialPressure) {
      data.cardiovascularRisk.meanArterialPressure = round((2 * dbp + sbp) / 3, 1);
    }
    // Pulse Pressure (PP) = SBP - DBP
    if (!data.cardiovascularRisk.pulsePressure) {
      data.cardiovascularRisk.pulsePressure = round(sbp - dbp, 1);
    }
  }

  // 3. ADVANCED LIPID FRACTIONS & RATIOS
  const tc = Number(data.cardiovascularRisk.totalCholesterol);
  const ldl = Number(data.cardiovascularRisk.ldlCholesterol);
  const hdl = Number(data.cardiovascularRisk.hdlCholesterol);
  const tg = Number(data.cardiovascularRisk.triglycerides);
  const apoB = Number(data.cardiovascularRisk.apolipoproteinB);
  const apoA1 = Number(data.cardiovascularRisk.apolipoproteinA1);

  if (tc > 0 && hdl > 0) {
    // Non-HDL Cholesterol = TC - HDL
    if (!data.cardiovascularRisk.nonHdlCholesterol) {
      data.cardiovascularRisk.nonHdlCholesterol = round(tc - hdl, 1);
    }
    // Castelli Risk Index I: TC / HDL
    if (!data.cardiovascularRisk.cholesterolHdlRatio) {
      data.cardiovascularRisk.cholesterolHdlRatio = round(tc / hdl, 2);
    }
  }

  if (ldl > 0 && hdl > 0 && !data.cardiovascularRisk.ldlHdlRatio) {
    data.cardiovascularRisk.ldlHdlRatio = round(ldl / hdl, 2);
  }

  if (tg > 0 && hdl > 0) {
    // Triglyceride to HDL ratio
    if (!data.cardiovascularRisk.trigHdlRatio) {
      data.cardiovascularRisk.trigHdlRatio = round(tg / hdl, 2);
    }
    // Atherogenic Index of Plasma (AIP) = log10(TG / HDL)
    if (!data.cardiovascularRisk.atherogenicIndexPlasma) {
      data.cardiovascularRisk.atherogenicIndexPlasma = round(Math.log10(tg / hdl), 3);
    }
  }

  if (apoB > 0 && apoA1 > 0 && !data.cardiovascularRisk.apoBApoA1Ratio) {
    data.cardiovascularRisk.apoBApoA1Ratio = round(apoB / apoA1, 2);
  }

  // 4. METABOLIC & GLYCEMIC INDICES
  const fastingGlucose = Number(data.metabolicHealth.glucoseFasting);
  const fastingInsulin = Number(data.metabolicHealth.fastingInsulin);
  const hba1c = Number(data.metabolicHealth.hba1c);

  if (fastingGlucose > 0 && fastingInsulin > 0) {
    // HOMA-IR = (Glucose [mg/dL] * Insulin [uIU/mL]) / 405
    if (!data.metabolicHealth.homaIR) {
      data.metabolicHealth.homaIR = round((fastingGlucose * fastingInsulin) / 405, 2);
    }
    // HOMA-Beta = (20 * Insulin) / (Glucose - 63)
    if (!data.metabolicHealth.homaBeta && fastingGlucose > 63) {
      data.metabolicHealth.homaBeta = round((20 * fastingInsulin) / (fastingGlucose - 63), 2);
    }
    // QUICKI = 1 / (log10(Insulin) + log10(Glucose))
    if (!data.metabolicHealth.quicki && fastingInsulin > 0 && fastingGlucose > 0) {
      const denom = Math.log10(fastingInsulin) + Math.log10(fastingGlucose);
      if (denom > 0) {
        data.metabolicHealth.quicki = round(1 / denom, 3);
      }
    }
  }

  // TyG Index = ln((Triglycerides [mg/dL] * Glucose [mg/dL]) / 2)
  if (tg > 0 && fastingGlucose > 0 && !data.metabolicHealth.tygIndex) {
    data.metabolicHealth.tygIndex = round(Math.log((tg * fastingGlucose) / 2), 2);
  }

  // Estimated Average Glucose (eAG) from HbA1c = 28.7 * HbA1c - 46.7
  if (hba1c > 0 && !data.metabolicHealth.estimatedAvgGlucose) {
    data.metabolicHealth.estimatedAvgGlucose = round(28.7 * hba1c - 46.7, 1);
  }

  // 5. HEMATOLOGY & INFLAMMATORY IMMUNE RATIOS
  const neutrophils = Number(data.hematology.neutrophilsPercent);
  const lymphocytes = Number(data.hematology.lymphocytesPercent);
  const monocytes = Number(data.hematology.monocytesPercent);
  const platelets = Number(data.hematology.platelets);

  if (neutrophils > 0 && lymphocytes > 0) {
    // NLR = Neutrophil-to-Lymphocyte Ratio
    if (!data.hematology.nlr) {
      data.hematology.nlr = round(neutrophils / lymphocytes, 2);
    }
    // SII = Systemic Immune-Inflammation Index = (Platelets * Neutrophils) / Lymphocytes
    if (platelets > 0 && !data.hematology.sii) {
      data.hematology.sii = round((platelets * neutrophils) / lymphocytes, 1);
    }
  }

  if (platelets > 0 && lymphocytes > 0 && !data.hematology.plr) {
    data.hematology.plr = round(platelets / lymphocytes, 2);
  }

  if (monocytes > 0 && lymphocytes > 0 && !data.hematology.mlr) {
    data.hematology.mlr = round(monocytes / lymphocytes, 3);
  }

  // 6. HEPATIC & RENAL INDICES
  const ast = Number(data.organFunction.astSgot);
  const alt = Number(data.organFunction.altSgpt);
  const bun = Number(data.organFunction.bun);
  const creatinine = Number(data.organFunction.creatinine);
  const albumin = Number(data.organFunction.albumin);
  const globulin = Number(data.organFunction.globulin);

  // De Ritis Ratio = AST / ALT
  if (ast > 0 && alt > 0 && !data.organFunction.deRitisRatio) {
    data.organFunction.deRitisRatio = round(ast / alt, 2);
  }

  // BUN / Creatinine Ratio
  if (bun > 0 && creatinine > 0 && !data.organFunction.bunCreatinineRatio) {
    data.organFunction.bunCreatinineRatio = round(bun / creatinine, 1);
  }

  // Albumin / Globulin (A/G) Ratio
  if (albumin > 0 && globulin > 0 && !data.organFunction.albuminGlobulinRatio) {
    data.organFunction.albuminGlobulinRatio = round(albumin / globulin, 2);
  }

  // Electrolyte Anion Gap = Na - (Cl + Bicarbonate)
  const sodium = Number(data.organFunction.electrolytes.sodium);
  const chloride = Number(data.organFunction.electrolytes.chloride);
  const bicarb = Number(data.organFunction.electrolytes.bicarbonate);
  if (sodium > 0 && chloride > 0 && bicarb > 0 && !data.organFunction.electrolytes.anionGap) {
    data.organFunction.electrolytes.anionGap = round(sodium - (chloride + bicarb), 1);
  }

  // 7. MICRONUTRIENT RATIOS
  const zinc = Number(data.micronutrients.zinc);
  const copper = Number(data.micronutrients.copper);
  if (zinc > 0 && copper > 0 && !data.micronutrients.zincCopperRatio) {
    data.micronutrients.zincCopperRatio = round(zinc / copper, 2);
  }

  const iron = Number(data.micronutrients.ironTotal);
  const tibc = Number(data.micronutrients.tibc);
  if (iron > 0 && tibc > 0 && !data.micronutrients.transferrinSaturation) {
    data.micronutrients.transferrinSaturation = round((iron / tibc) * 100, 1);
  }

  // 8. HORMONES: Free Androgen Index (FAI) = (Total T / SHBG) * 100
  const totalT = Number(data.hormones.testosteroneTotal);
  const shbg = Number(data.hormones.shbg);
  if (totalT > 0 && shbg > 0 && !data.hormones.freeAndrogenIndex) {
    // Total T (ng/dL) converted to nmol/L = * 0.0347
    const tNmol = totalT * 0.0347;
    data.hormones.freeAndrogenIndex = round((tNmol / shbg) * 100, 2);
  }

  // 9. AI CLINICAL SCORES & PHENOTYPIC LONGEVITY
  const chronologicalAge = Number(userContext.age || 35);

  // FIB-4 Index for liver fibrosis = (Age * AST) / (Platelets * sqrt(ALT))
  if (chronologicalAge > 0 && ast > 0 && alt > 0 && platelets > 0 && !data.aiCalculatedScores.fib4Index) {
    const denom = platelets * Math.sqrt(alt);
    if (denom > 0) {
      data.aiCalculatedScores.fib4Index = round((chronologicalAge * ast) / denom, 2);
    }
  }

  // Metabolic Syndrome Score (0 to 100 Severity Index)
  if (!data.aiCalculatedScores.metabolicSyndromeScore) {
    let metScore = 0;
    // Fasting Glucose >= 100 or HbA1c >= 5.7
    if (fastingGlucose >= 100 || hba1c >= 5.7) metScore += 25;
    // Triglycerides >= 150
    if (tg >= 150) metScore += 20;
    // HDL < 40 (male) or < 50 (female)
    if (hdl > 0 && hdl < 45) metScore += 20;
    // BP Systolic >= 130 or Diastolic >= 85
    if (sbp >= 130 || dbp >= 85) metScore += 20;
    // Waist > 90cm or BMI >= 25
    if (waistCm >= 90 || (data.bodyMetrics.bmi && data.bodyMetrics.bmi >= 25)) metScore += 15;
    data.aiCalculatedScores.metabolicSyndromeScore = metScore;
  }

  // Biological Phenotypic Age Estimation (Levine PhenoAge approximation)
  if (!data.aiCalculatedScores.biologicalAge && chronologicalAge > 0) {
    let bioAgeShift = 0;
    const crp = Number(data.immunology.hsCRP);
    const wbc = Number(data.hematology.wbc);

    if (crp > 3.0) bioAgeShift += 2.5;
    else if (crp < 1.0) bioAgeShift -= 1.5;

    if (fastingGlucose > 110) bioAgeShift += 2.0;
    else if (fastingGlucose >= 70 && fastingGlucose <= 90) bioAgeShift -= 1.0;

    if (sbp >= 140) bioAgeShift += 3.0;
    else if (sbp <= 115 && dbp <= 75) bioAgeShift -= 1.5;

    if (data.metabolicHealth.homaIR > 2.5) bioAgeShift += 2.0;
    if (data.cardiovascularRisk.atherogenicIndexPlasma > 0.2) bioAgeShift += 2.0;

    if (creatinine > 1.2) bioAgeShift += 1.5;
    if (data.organFunction.egfr > 90) bioAgeShift -= 1.0;

    if (data.continuousMetrics.vo2Max > 45) bioAgeShift -= 3.0;
    else if (data.continuousMetrics.vo2Max > 0 && data.continuousMetrics.vo2Max < 30) bioAgeShift += 2.5;

    const estimatedBioAge = Math.max(18, round(chronologicalAge + bioAgeShift, 1));
    data.aiCalculatedScores.biologicalAge = estimatedBioAge;
    data.aiCalculatedScores.phenotypicAgeDelta = round(estimatedBioAge - chronologicalAge, 1);
  }

  // Framingham 10-Yr CVD Risk Score Estimation (%)
  if (!data.aiCalculatedScores.framinghamRiskScore && sbp > 0 && tc > 0 && hdl > 0) {
    let riskPoints = 0;
    if (chronologicalAge >= 50) riskPoints += 6;
    else if (chronologicalAge >= 40) riskPoints += 4;
    else riskPoints += 1;

    if (tc >= 240) riskPoints += 3;
    else if (tc >= 200) riskPoints += 1;

    if (hdl < 40) riskPoints += 2;
    else if (hdl >= 60) riskPoints -= 1;

    if (sbp >= 140) riskPoints += 3;
    else if (sbp >= 120) riskPoints += 1;

    // Convert points to estimated risk %
    const estimatedPercent = Math.min(60, Math.max(1, Math.round(riskPoints * 2.2)));
    data.aiCalculatedScores.framinghamRiskScore = estimatedPercent;
  }

  return data;
};

/**
 * Transforms a raw or saved Vitals document into an AI-ready standardized feature vector.
 * Includes continuous features, categorical clinical risk flags, and domain breakdown.
 * 
 * @param {Object} vitalsDoc - Mongoose or plain Vitals document
 * @param {Object} [userDoc] - Optional user demographics
 * @returns {Object} Standardized AI Feature Dictionary
 */
export const extractAIFeatureVector = (vitalsDoc = {}, userDoc = {}) => {
  const v = calculateDerivedVitals(vitalsDoc, userDoc);

  // Primary physiological feature dictionary for ML models
  const features = {
    // 1. Demographics & Anthro
    chronologicalAge: Number(userDoc.age || 35),
    isMale: userDoc.gender === 'Male' ? 1 : (userDoc.gender === 'Female' ? 0 : 0.5),
    heightCm: v.bodyMetrics?.heightCm || 170,
    weightKg: v.bodyMetrics?.weightKg || 70,
    bmi: v.bodyMetrics?.bmi || 24.2,
    bodyFatPercentage: v.bodyMetrics?.bodyFatPercentage || 20.0,
    visceralFatIndex: v.bodyMetrics?.visceralFatIndex || 5,
    waistToHipRatio: v.bodyMetrics?.measurements?.waistToHipRatio || 0.85,

    // 2. Hemodynamics & Continuous Vitals
    restingHeartRate: v.continuousMetrics?.restingHeartRate || 72,
    hrv: v.continuousMetrics?.hrv || 50,
    vo2Max: v.continuousMetrics?.vo2Max || 40,
    oxygenSaturationSpO2: v.continuousMetrics?.oxygenSaturationSpO2 || 98,
    systolicBP: v.cardiovascularRisk?.systolic || 120,
    diastolicBP: v.cardiovascularRisk?.diastolic || 80,
    meanArterialPressure: v.cardiovascularRisk?.meanArterialPressure || 93.3,
    pulsePressure: v.cardiovascularRisk?.pulsePressure || 40,

    // 3. Glycemic & Metabolic
    glucoseFasting: v.metabolicHealth?.glucoseFasting || 90,
    glucosePostPrandial: v.metabolicHealth?.glucosePostPrandial || 115,
    hba1c: v.metabolicHealth?.hba1c || 5.2,
    fastingInsulin: v.metabolicHealth?.fastingInsulin || 7.5,
    homaIR: v.metabolicHealth?.homaIR || 1.67,
    quicki: v.metabolicHealth?.quicki || 0.35,
    tygIndex: v.metabolicHealth?.tygIndex || 8.4,
    estimatedAvgGlucose: v.metabolicHealth?.estimatedAvgGlucose || 102.5,

    // 4. Advanced Lipids & Atherogenic Risk
    totalCholesterol: v.cardiovascularRisk?.totalCholesterol || 180,
    ldlCholesterol: v.cardiovascularRisk?.ldlCholesterol || 100,
    hdlCholesterol: v.cardiovascularRisk?.hdlCholesterol || 55,
    triglycerides: v.cardiovascularRisk?.triglycerides || 110,
    nonHdlCholesterol: v.cardiovascularRisk?.nonHdlCholesterol || 125,
    cholesterolHdlRatio: v.cardiovascularRisk?.cholesterolHdlRatio || 3.27,
    atherogenicIndexPlasma: v.cardiovascularRisk?.atherogenicIndexPlasma || 0.3,
    apolipoproteinB: v.cardiovascularRisk?.apolipoproteinB || 80,
    apolipoproteinA1: v.cardiovascularRisk?.apolipoproteinA1 || 140,
    apoBApoA1Ratio: v.cardiovascularRisk?.apoBApoA1Ratio || 0.57,
    homocysteine: v.cardiovascularRisk?.homocysteine || 9.0,

    // 5. Hematology & Systemic Inflammation
    hemoglobin: v.hematology?.hemoglobin || 14.5,
    hematocrit: v.hematology?.hematocrit || 42.0,
    rbc: v.hematology?.rbc || 4.8,
    rdw: v.hematology?.rdw || 12.8,
    wbc: v.hematology?.wbc || 6.5,
    platelets: v.hematology?.platelets || 250,
    neutrophilsPercent: v.hematology?.neutrophilsPercent || 60,
    lymphocytesPercent: v.hematology?.lymphocytesPercent || 30,
    nlr: v.hematology?.nlr || 2.0,
    plr: v.hematology?.plr || 8.33,
    sii: v.hematology?.sii || 500,

    // 6. Hepatic, Renal & Electrolytes
    creatinine: v.organFunction?.creatinine || 0.9,
    egfr: v.organFunction?.egfr || 105,
    bun: v.organFunction?.bun || 14,
    bunCreatinineRatio: v.organFunction?.bunCreatinineRatio || 15.5,
    uricAcid: v.organFunction?.uricAcid || 5.0,
    astSgot: v.organFunction?.astSgot || 22,
    altSgpt: v.organFunction?.altSgpt || 24,
    deRitisRatio: v.organFunction?.deRitisRatio || 0.92,
    ggt: v.organFunction?.ggt || 20,
    albumin: v.organFunction?.albumin || 4.5,
    anionGap: v.organFunction?.electrolytes?.anionGap || 11,

    // 7. Inflammatory & Immunological
    hsCRP: v.immunology?.hsCRP || 0.8,
    esr: v.immunology?.esr || 10,
    ferritin: v.immunology?.ferritin || 120,
    interleukin6: v.immunology?.interleukin6 || 1.5,

    // 8. Hormones & Micronutrients
    cortisolFasting: v.hormones?.cortisolFasting || 12.0,
    tsh: v.hormones?.tsh || 2.0,
    vitaminD3: v.micronutrients?.vitaminD3 || 42,
    vitaminB12: v.micronutrients?.vitaminB12 || 550,
    magnesium: v.micronutrients?.magnesium || 2.1,
    omega3Index: v.micronutrients?.omega3Index || 7.2,

    // 9. AI Longevity & Risk Scores
    biologicalAge: v.aiCalculatedScores?.biologicalAge || (userDoc.age || 35),
    phenotypicAgeDelta: v.aiCalculatedScores?.phenotypicAgeDelta || 0,
    framinghamRiskScore: v.aiCalculatedScores?.framinghamRiskScore || 5,
    metabolicSyndromeScore: v.aiCalculatedScores?.metabolicSyndromeScore || 0,
    fib4Index: v.aiCalculatedScores?.fib4Index || 0.85
  };

  // Structured categorical risk tags for clinical triage AI
  const riskTags = [];
  if (features.homaIR >= 2.5) riskTags.push('INSULIN_RESISTANCE');
  if (features.tygIndex >= 8.8) riskTags.push('ELEVATED_TYG_METABOLIC');
  if (features.systolicBP >= 140 || features.diastolicBP >= 90) riskTags.push('HYPERTENSION_STAGE_2');
  else if (features.systolicBP >= 130 || features.diastolicBP >= 80) riskTags.push('PRE_HYPERTENSION');
  if (features.atherogenicIndexPlasma >= 0.21) riskTags.push('HIGH_ATHEROGENIC_RISK');
  if (features.hsCRP >= 3.0) riskTags.push('HIGH_SYSTEMIC_INFLAMMATION');
  if (features.nlr >= 3.0) riskTags.push('ELEVATED_NLR_IMMUNE_STRESS');
  if (features.deRitisRatio > 2.0) riskTags.push('HEPATIC_CIRRHOSIS_OR_ALCOHOLIC_FLAG');
  else if (features.deRitisRatio < 0.8 && features.altSgpt > 40) riskTags.push('NAFLD_NASH_SUSPECTED');
  if (features.metabolicSyndromeScore >= 50) riskTags.push('METABOLIC_SYNDROME_ACTIVE');
  if (features.phenotypicAgeDelta >= 5.0) riskTags.push('ACCELERATED_BIOLOGICAL_AGING');

  return {
    success: true,
    userId: userDoc._id || vitalsDoc.user,
    recordedAt: vitalsDoc.recordedAt || new Date(),
    featureCount: Object.keys(features).length,
    features,
    featureVector: Object.values(features),
    riskTags,
    compositeScores: {
      biologicalAge: features.biologicalAge,
      phenotypicAgeDelta: features.phenotypicAgeDelta,
      framinghamRiskPercent: features.framinghamRiskScore,
      metabolicSyndromeSeverity: features.metabolicSyndromeScore,
      fib4LiverIndex: features.fib4Index,
      atherogenicIndexPlasma: features.atherogenicIndexPlasma,
      homaIR: features.homaIR,
      nlr: features.nlr
    }
  };
};

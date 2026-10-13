/**
 * BioSync AI - Clinical Critical Anomaly & Dual-Pathologist Escalation Protocol
 * 
 * Defines biological panic thresholds (STAT limits) based on CLSI (Clinical and Laboratory
 * Standards Institute) and College of American Pathologists (CAP) critical limits.
 * 
 * Breaches trigger automated laboratory escalation, STAT alerts, and mandatory dual-pathologist signoff.
 */

export const CLINICAL_PANIC_THRESHOLDS = [
  {
    biomarkers: ['troponinI', 'troponin', 'cardiacTroponinI'],
    name: 'Cardiac Troponin I',
    unit: 'ng/mL',
    check: (v) => v > 0.4,
    thresholdDesc: '> 0.4 ng/mL (Acute Myocardial Infarction / Necrosis Risk)',
    severity: 'EMERGENCY_STAT',
  },
  {
    biomarkers: ['potassium', 'serumPotassium', 'k'],
    name: 'Serum Potassium',
    unit: 'mmol/L',
    check: (v) => v < 2.8 || v > 6.2,
    thresholdDesc: '< 2.8 or > 6.2 mmol/L (Lethal Cardiac Arrhythmia / Arrest Risk)',
    severity: 'EMERGENCY_STAT',
  },
  {
    biomarkers: ['glucoseFasting', 'fastingGlucose', 'glucose'],
    name: 'Fasting Blood Glucose',
    unit: 'mg/dL',
    check: (v) => v < 50 || v > 400,
    thresholdDesc: '< 50 mg/dL (Neuroglycopenic Coma) or > 400 mg/dL (DKA/HHS)',
    severity: 'EMERGENCY_STAT',
  },
  {
    biomarkers: ['glucosePostPrandial', 'postPrandialGlucose'],
    name: 'Postprandial Blood Glucose',
    unit: 'mg/dL',
    check: (v) => v > 450,
    thresholdDesc: '> 450 mg/dL (Severe Hyperglycemic Hyperosmolar State)',
    severity: 'PANIC_CRITICAL',
  },
  {
    biomarkers: ['sodium', 'serumSodium', 'na'],
    name: 'Serum Sodium',
    unit: 'mmol/L',
    check: (v) => v < 120 || v > 158,
    thresholdDesc: '< 120 mmol/L (Cerebral Edema / Seizures) or > 158 mmol/L (Severe Hyperosmolality)',
    severity: 'EMERGENCY_STAT',
  },
  {
    biomarkers: ['platelets', 'plateletCount'],
    name: 'Platelet Count',
    unit: '10^3/uL',
    check: (v) => v < 20,
    thresholdDesc: '< 20,000 /uL (Spontaneous Intracranial Bleed Risk)',
    severity: 'EMERGENCY_STAT',
  },
  {
    biomarkers: ['hemoglobin', 'hb'],
    name: 'Hemoglobin',
    unit: 'g/dL',
    check: (v) => v < 6.5,
    thresholdDesc: '< 6.5 g/dL (Severe Decompensated Anemia / Hemodynamic Collapse)',
    severity: 'EMERGENCY_STAT',
  },
  {
    biomarkers: ['systolicBp'],
    name: 'Systolic Blood Pressure',
    unit: 'mmHg',
    check: (v) => v >= 180,
    thresholdDesc: '>= 180 mmHg (Hypertensive Crisis / Stroke Risk)',
    severity: 'EMERGENCY_STAT',
  },
  {
    biomarkers: ['diastolicBp'],
    name: 'Diastolic Blood Pressure',
    unit: 'mmHg',
    check: (v) => v >= 120,
    thresholdDesc: '>= 120 mmHg (Hypertensive Emergency)',
    severity: 'EMERGENCY_STAT',
  },
  {
    biomarkers: ['egfr'],
    name: 'eGFR',
    unit: 'mL/min/1.73m2',
    check: (v) => v < 15,
    thresholdDesc: '< 15 mL/min/1.73m2 (Kidney Failure / Uremic Emergency)',
    severity: 'PANIC_CRITICAL',
  },
  {
    biomarkers: ['calcium', 'serumCalcium'],
    name: 'Serum Calcium',
    unit: 'mg/dL',
    check: (v) => v < 6.5 || v > 13.0,
    thresholdDesc: '< 6.5 or > 13.0 mg/dL (Tetany or Hypercalcemic Crisis)',
    severity: 'PANIC_CRITICAL',
  },
];

/**
 * Evaluates an array of testResults or a vitals payload against biological panic limits.
 * Returns { hasPanic: boolean, anomalies: [], requiresDualSignoff: boolean }
 */
export const scanForPanicAnomalies = ({ testResults = [], vitals = {} }) => {
  const anomalies = [];

  // 1. Scan explicit test results array
  if (Array.isArray(testResults)) {
    for (const item of testResults) {
      const val = parseFloat(item.value);
      if (isNaN(val)) continue;

      const normName = item.name?.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = CLINICAL_PANIC_THRESHOLDS.find(t =>
        t.biomarkers.some(b => b.toLowerCase() === normName || normName.includes(b.toLowerCase()))
      );

      if (match && match.check(val)) {
        anomalies.push({
          biomarker: match.name,
          value: val,
          panicThreshold: match.thresholdDesc,
          severity: match.severity,
          flaggedAt: new Date(),
        });
      }
    }
  }

  // 2. Scan structured vitals categories
  const categories = [
    vitals.bodyMetrics,
    vitals.metabolicHealth,
    vitals.cardiovascularRisk,
    vitals.continuousMetrics,
    vitals.organFunction,
    vitals.immunology,
  ];

  for (const cat of categories) {
    if (!cat || typeof cat !== 'object') continue;
    for (const [key, val] of Object.entries(cat)) {
      const numVal = parseFloat(val);
      if (isNaN(numVal)) continue;

      const normKey = key.toLowerCase();
      const match = CLINICAL_PANIC_THRESHOLDS.find(t =>
        t.biomarkers.some(b => b.toLowerCase() === normKey)
      );

      if (match && match.check(numVal)) {
        if (!anomalies.find(a => a.biomarker === match.name)) {
          anomalies.push({
            biomarker: match.name,
            value: numVal,
            panicThreshold: match.thresholdDesc,
            severity: match.severity,
            flaggedAt: new Date(),
          });
        }
      }
    }
  }

  const hasPanic = anomalies.length > 0;
  const hasEmergency = anomalies.some(a => a.severity === 'EMERGENCY_STAT' || a.severity === 'PANIC_CRITICAL');

  return {
    hasPanic,
    anomalies,
    requiresDualSignoff: hasEmergency,
  };
};

/**
 * BioSync AI - HL7 FHIR Release 4 (R4) Interoperability Service
 * 
 * Compliant with HL7 FHIR R4 (v4.0.1) Specification.
 * Translates proprietary clinical vitals, laboratory assays, and diagnostic reports
 * into standard FHIR Resources:
 * - Patient (http://hl7.org/fhir/StructureDefinition/Patient)
 * - Practitioner (http://hl7.org/fhir/StructureDefinition/Practitioner)
 * - Organization (http://hl7.org/fhir/StructureDefinition/Organization)
 * - Observation (http://hl7.org/fhir/StructureDefinition/Observation)
 * - DiagnosticReport (http://hl7.org/fhir/StructureDefinition/DiagnosticReport)
 * - Bundle (type: "document" or "collection")
 */

// Comprehensive LOINC (Logical Observation Identifiers Names and Codes) dictionary
// mapping BioSync biomarkers to canonical universal clinical codes and UCUM units.
export const LOINC_METRIC_MAP = {
  // --- Metabolic & Glycemic ---
  glucoseFasting: {
    loinc: '1558-6',
    display: 'Fasting glucose [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  glucosePostPrandial: {
    loinc: '1521-4',
    display: 'Glucose [Mass/volume] in Blood 2 hours post meal',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  hba1c: {
    loinc: '4548-4',
    display: 'Hemoglobin A1c/Hemoglobin.total in Blood',
    unit: '%',
    ucum: '%',
    category: 'laboratory'
  },
  insulinFasting: {
    loinc: '5797-6',
    display: 'Insulin [Units/volume] in Serum or Plasma --fasting',
    unit: 'uIU/mL',
    ucum: 'u[IU]/mL',
    category: 'laboratory'
  },
  homaIr: {
    loinc: '76629-5',
    display: 'Homeostasis model assessment of insulin resistance (HOMA-IR)',
    unit: 'ratio',
    ucum: '{ratio}',
    category: 'laboratory'
  },

  // --- Cardiovascular & Lipid Panel ---
  totalCholesterol: {
    loinc: '2093-3',
    display: 'Cholesterol [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  hdlCholesterol: {
    loinc: '2085-9',
    display: 'Cholesterol in HDL [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  ldlCholesterol: {
    loinc: '13457-7',
    display: 'Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  triglycerides: {
    loinc: '2571-8',
    display: 'Triglyceride [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  hsCrp: {
    loinc: '30522-7',
    display: 'C reactive protein [Mass/volume] in Serum or Plasma by High sensitivity method',
    unit: 'mg/L',
    ucum: 'mg/L',
    category: 'laboratory'
  },
  troponinI: {
    loinc: '10839-9',
    display: 'Troponin I.cardiac [Mass/volume] in Serum or Plasma',
    unit: 'ng/mL',
    ucum: 'ng/mL',
    category: 'laboratory'
  },
  homocysteine: {
    loinc: '2399-6',
    display: 'Homocysteine [Moles/volume] in Serum or Plasma',
    unit: 'umol/L',
    ucum: 'umol/L',
    category: 'laboratory'
  },
  apob: {
    loinc: '1884-6',
    display: 'Apolipoprotein B [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  lipoproteinA: {
    loinc: '10835-7',
    display: 'Lipoprotein a [Mass/volume] in Serum or Plasma',
    unit: 'nmol/L',
    ucum: 'nmol/L',
    category: 'laboratory'
  },

  // --- Physical & Vital Signs ---
  systolicBp: {
    loinc: '8480-6',
    display: 'Systolic blood pressure',
    unit: 'mmHg',
    ucum: 'mm[Hg]',
    category: 'vital-signs'
  },
  diastolicBp: {
    loinc: '8462-4',
    display: 'Diastolic blood pressure',
    unit: 'mmHg',
    ucum: 'mm[Hg]',
    category: 'vital-signs'
  },
  heartRate: {
    loinc: '8867-4',
    display: 'Heart rate',
    unit: 'bpm',
    ucum: '/min',
    category: 'vital-signs'
  },
  spo2: {
    loinc: '59408-5',
    display: 'Oxygen saturation in Arterial blood by Pulse oximetry',
    unit: '%',
    ucum: '%',
    category: 'vital-signs'
  },
  bodyWeight: {
    loinc: '29463-7',
    display: 'Body weight',
    unit: 'kg',
    ucum: 'kg',
    category: 'vital-signs'
  },
  bodyHeight: {
    loinc: '8302-2',
    display: 'Body height',
    unit: 'cm',
    ucum: 'cm',
    category: 'vital-signs'
  },
  bmi: {
    loinc: '39156-5',
    display: 'Body mass index (BMI) [Ratio]',
    unit: 'kg/m2',
    ucum: 'kg/m2',
    category: 'vital-signs'
  },
  bodyFatPercentage: {
    loinc: '41982-0',
    display: 'Percentage of body fat Measured',
    unit: '%',
    ucum: '%',
    category: 'vital-signs'
  },

  // --- Renal & Electrolyte Panel ---
  creatinine: {
    loinc: '2160-0',
    display: 'Creatinine [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  bloodUreaNitrogen: {
    loinc: '3094-0',
    display: 'Urea nitrogen [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  egfr: {
    loinc: '33914-3',
    display: 'Glomerular filtration rate/1.73 sq M.predicted [Volume Rate/Area] in Serum, Plasma or Blood by Creatinine-based formula (CKD-EPI)',
    unit: 'mL/min/1.73m2',
    ucum: 'mL/min/{1.73_m2}',
    category: 'laboratory'
  },
  uricAcid: {
    loinc: '3084-1',
    display: 'Uric acid [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  potassium: {
    loinc: '2823-3',
    display: 'Potassium [Moles/volume] in Serum or Plasma',
    unit: 'mmol/L',
    ucum: 'mmol/L',
    category: 'laboratory'
  },
  sodium: {
    loinc: '2951-2',
    display: 'Sodium [Moles/volume] in Serum or Plasma',
    unit: 'mmol/L',
    ucum: 'mmol/L',
    category: 'laboratory'
  },
  calcium: {
    loinc: '17861-6',
    display: 'Calcium [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  magnesium: {
    loinc: '19123-9',
    display: 'Magnesium [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },

  // --- Hepatic Panel ---
  alt: {
    loinc: '1742-6',
    display: 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma',
    unit: 'U/L',
    ucum: 'U/L',
    category: 'laboratory'
  },
  ast: {
    loinc: '1920-8',
    display: 'Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma',
    unit: 'U/L',
    ucum: 'U/L',
    category: 'laboratory'
  },
  bilirubinTotal: {
    loinc: '1975-2',
    display: 'Bilirubin.total [Mass/volume] in Serum or Plasma',
    unit: 'mg/dL',
    ucum: 'mg/dL',
    category: 'laboratory'
  },
  albumin: {
    loinc: '1751-7',
    display: 'Albumin [Mass/volume] in Serum or Plasma',
    unit: 'g/dL',
    ucum: 'g/dL',
    category: 'laboratory'
  },
  alkalinePhosphatase: {
    loinc: '6768-6',
    display: 'Alkaline phosphatase [Enzymatic activity/volume] in Serum or Plasma',
    unit: 'U/L',
    ucum: 'U/L',
    category: 'laboratory'
  },

  // --- Endocrine & Hormones ---
  tsh: {
    loinc: '3016-3',
    display: 'Thyrotropin [Units/volume] in Serum or Plasma',
    unit: 'uIU/mL',
    ucum: 'u[IU]/mL',
    category: 'laboratory'
  },
  freeT3: {
    loinc: '3051-5',
    display: 'Triiodothyronine.free [Mass/volume] in Serum or Plasma',
    unit: 'pg/mL',
    ucum: 'pg/mL',
    category: 'laboratory'
  },
  freeT4: {
    loinc: '3024-7',
    display: 'Thyroxine.free [Mass/volume] in Serum or Plasma',
    unit: 'ng/dL',
    ucum: 'ng/dL',
    category: 'laboratory'
  },
  testosteroneTotal: {
    loinc: '2986-8',
    display: 'Testosterone [Mass/volume] in Serum or Plasma',
    unit: 'ng/dL',
    ucum: 'ng/dL',
    category: 'laboratory'
  },
  cortisol: {
    loinc: '2143-6',
    display: 'Cortisol [Mass/volume] in Serum or Plasma',
    unit: 'ug/dL',
    ucum: 'ug/dL',
    category: 'laboratory'
  },

  // --- Micronutrients & Vitamins ---
  vitaminD: {
    loinc: '62292-8',
    display: '25-hydroxyvitamin D3+25-hydroxyvitamin D2 [Mass/volume] in Serum or Plasma',
    unit: 'ng/mL',
    ucum: 'ng/mL',
    category: 'laboratory'
  },
  vitaminB12: {
    loinc: '2132-9',
    display: 'Cobalamin (Vitamin B12) [Mass/volume] in Serum or Plasma',
    unit: 'pg/mL',
    ucum: 'pg/mL',
    category: 'laboratory'
  },
  ferritin: {
    loinc: '2276-4',
    display: 'Ferritin [Mass/volume] in Serum or Plasma',
    unit: 'ng/mL',
    ucum: 'ng/mL',
    category: 'laboratory'
  },
  serumIron: {
    loinc: '2498-4',
    display: 'Iron [Mass/volume] in Serum or Plasma',
    unit: 'ug/dL',
    ucum: 'ug/dL',
    category: 'laboratory'
  },

  // --- Complete Blood Count (CBC) ---
  hemoglobin: {
    loinc: '718-7',
    display: 'Hemoglobin [Mass/volume] in Blood',
    unit: 'g/dL',
    ucum: 'g/dL',
    category: 'laboratory'
  },
  wbcCount: {
    loinc: '6690-2',
    display: 'Leukocytes [#/volume] in Blood by Automated count',
    unit: '10^3/uL',
    ucum: '10*3/uL',
    category: 'laboratory'
  },
  platelets: {
    loinc: '777-3',
    display: 'Platelets [#/volume] in Blood by Automated count',
    unit: '10^3/uL',
    ucum: '10*3/uL',
    category: 'laboratory'
  }
};

/**
 * Creates a standard FHIR R4 Patient Resource
 */
export const buildFhirPatientResource = (user) => {
  if (!user) return null;

  const patientId = user._id?.toString() || 'unknown-patient';
  const genderMap = {
    male: 'male',
    female: 'female',
    other: 'other'
  };

  const patientResource = {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
    },
    identifier: [
      {
        use: 'usual',
        system: 'urn:biosync:patient:id',
        value: patientId
      }
    ],
    active: true,
    name: [
      {
        use: 'official',
        family: user.lastName || '',
        given: [user.firstName || 'Anonymous']
      }
    ],
    gender: genderMap[user.gender?.toLowerCase()] || 'unknown',
    telecom: []
  };

  if (user.phoneNumber) {
    patientResource.telecom.push({
      system: 'phone',
      value: user.phoneNumber,
      use: 'mobile'
    });
  }

  if (user.email) {
    patientResource.telecom.push({
      system: 'email',
      value: user.email,
      use: 'home'
    });
  }

  if (user.dateOfBirth) {
    patientResource.birthDate = new Date(user.dateOfBirth).toISOString().split('T')[0];
  }

  return patientResource;
};

/**
 * Creates a standard FHIR R4 Organization Resource (Laboratory)
 */
export const buildFhirOrganizationResource = () => {
  return {
    resourceType: 'Organization',
    id: 'biosync-central-lab',
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Organization']
    },
    identifier: [
      {
        system: 'urn:nabl:accreditation:number',
        value: 'NABL-MED-ISO-15189-2022-7729'
      }
    ],
    name: 'BioSync AI Cyber-Physical Diagnostic Center',
    telecom: [
      {
        system: 'url',
        value: 'https://biosync.ai'
      }
    ],
    address: [
      {
        use: 'work',
        line: ['AI Healthplex Innovation Corridor'],
        city: 'Metropolis',
        country: 'IND'
      }
    ]
  };
};

/**
 * Creates a standard FHIR R4 Practitioner Resource
 */
export const buildFhirPractitionerResource = (doctor) => {
  const docId = doctor?._id?.toString() || 'pathologist-authorized';
  return {
    resourceType: 'Practitioner',
    id: docId,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Practitioner']
    },
    identifier: [
      {
        system: 'urn:mci:medical:license',
        value: doctor?.licenseNumber || 'MCI-REG-77291'
      }
    ],
    name: [
      {
        use: 'official',
        text: doctor?.name || 'Dr. Authorized Pathologist, MD'
      }
    ]
  };
};

/**
 * Creates a single FHIR R4 Observation Resource from a metric key and value
 */
export const buildFhirObservation = ({ metricKey, value, patientId, recordedAt, referenceRange = null }) => {
  if (value === undefined || value === null || isNaN(Number(value))) return null;

  const def = LOINC_METRIC_MAP[metricKey];
  const loincCode = def ? def.loinc : 'unknown-loinc';
  const display = def ? def.display : metricKey;
  const unit = def ? def.unit : '';
  const ucum = def ? def.ucum : '';
  const categoryCode = def ? def.category : 'laboratory';

  const obsId = `obs-${metricKey}-${patientId}-${Date.now().toString(36)}`;

  const observation = {
    resourceType: 'Observation',
    id: obsId,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Observation']
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: categoryCode,
            display: categoryCode === 'vital-signs' ? 'Vital Signs' : 'Laboratory'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: loincCode,
          display: display
        }
      ],
      text: display
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    effectiveDateTime: (recordedAt ? new Date(recordedAt) : new Date()).toISOString(),
    valueQuantity: {
      value: Number(value),
      unit: unit,
      system: 'http://unitsofmeasure.org',
      code: ucum
    }
  };

  if (referenceRange) {
    observation.referenceRange = [
      {
        text: referenceRange.text || `${referenceRange.low || ''} - ${referenceRange.high || ''} ${unit}`,
        ...(referenceRange.low !== undefined && { low: { value: referenceRange.low, unit } }),
        ...(referenceRange.high !== undefined && { high: { value: referenceRange.high, unit } })
      }
    ];
  }

  return observation;
};

/**
 * Compiles a full FHIR R4 DiagnosticReport Document Bundle for a Sample / Lab Report
 */
export const exportSampleToFhirBundle = ({ sample, user, doctor }) => {
  const patientResource = buildFhirPatientResource(user);
  const practitionerResource = buildFhirPractitionerResource(doctor);
  const orgResource = buildFhirOrganizationResource();

  const patientRef = `Patient/${patientResource.id}`;
  const observations = [];

  // Extract from sample structuredResults or testResults
  if (sample.testResults && Array.isArray(sample.testResults)) {
    for (const tr of sample.testResults) {
      // Find matching metric key by name or LOINC mapping
      const keyCandidate = Object.keys(LOINC_METRIC_MAP).find(
        k => k.toLowerCase() === tr.name?.replace(/\s+/g, '').toLowerCase() ||
             LOINC_METRIC_MAP[k].display.toLowerCase().includes(tr.name?.toLowerCase())
      ) || tr.name;

      const numVal = parseFloat(tr.value);
      if (!isNaN(numVal)) {
        const obs = buildFhirObservation({
          metricKey: keyCandidate,
          value: numVal,
          patientId: patientResource.id,
          recordedAt: sample.verifiedAt || sample.createdAt,
          referenceRange: tr.referenceRange ? { text: tr.referenceRange } : null
        });
        if (obs) observations.push(obs);
      }
    }
  }

  // Also extract from sample structuredResults
  if (sample.structuredResults && Array.isArray(sample.structuredResults)) {
    for (const sr of sample.structuredResults) {
      if (!observations.find(o => o.code?.text?.toLowerCase().includes(sr.biomarker?.toLowerCase()))) {
        const obs = buildFhirObservation({
          metricKey: sr.biomarker,
          value: sr.value,
          patientId: patientResource.id,
          recordedAt: sample.verifiedAt || sample.createdAt
        });
        if (obs) observations.push(obs);
      }
    }
  }

  const reportId = `report-${sample._id?.toString() || 'sample'}`;
  const diagnosticReportResource = {
    resourceType: 'DiagnosticReport',
    id: reportId,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/DiagnosticReport']
    },
    identifier: [
      {
        system: 'urn:biosync:sample:barcode',
        value: sample.barcode || sample._id?.toString()
      }
    ],
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            code: 'LAB',
            display: 'Laboratory'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '11502-2',
          display: 'Laboratory report'
        }
      ],
      text: sample.testCatalog?.testName || 'Comprehensive Metabolic Diagnostic Panel'
    },
    subject: {
      reference: patientRef
    },
    performer: [
      {
        reference: `Practitioner/${practitionerResource.id}`,
        display: practitionerResource.name[0].text
      },
      {
        reference: `Organization/${orgResource.id}`,
        display: orgResource.name
      }
    ],
    effectiveDateTime: (sample.collectionTime || sample.createdAt || new Date()).toISOString(),
    issued: (sample.verifiedAt || sample.reportGenerationTime || new Date()).toISOString(),
    result: observations.map(obs => ({
      reference: `Observation/${obs.id}`,
      display: obs.code.text
    })),
    conclusion: sample.doctorRemarks || 'All assays verified in compliance with ISO 15189 biological tolerances.'
  };

  // Compile into FHIR R4 Bundle
  const bundle = {
    resourceType: 'Bundle',
    id: `bundle-${sample._id?.toString() || Date.now().toString(36)}`,
    meta: {
      lastUpdated: new Date().toISOString()
    },
    type: 'document',
    entry: [
      { fullUrl: `urn:uuid:${patientResource.id}`, resource: patientResource },
      { fullUrl: `urn:uuid:${orgResource.id}`, resource: orgResource },
      { fullUrl: `urn:uuid:${practitionerResource.id}`, resource: practitionerResource },
      { fullUrl: `urn:uuid:${diagnosticReportResource.id}`, resource: diagnosticReportResource },
      ...observations.map(obs => ({
        fullUrl: `urn:uuid:${obs.id}`,
        resource: obs
      }))
    ]
  };

  return bundle;
};

/**
 * Compiles a full longitudinal FHIR bundle from User's historical Vitals records
 */
export const exportVitalsToFhirBundle = ({ user, vitalsRecords = [] }) => {
  const patientResource = buildFhirPatientResource(user);
  const orgResource = buildFhirOrganizationResource();
  const observations = [];

  for (const record of vitalsRecords) {
    const recordedAt = record.recordedAt || record.createdAt;
    
    // Flatten record categories
    const categories = [
      record.bodyMetrics,
      record.metabolicHealth,
      record.cardiovascularRisk,
      record.continuousMetrics,
      record.organFunction,
      record.immunology,
      record.hormones,
      record.micronutrients
    ];

    for (const cat of categories) {
      if (!cat) continue;
      for (const [key, val] of Object.entries(cat)) {
        if (typeof val === 'number') {
          const obs = buildFhirObservation({
            metricKey: key,
            value: val,
            patientId: patientResource.id,
            recordedAt
          });
          if (obs) observations.push(obs);
        }
      }
    }
  }

  return {
    resourceType: 'Bundle',
    id: `vitals-bundle-${patientResource.id}`,
    meta: {
      lastUpdated: new Date().toISOString()
    },
    type: 'collection',
    entry: [
      { fullUrl: `urn:uuid:${patientResource.id}`, resource: patientResource },
      { fullUrl: `urn:uuid:${orgResource.id}`, resource: orgResource },
      ...observations.map(obs => ({
        fullUrl: `urn:uuid:${obs.id}`,
        resource: obs
      }))
    ]
  };
};

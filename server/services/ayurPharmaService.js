/**
 * BioSync AI - Ayur-Pharma Sentinel Service
 * Cross-interaction screening between traditional Indian botanicals and modern allopathic drugs.
 */

const BOTANICAL_DATABASE = {
  Karela: {
    scientificName: 'Momordica charantia',
    activeMarkers: ['Charantin', 'Vicine', 'Polypeptide-p'],
    targetAllopathicClasses: ['Sulfonylureas', 'Insulin', 'Meglitinides'],
    interferingDrugs: ['glimepiride', 'gliclazide', 'glipizide', 'glyburide', 'repaglinide', 'insulin', 'humalog', 'novorapid', 'lantus'],
    clinicalRisk: 'Severe Compounded Hypoglycemia',
    severity: 'CRITICAL_LOCKOUT',
    autoBlockVitalsGuard: true,
    clinicalAdvisory: 'Concurrent ingestion of Karela with Sulfonylureas causes uncontrolled additive glucose uptake, triggering severe nocturnal hypoglycemia (<50 mg/dL).'
  },
  Methi: {
    scientificName: 'Trigonella foenum-graecum',
    activeMarkers: ['4-hydroxyisoleucine', 'Galactomannan Fiber'],
    targetAllopathicClasses: ['Biguanides', 'Anticoagulants'],
    interferingDrugs: ['metformin', 'warfarin', 'acenocoumarol'],
    clinicalRisk: 'Additive Hypoglycemia & GI Cramping / Bleeding Risk',
    severity: 'WARNING_ADVISORY',
    autoBlockVitalsGuard: false,
    clinicalAdvisory: 'High-dose Fenugreek combined with Metformin may cause acute gastrointestinal distress or rapid glucose drop.'
  },
  Giloy: {
    scientificName: 'Tinospora cordifolia',
    activeMarkers: ['Tinosporine', 'Berberine Alkaloids'],
    targetAllopathicClasses: ['Statins', 'Hepatotoxic Agents', 'Immunosuppressants'],
    interferingDrugs: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'paracetamol', 'acetaminophen', 'tacrolimus', 'cyclosporine'],
    clinicalRisk: 'Herb-Induced Liver Injury (HILI) & Immunosuppression Antagonism',
    severity: 'WARNING_ADVISORY',
    autoBlockVitalsGuard: false,
    clinicalAdvisory: 'High-dose Giloy extracts combined with Statins or frequent Paracetamol increase risk of subclinical transaminase (ALT/AST) elevation.'
  },
  Ashwagandha: {
    scientificName: 'Withania somnifera',
    activeMarkers: ['Withanolides', 'Withaferin A'],
    targetAllopathicClasses: ['Thyroid Hormones', 'Sedatives', 'Benzodiazepines'],
    interferingDrugs: ['levothyroxine', 'thyronorm', 'eltroxin', 'alprazolam', 'clonazepam', 'zolpidem'],
    clinicalRisk: 'Subclinical Thyrotoxicosis & Synergistic CNS Depression',
    severity: 'CRITICAL_LOCKOUT',
    autoBlockVitalsGuard: true,
    clinicalAdvisory: 'Ashwagandha stimulates thyroid hormone production and GABA-A receptors, inducing palpitations or over-sedation.'
  },
  Neem: {
    scientificName: 'Azadirachta indica',
    activeMarkers: ['Azadirachtin', 'Nimbin'],
    targetAllopathicClasses: ['Immunosuppressants'],
    interferingDrugs: ['tacrolimus', 'cyclosporine', 'mycophenolate'],
    clinicalRisk: 'Immune Rejection Provocation',
    severity: 'CRITICAL_LOCKOUT',
    autoBlockVitalsGuard: true,
    clinicalAdvisory: 'Neem stimulates T-cell proliferation, directly counteracting immunosuppressants in transplant patients.'
  },
  Licorice_Mulethi: {
    scientificName: 'Glycyrrhiza glabra',
    activeMarkers: ['Glycyrrhizin', 'Glycyrrhetinic Acid'],
    targetAllopathicClasses: ['Antihypertensives', 'Diuretics'],
    interferingDrugs: ['telmisartan', 'losartan', 'amlodipine', 'furosemide', 'spironolactone', 'ramipril'],
    clinicalRisk: 'Pseudo-Hyperaldosteronism, Severe Sodium Retention & Hypertensive Crisis',
    severity: 'CRITICAL_LOCKOUT',
    autoBlockVitalsGuard: true,
    clinicalAdvisory: 'Glycyrrhetinic acid prevents renal cortisol breakdown into cortisone, triggering severe hypertensive spikes.'
  },
  Jamun: {
    scientificName: 'Syzygium cumini',
    activeMarkers: ['Jamboline', 'Ellagic Acid'],
    targetAllopathicClasses: ['Sulfonylureas', 'Insulin'],
    interferingDrugs: ['glimepiride', 'gliclazide', 'insulin'],
    clinicalRisk: 'Potentiated Hypoglycemia',
    severity: 'WARNING_ADVISORY',
    autoBlockVitalsGuard: false,
    clinicalAdvisory: 'Jamun seed powder slows starch conversion to sugar. In combination with secretagogues, watch for unexpected glucose drops.'
  }
};

/**
 * Screens botanicals against patient medications
 * @param {Array<string|object>} botanicals - Array of botanical names or objects
 * @param {Array<string>} medications - Array of medication strings
 * @param {Array<string>} [clinicalConditions=[]] - Diagnosed conditions
 */
export function ayurPharmaScreen(botanicals = [], medications = [], clinicalConditions = []) {
  const normalizedMeds = (medications || []).map(m => m.toLowerCase().trim());
  const detectedConflicts = [];
  let isBlocked = false;

  for (const botEntry of botanicals) {
    const botName = typeof botEntry === 'string' ? botEntry : (botEntry?.name || '');
    const spec = BOTANICAL_DATABASE[botName];
    if (!spec) continue;

    for (const drugPattern of spec.interferingDrugs) {
      for (const med of normalizedMeds) {
        if (med.includes(drugPattern)) {
          const isCritical = spec.severity === 'CRITICAL_LOCKOUT';
          if (isCritical && spec.autoBlockVitalsGuard) {
            isBlocked = true;
          }

          const conflict = {
            botanical: botName,
            scientificName: spec.scientificName,
            matchedMedication: med,
            severity: spec.severity,
            clinicalRisk: spec.clinicalRisk,
            advisory: spec.clinicalAdvisory,
            blocksVitalsGuard: spec.autoBlockVitalsGuard
          };

          if (!detectedConflicts.some(c => c.botanical === botName && c.matchedMedication === med)) {
            detectedConflicts.push(conflict);
          }
        }
      }
    }
  }

  return {
    hasConflicts: detectedConflicts.length > 0,
    isBlocked,
    conflictsCount: detectedConflicts.length,
    criticalLockouts: detectedConflicts.filter(c => c.severity === 'CRITICAL_LOCKOUT'),
    conflicts: detectedConflicts,
    status: isBlocked ? 'BLOCKED' : (detectedConflicts.length > 0 ? 'WARNING' : 'CLEAR')
  };
}

export default {
  BOTANICAL_DATABASE,
  ayurPharmaScreen
};


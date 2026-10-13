"""
BioSync AI - Pharmacodynamics & Medication-Nutrient Interaction Engine
Module: pharmacodynamics.py

Models the physiological pharmacokinetic/pharmacodynamic (PK/PD) modulation
of common cardiometabolic medications on:
1. Hepatic Endogenous Glucose Production (EGP)
2. Renal Glucose Excretion Threshold (SGLT2 clearance)
3. Incretin-Induced Gastric Motility Delay & Insulin Secretion (GLP-1 RA)
4. Vascular Renin-Angiotensin Sodium Sensitivity (ACEi / ARBs)
5. Autonomic Baroreflex Heart Rate Dynamics (Beta-blockers)
6. Adverse Food-Drug Interactions (e.g., CYP3A4 inhibition by grapefruit, hyperkalemia risk)
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class PharmacodynamicProfile:
    """Quantitative physiological modulation factors induced by patient medications."""
    egp_suppression_factor: float = 0.0          # 0.0 (none) to 0.40 (Metformin)
    renal_threshold_mg_dl: float = 180.0         # Normal: 180 mg/dL, SGLT2i: ~90-100 mg/dL
    gastric_delay_factor: float = 1.0            # 1.0 (normal) up to 1.50 (GLP-1 RA)
    incretin_insulin_boost: float = 0.0          # 0.0 (normal) up to 0.45 (GLP-1 / DPP-4)
    peripheral_sensitivity_boost: float = 0.0    # Boost to S_I
    vascular_sodium_blunt_factor: float = 0.0    # Blunts BP rise from sodium (ACEi/ARBs)
    baroreflex_hr_attenuation: float = 0.0       # Blunts HR reflex (Beta-blockers)
    active_medications: List[str] = field(default_factory=list)
    clinical_alerts: List[Dict[str, str]] = field(default_factory=list)
    food_drug_interactions: List[Dict[str, str]] = field(default_factory=list)


# Clinical Drug Knowledge Base
SUPPORTED_MEDICATIONS = {
    # Metformin (Biguanides)
    "metformin": {
        "class": "Biguanide",
        "egp_suppression": 0.35,              # 35% reduction in hepatic gluconeogenesis
        "peripheral_sensitivity": 0.18,       # 18% improvement in peripheral insulin sensitivity
        "renal_threshold": 180.0,
        "gastric_delay": 1.05,
        "warnings": "Take with meals to minimize gastrointestinal discomfort. Avoid excessive acute alcohol consumption."
    },
    # SGLT2 Inhibitors
    "sglt2_inhibitor": {
        "class": "SGLT2 Inhibitor",
        "aliases": ["empagliflozin", "dapagliflozin", "canagliflozin", "jardiance", "forxiga"],
        "egp_suppression": 0.05,
        "renal_threshold": 95.0,              # Lowers tubular reabsorption threshold to 95 mg/dL
        "vascular_blunt": 0.15,               # Mild osmotic diuresis lowers baseline blood pressure
        "warnings": "Increased urinary glucose excretion. Maintain adequate fluid and electrolyte intake."
    },
    # GLP-1 Receptor Agonists & Dual Agonists
    "glp1_receptor_agonist": {
        "class": "GLP-1 Receptor Agonist / Incretin Mimetic",
        "aliases": ["semaglutide", "tirzepatide", "ozempic", "wegovy", "mounjaro", "liraglutide"],
        "gastric_delay": 1.45,                # 45% delay in gastric emptying rate (Brener et al.)
        "incretin_insulin_boost": 0.50,       # Glucose-dependent second-phase insulin amplification
        "egp_suppression": 0.25,              # Glucagon suppression reduces hepatic glucose output
        "warnings": "Gastric emptying is significantly delayed. Prioritize nutrient-dense proteins and hydration."
    },
    # DPP-4 Inhibitors
    "dpp4_inhibitor": {
        "class": "DPP-4 Inhibitor",
        "aliases": ["sitagliptin", "linagliptin", "vildagliptin", "januvia"],
        "incretin_insulin_boost": 0.22,
        "egp_suppression": 0.12,
        "gastric_delay": 1.10,
        "warnings": "Incretin half-life extended. Enhances physiological meal-stimulated insulin release."
    },
    # ACE Inhibitors & ARBs (Renin-Angiotensin Blockers)
    "ace_inhibitor": {
        "class": "ACE Inhibitor / ARB",
        "aliases": ["ramipril", "telmisartan", "losartan", "lisinopril", "enalapril", "valsartan"],
        "vascular_blunt": 0.40,               # Blunts 40% of acute sodium-induced vascular vasoconstriction
        "warnings": "Arterial compliance protected. Potassium retention possible: monitor high-potassium salt substitutes."
    },
    # Beta-Adrenergic Blockers
    "beta_blocker": {
        "class": "Beta-Blocker",
        "aliases": ["metoprolol", "atenolol", "bisoprolol", "carvedilol"],
        "baroreflex_hr_attenuation": 0.50,    # 50% blunting of postprandial baroreflex tachycardia
        "warnings": "Attenuates sympathetic heart rate response. May blunt adrenergic symptoms of hypoglycemia."
    },
    # Statins
    "statin": {
        "class": "HMG-CoA Reductase Inhibitor (Statin)",
        "aliases": ["atorvastatin", "rosuvastatin", "simvastatin", "lipitor", "crestor"],
        "warnings": "Lipid-lowering therapy. Interacts with intestinal CYP3A4 inhibitors (grapefruit)."
    },
    # Calcium Channel Blockers
    "calcium_channel_blocker": {
        "class": "Dihydropyridine CCB",
        "aliases": ["amlodipine", "nifedipine", "felodipine", "norvasc"],
        "vascular_blunt": 0.30,
        "warnings": "Arterial vasodilator. Metabolized by CYP3A4."
    }
}


class PharmacodynamicsEngine:
    """Evaluates multi-medication physiological interactions and food-drug compatibility."""

    @classmethod
    def resolve_profile(
        cls,
        medications: Optional[List[str]] = None,
        food_items: Optional[List[str]] = None
    ) -> PharmacodynamicProfile:
        """
        Parses list of medication names or classes, generates compounded
        physiological modulation factors, and detects food-drug contraindications.
        """
        profile = PharmacodynamicProfile()
        if not medications:
            return profile

        normalized_meds = [m.lower().strip() for m in medications if m and isinstance(m, str)]
        matched_classes = set()

        for med in normalized_meds:
            for med_key, med_info in SUPPORTED_MEDICATIONS.items():
                aliases = [med_key] + med_info.get("aliases", [])
                if any(alias in med or med in alias for alias in aliases):
                    matched_classes.add(med_key)
                    if med not in profile.active_medications:
                        profile.active_medications.append(med.title())

        # Compile compounded physiological modulations
        for med_key in matched_classes:
            info = SUPPORTED_MEDICATIONS[med_key]

            # EGP suppression (compounds multiplicatively)
            egp_sup = info.get("egp_suppression", 0.0)
            profile.egp_suppression_factor = 1.0 - (1.0 - profile.egp_suppression_factor) * (1.0 - egp_sup)

            # Renal threshold (takes minimum threshold if SGLT2i active)
            r_thresh = info.get("renal_threshold")
            if r_thresh and r_thresh < profile.renal_threshold_mg_dl:
                profile.renal_threshold_mg_dl = r_thresh

            # Gastric delay (compounds)
            g_delay = info.get("gastric_delay", 1.0)
            profile.gastric_delay_factor *= g_delay

            # Incretin boost
            profile.incretin_insulin_boost += info.get("incretin_insulin_boost", 0.0)

            # Peripheral insulin sensitivity
            profile.peripheral_sensitivity_boost += info.get("peripheral_sensitivity", 0.0)

            # Vascular sodium blunting
            profile.vascular_sodium_blunt_factor = max(
                profile.vascular_sodium_blunt_factor,
                info.get("vascular_blunt", 0.0)
            )

            # Baroreflex HR attenuation
            profile.baroreflex_hr_attenuation = max(
                profile.baroreflex_hr_attenuation,
                info.get("baroreflex_hr_attenuation", 0.0)
            )

            # Clinical advisories
            if "warnings" in info:
                profile.clinical_alerts.append({
                    "medicationClass": info["class"],
                    "advisory": info["warnings"]
                })

        # Cap bounds for biological stability
        profile.gastric_delay_factor = min(1.80, max(1.0, profile.gastric_delay_factor))
        profile.incretin_insulin_boost = min(0.80, max(0.0, profile.incretin_insulin_boost))
        profile.egp_suppression_factor = min(0.60, max(0.0, profile.egp_suppression_factor))

        # Check Food-Drug Interactions
        if food_items:
            cls._check_food_drug_interactions(matched_classes, food_items, profile)

        return profile

    @classmethod
    def _check_food_drug_interactions(
        cls,
        matched_classes: set,
        food_items: List[str],
        profile: PharmacodynamicProfile
    ):
        """Scans meal components for documented clinical food-drug interactions."""
        foods_lower = [f.lower().strip() for f in food_items if f and isinstance(f, str)]

        # 1. Grapefruit / CYP3A4 Furanocoumarin Inhibition
        has_grapefruit = any("grapefruit" in f or "pomelo" in f for f in foods_lower)
        if has_grapefruit:
            if "statin" in matched_classes:
                profile.food_drug_interactions.append({
                    "severity": "CRITICAL_CAUTION",
                    "interaction": "Grapefruit & Statin CYP3A4 Inhibition",
                    "mechanism": "Furanocoumarins irreversibly inhibit intestinal CYP3A4, increasing oral bioavailability and systemic statin exposure up to 300%, elevating rhabdomyolysis risk.",
                    "clinicalAction": "Avoid grapefruit or pomelo while taking atorvastatin/simvastatin."
                })
            if "calcium_channel_blocker" in matched_classes:
                profile.food_drug_interactions.append({
                    "severity": "MODERATE_CAUTION",
                    "interaction": "Grapefruit & Calcium Channel Blocker Vasodilation",
                    "mechanism": "Inhibition of CYP3A4 increases plasma amlodipine levels, potentially precipitating orthostatic hypotension and peripheral edema.",
                    "clinicalAction": "Separate consumption by at least 24 hours or substitute with non-citrus fruits."
                })

        # 2. Potassium-rich foods / Salt Substitutes & ACE Inhibitors / ARBs
        has_high_potassium = any("banana" in f or "potassium" in f or "salt substitute" in f or "spinach" in f for f in foods_lower)
        if has_high_potassium and ("ace_inhibitor" in matched_classes or "arb" in matched_classes):
            profile.food_drug_interactions.append({
                "severity": "MODERATE_CAUTION",
                "interaction": "High Potassium Intake & ACE-Inhibitor / ARB Hyperkalemia Risk",
                "mechanism": "Inhibition of the renin-angiotensin-aldosterone axis reduces renal potassium excretion. High dietary potassium or potassium-based salt substitutes significantly increase serum K+, risking cardiac arrhythmias.",
                "clinicalAction": "Moderate potassium-dense foods; do not use KCl salt substitutes while on ACE inhibitors or ARBs without serum electrolyte monitoring."
            })

        # 3. Tyramine-rich aged foods & Processed meats
        has_aged_cheese_or_cured = any("aged cheese" in f or "cured meat" in f or "salami" in f for f in foods_lower)
        if has_aged_cheese_or_cured and "ace_inhibitor" in matched_classes:
            profile.food_drug_interactions.append({
                "severity": "INFO",
                "interaction": "High-Sodium / Tyramine Processed Food Intake",
                "mechanism": "High sodium intake partially counteracts the vascular blood-pressure lowering efficacy of ACE inhibitors.",
                "clinicalAction": "Pair with high-potassium fresh vegetables to restore optimal vascular ratio."
            })


pharmacodynamics_engine = PharmacodynamicsEngine()

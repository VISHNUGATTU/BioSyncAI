"""
BioSync AI - Phase 3: Cultural & Indo-Metabolic Engine
Module: ayur_pharma_matrix.py

Ayurvedic-Allopathic Herb-Drug-Nutrient Pharmacovigilance Matrix:
Quantifies pharmacokinetic (PK) and pharmacodynamic (PD) cross-reactions
between standardized Indian traditional botanicals and contemporary allopathic medications.

Covers the top 15 Indian botanicals, identifying:
- Exact active biochemical marker (e.g. Charantin, Withanolides, Glycyrrhizin, Bacosides)
- Target cytochrome enzymes & receptors (CYP3A4, 11-beta-HSD2, PXR, GLUT-4, GABA-A)
- Clinical Severity Classification (CRITICAL_LOCKOUT, WARNING_ADVISORY, SYNERGISTIC_BENEFIT)
- Vitals Guard Auto-Blockade determination
"""

from typing import Dict, Any, List, Optional


class AyurPharmaMatrix:
    """
    Comprehensive pharmacokinetic and pharmacodynamic cross-interaction sentinel.
    """

    # Knowledge Base: 15 Core Indian Traditional Botanicals
    BOTANICAL_DATABASE = {
        "Karela": {
            "scientificName": "Momordica charantia",
            "activeMarkers": ["Charantin", "Vicine", "Polypeptide-p"],
            "primaryMechanism": "Direct insulin-mimetic peripheral GLUT-4 translocation and pancreatic beta-cell insulin secretion stimulation.",
            "targetAllopathicClasses": ["Sulfonylureas", "Insulin", "Meglitinides"],
            "interferingDrugs": ["glimepiride", "gliclazide", "glipizide", "glyburide", "repaglinide", "insulin", "humalog", "novorapid", "lantus"],
            "clinicalRisk": "Severe Compounded Hypoglycemia",
            "severity": "CRITICAL_LOCKOUT",
            "autoBlockVitalsGuard": True,
            "clinicalAdvisory": "Concurrent ingestion of Karela with Sulfonylureas or exogenous Insulin causes uncontrolled additive glucose uptake, triggering severe nocturnal hypoglycemia (<50 mg/dL).",
            "safeAlternative": "Steam bitter gourd in smaller quantities (<50g) and pair with complex starch, or replace with steamed French beans."
        },
        "Methi": {
            "scientificName": "Trigonella foenum-graecum",
            "activeMarkers": ["4-hydroxyisoleucine", "Galactomannan Fiber"],
            "primaryMechanism": "Direct stimulation of glucose-dependent insulin secretion and intestinal carbohydrate absorption delay.",
            "targetAllopathicClasses": ["Biguanides", "Anticoagulants"],
            "interferingDrugs": ["metformin", "warfarin", "acenocoumarol"],
            "clinicalRisk": "Additive Hypoglycemia & GI Cramping / Bleeding Risk",
            "severity": "WARNING_ADVISORY",
            "autoBlockVitalsGuard": False,
            "clinicalAdvisory": "High-dose Fenugreek combined with Metformin may cause acute gastrointestinal distress or rapid glucose drop. If taking Warfarin, monitor INR due to mild coumarin content.",
            "safeAlternative": "Limit whole seeds to <5g per meal; roast seeds to break down bitter saponins."
        },
        "Giloy": {
            "scientificName": "Tinospora cordifolia",
            "activeMarkers": ["Tinosporine", "Berberine Alkaloids"],
            "primaryMechanism": "Hepatocellular cytochrome modulation and immunostimulation.",
            "targetAllopathicClasses": ["Statins", "Hepatotoxic Agents", "Immunosuppressants"],
            "interferingDrugs": ["atorvastatin", "rosuvastatin", "simvastatin", "paracetamol", "acetaminophen", "tacrolimus", "cyclosporine"],
            "clinicalRisk": "Herb-Induced Liver Injury (HILI) & Immunosuppression Antagonism",
            "severity": "WARNING_ADVISORY",
            "autoBlockVitalsGuard": False,
            "clinicalAdvisory": "High-dose Giloy extracts combined with Statins or frequent Paracetamol increase risk of subclinical transaminase (ALT/AST) elevation. Contraindicated in transplant patients.",
            "safeAlternative": "Use standardized aqueous formulations with verified low hepatotoxicity index."
        },
        "Ashwagandha": {
            "scientificName": "Withania somnifera",
            "activeMarkers": ["Withanolides", "Withaferin A"],
            "primaryMechanism": "Thyroid gland stimulation (T4 upregulation) and central GABA-A receptor modulation.",
            "targetAllopathicClasses": ["Thyroid Hormones", "Sedatives", "Benzodiazepines"],
            "interferingDrugs": ["levothyroxine", "thyronorm", "eltroxin", "alprazolam", "clonazepam", "zolpidem"],
            "clinicalRisk": "Subclinical Thyrotoxicosis & Synergistic CNS Depression",
            "severity": "CRITICAL_LOCKOUT",
            "autoBlockVitalsGuard": True,
            "clinicalAdvisory": "Ashwagandha significantly increases endogenous serum T3 and T4 levels, risking iatrogenic hyperthyroidism in patients taking Levothyroxine. Potentiates prescription sedatives.",
            "safeAlternative": "Substitute with Shankhpushpi or Chamomile for relaxation without thyroid hormone upregulation."
        },
        "Turmeric_Curcumin": {
            "scientificName": "Curcuma longa",
            "activeMarkers": ["Curcuminoids", "Demethoxycurcumin"],
            "primaryMechanism": "Inhibition of platelet thromboxane A2 synthesis and COX-1 enzyme suppression.",
            "targetAllopathicClasses": ["Antiplatelets", "Anticoagulants", "NSAIDs"],
            "interferingDrugs": ["aspirin", "ecosprin", "clopidogrel", "plavix", "warfarin", "dabigatran", "apixaban"],
            "clinicalRisk": "Additive Antiplatelet Bleeding Diathesis",
            "severity": "WARNING_ADVISORY",
            "autoBlockVitalsGuard": False,
            "clinicalAdvisory": "High-dose supplemental Curcumin (>500mg) combined with Aspirin or Clopidogrel inhibits platelet aggregation, increasing bleeding time, petechiae, and bruising risk.",
            "safeAlternative": "Use culinary ground turmeric (<2g) as a spice rather than concentrated 95% piperine-curcumin extracts."
        },
        "Triphala": {
            "scientificName": "Phyllanthus emblica, Terminalia chebula, Terminalia bellirica",
            "activeMarkers": ["Chebulinic Acid", "Gallic Acid", "Anthraquinones"],
            "primaryMechanism": "Stimulation of colonic motility and osmotic fluid secretion causing potassium depletion.",
            "targetAllopathicClasses": ["Cardiac Glycosides", "Loop Diuretics"],
            "interferingDrugs": ["digoxin", "furosemide", "lasix", "torsemide"],
            "clinicalRisk": "Hypokalemia-Induced Digitalis Toxicity & Arrhythmia",
            "severity": "CRITICAL_LOCKOUT",
            "autoBlockVitalsGuard": True,
            "clinicalAdvisory": "Triphala-induced potassium wasting exacerbates hypokalemia in patients on Furosemide, drastically sensitizing the myocardium to fatal Digoxin arrhythmias.",
            "safeAlternative": "Use soluble psyllium husk (Isabgol) with adequate water for gentle motility without electrolyte depletion."
        },
        "Gymnema_Gurmar": {
            "scientificName": "Gymnema sylvestre",
            "activeMarkers": ["Gymnemic Acids"],
            "primaryMechanism": "Blockade of intestinal Na+-glucose cotransporters and lingual sweet taste receptors.",
            "targetAllopathicClasses": ["SGLT2 Inhibitors", "Insulin"],
            "interferingDrugs": ["dapagliflozin", "empagliflozin", "canagliflozin", "forxiga", "jardiance"],
            "clinicalRisk": "Euglycemic Diabetic Ketoacidosis (euDKA) Risk",
            "severity": "WARNING_ADVISORY",
            "autoBlockVitalsGuard": False,
            "clinicalAdvisory": "Gymnema suppresses taste for carbohydrates. If carbohydrate intake drops drastically while on SGLT2 inhibitors, the body shifts to severe lipolysis, elevating ketone bodies.",
            "safeAlternative": "Ensure minimum 80g net carbohydrate intake if consuming Gurmar to prevent starvation ketosis."
        },
        "Amla": {
            "scientificName": "Phyllanthus emblica",
            "activeMarkers": ["Ascorbic Acid", "Ellagitannins"],
            "primaryMechanism": "Reduces dietary ferric Fe3+ to bioavailable ferrous Fe2+; high metabolic oxalate precursor.",
            "targetAllopathicClasses": ["Iron Supplements", "Renal Calculi in CKD"],
            "interferingDrugs": ["ferrous ascorbate", "ferrous sulfate", "autologous iron"],
            "clinicalRisk": "Secondary Hemochromatosis / Oxalate Nephropathy in CKD",
            "severity": "WARNING_ADVISORY",
            "autoBlockVitalsGuard": False,
            "clinicalAdvisory": "Amla boosts iron absorption by +65%. Beneficial in iron-deficiency anemia, but contraindicated in hemochromatosis or Stage 4 CKD due to calcium oxalate crystalluria.",
            "safeAlternative": "Safe for general population; CKD patients should limit to 1 fruit per week."
        },
        "Shankhpushpi": {
            "scientificName": "Convolvulus pluricaulis",
            "activeMarkers": ["Convolvine", "Microphyllic Acid"],
            "primaryMechanism": "Hepatic microsomal enzyme induction accelerating antiepileptic metabolism.",
            "targetAllopathicClasses": ["Anticonvulsants"],
            "interferingDrugs": ["phenytoin", "dilantin", "carbamazepine", "tegretol"],
            "clinicalRisk": "Sub-Therapeutic Anticonvulsant Levels & Breakthrough Seizures",
            "severity": "CRITICAL_LOCKOUT",
            "autoBlockVitalsGuard": True,
            "clinicalAdvisory": "Co-administration of Shankhpushpi reduces steady-state plasma concentrations of Phenytoin by up to 40%, triggering loss of seizure control.",
            "safeAlternative": "Avoid concurrent use; maintain strictly separated therapeutic windows (>6 hours)."
        },
        "Brahmi": {
            "scientificName": "Bacopa monnieri",
            "activeMarkers": ["Bacosides A and B"],
            "primaryMechanism": "Enhancement of central and peripheral acetylcholine synthesis and muscarinic signaling.",
            "targetAllopathicClasses": ["Beta-Blockers", "Cholinesterase Inhibitors"],
            "interferingDrugs": ["atenolol", "metoprolol", "bisoprolol", "donepezil", "rivastigmine"],
            "clinicalRisk": "Additive Cholinergic Vagotonia & Severe Bradycardia",
            "severity": "WARNING_ADVISORY",
            "autoBlockVitalsGuard": False,
            "clinicalAdvisory": "Brahmi enhances vagal parasympathetic tone. When paired with high-dose Beta-blockers, resting heart rate may drop below 45 bpm (symptomatic sinus bradycardia).",
            "safeAlternative": "Monitor resting heart rate via smartwatch; adjust morning timing."
        },
        "Guggul": {
            "scientificName": "Commiphora mukul",
            "activeMarkers": ["E- and Z-Guggulsterones"],
            "primaryMechanism": "Potent activation of Pregnane X Receptor (PXR) inducing CYP3A4 enzyme transcription.",
            "targetAllopathicClasses": ["Oral Contraceptives", "Calcium Channel Blockers", "Statins"],
            "interferingDrugs": ["ethinylestradiol", "levonorgestrel", "diltiazem", "amlodipine", "atorvastatin"],
            "clinicalRisk": "Accelerated Drug Metabolism & Therapeutic Failure",
            "severity": "CRITICAL_LOCKOUT",
            "autoBlockVitalsGuard": True,
            "clinicalAdvisory": "Guggulsterones are strong CYP3A4 inducers that rapidly clear oral contraceptives from systemic circulation, causing unintended pregnancy risk and reduced antihypertensive efficacy.",
            "safeAlternative": "Use plant stanols or soluble oat beta-glucan for lipid management without PXR activation."
        },
        "Cinnamon": {
            "scientificName": "Cinnamomum verum / Cinnamomum cassia",
            "activeMarkers": ["Cinnamaldehyde", "Coumarin (Cassia)"],
            "primaryMechanism": "Insulin receptor autophosphorylation and hepatic metabolic burden.",
            "targetAllopathicClasses": ["Statins", "Hepatotoxic Drugs"],
            "interferingDrugs": ["atorvastatin", "methotrexate", "leflunomide"],
            "clinicalRisk": "Cassia Coumarin-Induced Hepatotoxicity",
            "severity": "WARNING_ADVISORY",
            "autoBlockVitalsGuard": False,
            "clinicalAdvisory": "Cheap Cassia cinnamon contains up to 1% Coumarin, which stresses hepatic clearance when paired with Statins. True Ceylon cinnamon has negligible coumarin (<0.004%).",
            "safeAlternative": "Specify 100% True Ceylon Cinnamon (Cinnamomum verum) in recipe formulation."
        },
        "Tulsi": {
            "scientificName": "Ocimum sanctum",
            "activeMarkers": ["Eugenol", "Ursolic Acid"],
            "primaryMechanism": "Mild antiplatelet inhibition and peripheral glucose utilization stimulation.",
            "targetAllopathicClasses": ["Antiplatelets", "Oral Antidiabetics"],
            "interferingDrugs": ["aspirin", "clopidogrel", "glimepiride"],
            "clinicalRisk": "Mild Additive Antiplatelet Action & Hypoglycemia",
            "severity": "WARNING_ADVISORY",
            "autoBlockVitalsGuard": False,
            "clinicalAdvisory": "Eugenol in Holy Basil inhibits platelet aggregation. Use with caution prior to surgery or in patients on dual antiplatelet therapy.",
            "safeAlternative": "Culinary tea consumption (<3 cups) is safe; avoid concentrated medicinal distillates."
        },
        "Neem": {
            "scientificName": "Azadirachta indica",
            "activeMarkers": ["Azadirachtin", "Nimbin"],
            "primaryMechanism": "Cell-mediated immune response upregulation and pancreatic beta-cell stimulation.",
            "targetAllopathicClasses": ["Immunosuppressive Therapy", "Antidiabetics"],
            "interferingDrugs": ["tacrolimus", "cyclosporine", "mycophenolate", "prednisolone"],
            "clinicalRisk": "Immunosuppression Antagonism & Allograft Rejection Risk",
            "severity": "CRITICAL_LOCKOUT",
            "autoBlockVitalsGuard": True,
            "clinicalAdvisory": "Neem stimulates T-cell proliferation and interferon-gamma release, directly counteracting immunosuppressants in kidney/liver transplant patients, risking acute graft rejection.",
            "safeAlternative": "Strictly contraindicated for all organ transplant and autoimmune patients on active immunosuppression."
        },
        "Licorice_Mulethi": {
            "scientificName": "Glycyrrhiza glabra",
            "activeMarkers": ["Glycyrrhizin", "Glycyrrhetinic Acid"],
            "primaryMechanism": "Inhibition of renal 11-beta-hydroxysteroid dehydrogenase type 2 (11-beta-HSD2).",
            "targetAllopathicClasses": ["Antihypertensives", "Loop Diuretics", "Potassium-Sparing Diuretics"],
            "interferingDrugs": ["telmisartan", "losartan", "amlodipine", "furosemide", "spironolactone", "ramipril"],
            "clinicalRisk": "Pseudo-Hyperaldosteronism, Severe Sodium Retention & Hypertensive Crisis",
            "severity": "CRITICAL_LOCKOUT",
            "autoBlockVitalsGuard": True,
            "clinicalAdvisory": "Glycyrrhetinic acid prevents renal cortisol breakdown into cortisone. Cortisol floods mineralocorticoid receptors, causing massive sodium and water retention, potassium collapse, and refractory hypertensive spikes.",
            "safeAlternative": "Use Deglycyrrhizinated Licorice (DGL) where glycyrrhizin has been removed (<1%), preserving gastric coating benefits without cardiovascular risk."
        }
    }

    @classmethod
    def evaluate_cross_interactions(
        cls,
        botanicals: List[Dict[str, Any]],
        medications: List[str],
        clinical_conditions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Screens active botanicals against the patient's prescription medications and clinical status.
        """
        clinical_conditions = clinical_conditions or []
        detected_conflicts = []
        is_order_blocked = False
        normalized_meds = [m.lower().strip() for m in medications]

        for bot_entry in botanicals:
            bot_name = bot_entry.get("name") if isinstance(bot_entry, dict) else str(bot_entry)
            bot_spec = cls.BOTANICAL_DATABASE.get(bot_name)
            if not bot_spec:
                continue

            # Check for drug matching
            for drug_pattern in bot_spec["interferingDrugs"]:
                for patient_med in normalized_meds:
                    if drug_pattern in patient_med:
                        is_critical = bot_spec["severity"] == "CRITICAL_LOCKOUT"
                        if is_critical and bot_spec["autoBlockVitalsGuard"]:
                            is_order_blocked = True

                        conflict_record = {
                            "botanical": bot_name,
                            "scientificName": bot_spec["scientificName"],
                            "matchedMedication": patient_med,
                            "severity": bot_spec["severity"],
                            "clinicalRisk": bot_spec["clinicalRisk"],
                            "mechanism": bot_spec["primaryMechanism"],
                            "advisory": bot_spec["clinicalAdvisory"],
                            "safeAlternative": bot_spec["safeAlternative"],
                            "blocksVitalsGuard": bot_spec["autoBlockVitalsGuard"]
                        }
                        if conflict_record not in detected_conflicts:
                            detected_conflicts.append(conflict_record)

        # Condition-specific checks (e.g. CKD vs high oxalate/potassium botanicals)
        if "CKD" in clinical_conditions or "Chronic_Kidney_Disease" in clinical_conditions:
            for bot_entry in botanicals:
                b_name = bot_entry.get("name") if isinstance(bot_entry, dict) else str(bot_entry)
                if b_name in ["Triphala", "Amla", "Licorice_Mulethi"]:
                    detected_conflicts.append({
                        "botanical": b_name,
                        "scientificName": cls.BOTANICAL_DATABASE[b_name]["scientificName"],
                        "matchedMedication": "Renal Impairment (CKD)",
                        "severity": "CRITICAL_LOCKOUT",
                        "clinicalRisk": "Renal Electrolyte Derangement / Oxalate Nephropathy",
                        "mechanism": "Decreased glomerular filtration impairs excretion of botanical organic acids and electrolytes.",
                        "advisory": f"{b_name} is contraindicated in compromised renal function (CKD Stage 3+).",
                        "safeAlternative": "Use double-boiled water infusions or omit completely.",
                        "blocksVitalsGuard": True
                    })
                    is_order_blocked = True

        critical_count = sum(1 for c in detected_conflicts if c["severity"] == "CRITICAL_LOCKOUT")
        warning_count = sum(1 for c in detected_conflicts if c["severity"] == "WARNING_ADVISORY")

        return {
            "success": True,
            "hasInteractions": len(detected_conflicts) > 0,
            "isOrderBlocked": is_order_blocked,
            "conflictCount": len(detected_conflicts),
            "criticalLockouts": critical_count,
            "warningAdvisories": warning_count,
            "conflicts": detected_conflicts,
            "summaryGuidance": (
                "CRITICAL: Order violates physiological safety boundaries due to contraindications."
                if is_order_blocked else
                "All botanical components passed pharmacovigilance screening."
                if not detected_conflicts else
                "Mild advisories detected; review meal pacing and timing."
            )
        }


ayur_pharma_matrix = AyurPharmaMatrix()


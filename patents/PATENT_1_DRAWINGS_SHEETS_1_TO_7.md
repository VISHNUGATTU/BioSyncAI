# FORM 2 - PATENT DRAWINGS
THE PATENTS ACT, 1970
(39 of 1970)
&
THE PATENTS RULES, 2003

## PATENT APPLICATION 1: FORMAL DRAWINGS (RULE 15 COMPLIANT)
**APPLICANT:** BioSync AI Systems India Private Limited
**TITLE:** A NON-INVASIVE WEARABLE PHYSIOLOGICAL SENSOR APPARATUS AND MULTI-COMPARTMENT DIGITAL TWIN SYSTEM FOR CONTINUOUS CUFFLESS HEMODYNAMIC-METABOLIC EXCURSION FORECASTING AND CLOSED-LOOP SKELETAL GLUCOSE CLEARANCE CONTROL

**TOTAL SHEETS:** 7
**SHEET NUMBERS:** SHEET 1 TO SHEET 7

---

### SHEET 1 / 7
#### FIG. 1: SYSTEM HARDWARE ARCHITECTURE & SENSOR SIGNAL CONDITIONING FLOWSHEET

```
+---------------------------------------------------------------------------------------------------+
|                              PHYSICAL WEARABLE SENSOR APPARATUS (100)                             |
|                                                                                                   |
|  +---------------------------+   +---------------------------+   +-----------------------------+  |
|  | Multi-Wavelength Optical  |   | Integrated Single-Lead    |   | 3-Axis Digital IMU /        |  |
|  | PPG Sensor (660nm, 940nm) |   | Electrocardiogram (ECG)   |   | Acoustic Microphone         |  |
|  | (101)                     |   | (102)                     |   | (103)                       |  |
|  +-------------+-------------+   +-------------+-------------+   +--------------+--------------+  |
|                |                               |                                |                 |
|                v                               v                                v                 |
|  +-------------+-------------+   +-------------+-------------+   +--------------+--------------+  |
|  | Analog Bandpass Filter    |   | Instrumentation Amplifier |   | 1.2 - 2.5 Hz Mastication     |  |
|  | (0.5 Hz - 5.0 Hz) (104)   |   | & R-Wave Peak Detector    |   | Bandpass Filter              |  |
|  +-------------+-------------+   +-------------+-------------+   +--------------+--------------+  |
|                |                               |                                |                 |
|                +-------------------------------+--------------------------------+                 |
|                                                |                                                  |
|                                                v                                                  |
|                              +---------------------------------+                                  |
|                              | 16-Bit ADC @ 250 Hz & Ultra-    |                                  |
|                              | Low Power Microcontroller (105) |                                  |
|                              | - PTT Calculator: Delta(t_R,PPG)|                                  |
|                              | - Rolling Step Counter & Cadence|                                  |
|                              +----------------+----------------+                                  |
|                                               |                                                   |
|                                               v                                                   |
|                              +---------------------------------+                                  |
|                              | Encrypted BLE 5.3 / Cellular    |                                  |
|                              | IoT Wireless Transceiver (106)  |                                  |
|                              +----------------+----------------+                                  |
+-----------------------------------------------|---------------------------------------------------+
                                                | Encrypted Telemetry Stream
                                                v
+---------------------------------------------------------------------------------------------------+
|                                  BIOPHYSICAL HOST PLATFORM (200)                                  |
|                                                                                                   |
|  +---------------------------------+              +--------------------------------------------+  |
|  | Calibrated Moens-Korteweg /     |              | 7-Compartment Runge-Kutta 4th-Order        |  |
|  | Hughes Cuffless BP Derivation   |              | Biophysical ODE Digestion Solver           |  |
|  | SBP = SBP0 + 2/gamma*ln(PTT0/PTT|              | dG/dt = Ra(t) - (SG + X(t))*G(t) - GLUT4(t)|  |
|  +----------------+----------------+              +---------------------+----------------------+  |
|                   |                                                     |                         |
|                   +--------------------------+--------------------------+                         |
|                                              |                                                    |
|                                              v                                                    |
|                         +------------------------------------------+                              |
|                         | Closed-Loop Skeletal Muscle GLUT-4       |                              |
|                         | Ambulation Biofeedback Controller        |                              |
|                         | TargetSteps = round(m_excess/0.38)*110   |                              |
|                         +--------------------+---------------------+                              |
|                                              |                                                    |
|                                              v Haptic / Step Tracking Feedback Loop               |
|                         +------------------------------------------+                              |
|                         | Wearable Real-Time Step Decrementer      |                              |
|                         | & Metabolic Stabilization Signal         |                              |
|                         +------------------------------------------+                              |
+---------------------------------------------------------------------------------------------------+
```

---

### SHEET 2 / 7
#### FIG. 2: CALIBRATED DIFFERENTIAL HUGHES ELASTICITY & MOENS-KORTEWEG PTT-TO-BP MODEL

```
     Systolic Blood Pressure SBP (mmHg)
       ^
   200 |                                                 .--- Hypertensive Crisis Window
       |                                              .-'     (PTT < 140 ms, SBP > 175 mmHg)
   180 |                                           .-'
       |                                        .-'
   160 |                                     .-'
       |                                  .-'
   140 |------------------------------.--'------------------- Clinical Hypertension Boundary (140 mmHg)
       |                           .-'
   120 |------------------------.-'-------------------------- Nominal Euglycemic Baseline (120 mmHg)
       |                     .-'  (PTT0 = 220 ms)
   100 |                  .-'
       |               .-'
    80 |            .-'
       |         .-'
    60 |      .-'                                         --- Profound Vasodilation
       |   .-'                                                (PTT > 360 ms, SBP < 85 mmHg)
       +------------------------------------------------------------> Pulse Transit Time PTT (ms)
       0      100       150       200       250       300       350       400

  Governing Formulation:
  PWV = L / PTT = sqrt( [E0 * exp(gamma * P) * h] / [2 * R * rho] )
  SBP(t) = SBP0 + (2 / gamma) * ln( PTT0 / PTT(t) ) + kappa_HR * (HR(t) - HR0)
  DBP(t) = SBP(t) * [0.66 - 0.001 * (SBP(t) - 120)]
```

---

### SHEET 3 / 7
#### FIG. 3: 7-COMPARTMENT BIOPHYSICAL RUNGE-KUTTA 4TH-ORDER ODE TRANSPORT SYSTEM

```
  +---------------------------------------------------------------------------------------------+
  | Ingested Meal: Net Carbohydrates, Amylose Ratio (alpha), Resistant Starch (beta), Lipids    |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 v
  +---------------------------------------------------------------------------------------------+
  | COMPARTMENT 1: Solid-Phase Gastric Grinding Lumen (q_sto1)                                  |
  | dq_sto1/dt = - k_gri * q_sto1                                                               |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 | Gastric Grinding Breakdown (k_gri = 0.045 /min)
                                                 v
  +---------------------------------------------------------------------------------------------+
  | COMPARTMENT 2: Liquid Chyme Gastric Emptying Lumen (q_sto2)                                 |
  | dq_sto2/dt = k_gri * q_sto1 - k_empt(t) * q_sto2                                            |
  | * Gastric Retardation: k_empt(t) = k_empt0 / [1.0 + 0.35 * tanh(M_fat / 25.0)]               |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 | Pyloric Sphincter Chyme Flux
                                                 v
  +---------------------------------------------------------------------------------------------+
  | COMPARTMENT 3: Duodenal & Proximal Jejunal Starch Hydrolysis (q_gut)                        |
  | dq_gut/dt = k_empt(t) * q_sto2 - k_abs * q_gut                                              |
  | * Starch Kinetics: k_abs = k_abs0 * (1 - 0.45*alpha_amylose) * (1 - 0.60*beta_RS3) * (1-k_f) |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 | Intestinal SGLT-1 & GLUT-2 Translocation
                                                 v
  +---------------------------------------------------------------------------------------------+
  | COMPARTMENT 4: Hepatic Portal Vein Delivery & Fractional Bioavailability                    |
  | Ra(t) = [f * k_abs * q_gut(t) * 1000] / [V_G * BW]                                          |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 v
  +---------------------------------------------------------------------------------------------+
  | COMPARTMENT 5: Circulating Plasma Glucose Volume (G(t))                                     |
  | dG/dt = Ra(t) - [S_G + X(t)] * G(t) + S_G * G_b - GLUT4_exercise(t)                         |
  +-----------------------+----------------------------------------------+----------------------+
                          ^                                              ^
                          | Interstitial Insulin Delay                   | Exercise Translocation
  +-----------------------+----------------------+  +--------------------+----------------------+
  | COMPARTMENT 6: Remote Insulin Action (X(t))  |  | SKELETAL MUSCLE SINK (GLUT-4)             |
  | dX/dt = - p2 * X(t) + p3 * (I(t) - I_b)      |  | GLUT4_exercise(t) = eta * v_walk *        |
  | Endogenous Pancreatic Beta-Cell Coupling     |  |                     [ (G(t) - Gb) / G(t) ]|
  +----------------------------------------------+  +-------------------------------------------+
```

---

### SHEET 4 / 7
#### FIG. 4: ENZYMATIC HYDROLYSIS RETARDATION CURVES (AMYLOSE & RETROGRADED RS3 FACTOR)

```
  Glucose Rate of Appearance Ra(t) [mg/dL/min]
    ^
  4 |                   .--- Curve A: Waxy Starch / High Amylopectin (alpha = 0.10, beta = 0.00)
    |                  / \   [Rapid Hydrolysis, Steep Spike: Peak = 215 mg/dL at T+42m]
  3 |                 /   \
    |                /     \             .--- Curve B: Standard Basmati Rice (alpha = 0.22, beta = 0.05)
  2 |               /   .---'-----------/ \   [Moderate Excursion: Peak = 168 mg/dL at T+54m]
    |              /  .-'              /   \
  1 |             / .-'               /     '--.  .--- Curve C: Parboiled Retrograded RS3 Starch
    |            /.-'                /          \     (alpha = 0.32, beta = 0.25) + Vinegar Preload
  0 +-----------+-------------------+------------+--> [Blunted Plateau: Peak = 128 mg/dL at T+72m]
    0          30                  60           90       120      150      180      210      240
                                  Time Post-Prandial (Minutes)

  Retardation Multiplier:
  k_abs_effective = k_abs0 * (1.0 - 0.45 * alpha_amylose) * (1.0 - 0.60 * beta_RS3) * kappa_visc
```

---

### SHEET 5 / 7
#### FIG. 5: SKELETAL MUSCLE GLUT-4 TRANSLOCATION & STEP-COUNT AMBULATION CONTROL LOOP

```
  +---------------------------------------------------------------------------------------------+
  | Simulated 4-Hour Postprandial Curve G(t) Projected by 7-Compartment Runge-Kutta ODE Engine   |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 v
  +---------------------------------------------------------------------------------------------+
  | Excursion Evaluation vs Patient Threshold: Is G_max > 140 mg/dL?                            |
  | -> Integrated Area Above Threshold: AUC_excess = Integral[ max(0, G(t) - 140) dt ]          |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 v
  +---------------------------------------------------------------------------------------------+
  | Mass Conservation Translation: Surplus Circulating Glucose Mass                             |
  | m_excess = (AUC_excess * V_G * BW) / (1000 * tau_clearance)  [Grams of Glucose]              |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 v
  +---------------------------------------------------------------------------------------------+
  | Mechanical Energy & GLUT-4 Translocation Equivalent:                                        |
  | WalkMinutes = round( (m_excess / 0.38 g/min) * 1.35 safety_factor )                         |
  | TargetSteps = WalkMinutes * 110 steps/min cadence                                           |
  | StartWindow = max(20, t_peak - 20 minutes)  [Intercepts ascending inflection dG/dt > 0]     |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 | Encrypted BLE Dispatch to Smartwatch
                                                 v
  +---------------------------------------------------------------------------------------------+
  | WEARABLE REAL-TIME STEP RECONCILIATION LOOP:                                                |
  | Ingest accelerometer step packets: StepsCompleted(t)                                        |
  | Compute remaining mass: m_rem(t) = max(0, m_excess - [StepsCompleted/110 * 0.38 / 1.35])    |
  |                                                                                             |
  | IF StepsCompleted >= TargetSteps:                                                           |
  |   -> Trigger physical resonant haptic pulse (180 Hz)                                        |
  |   -> Transmit "Metabolic Target Fulfilled" to Clinical Ledger                               |
  | ELSE IF Cadence < 95 steps/min:                                                             |
  |   -> Issue tactile cadence acceleration prompt ("Brisk pace required")                      |
  +---------------------------------------------------------------------------------------------+
```

---

### SHEET 6 / 7
#### FIG. 6: 3-PHASE PRE-BITE MUCOSAL BARRIER FOOD SEQUENCING PROTOCOL

```
  INGESTION TIMELINE:
  ===================

  [T = 0 MIN] -------------------> [T = +10 MIN] ------------------> [T = +20 MIN] -----------------> [T = +45 MIN]
        |                                |                                 |                                |
        v                                v                                 v                                v
  +----------------------------+   +----------------------------+   +----------------------------+   +--------------------+
  | PHASE 1: FIBER STARTER     |   | PHASE 2: PROTEINS & LIPIDS |   | PHASE 3: COMPLEX CARBS     |   | POSTPRANDIAL       |
  | (Salad, Saag, Kachumber)   |   | (Paneer, Dal, Chicken, Egg)|   | (Roti, Basmati Rice, Naan) |   | BLUNTED CURVE      |
  +--------------+-------------+   +--------------+-------------+   +--------------+-------------+   +---------+----------+
                 |                                |                                |                           |
                 v                                v                                v                           v
  +----------------------------+   +----------------------------+   +----------------------------+   +--------------------+
  | Mucosal Physical Barrier:  |   | Endocrine Incretin Wave:   |   | Retarded Starch Breakdown: |   | Peak Glycemic      |
  | Viscous polysaccharides    |   | Stimulates intestinal      |   | Substrate enters stomach   |   | Excursion Blunted  |
  | coat duodenal villi,       |   | L-cells to release GLP-1 & |   | already conditioned by     |   | by -38% to -42%    |
  | retarding alpha-amylase    |   | CCK; retards gastric       |   | lipids and fiber mesh;     |   | without exogenous  |
  | enzymatic access by 40%    |   | emptying rate k_empt by 35%|   | sustained steady release   |   | pharmacotherapy    |
  +----------------------------+   +----------------------------+   +----------------------------+   +--------------------+
```

---

### SHEET 7 / 7
#### FIG. 7: CLOSED-LOOP SENSOR TELEMETRY, ACOUSTIC MEAL DETECTION & ABDM FHIR R4 RECONCILIATION

```
                                      [ WEARABLE SENSORS ]
                           PPG (101), ECG (102), 3-Axis IMU (103)
                                                |
                                                v
                              +-----------------------------------+
                              | Is Continuous Accelerometer/      |
                              | Acoustic Signal in 1.2 - 2.5 Hz?  |
                              +-----------------+-----------------+
                                                |
                       NO (Rest/Transit)        | YES (Repetitive Chew-Swallow Cycles > 180s)
                               +----------------+
                               |                |
                               v                v
                     [ Maintain Baseline ]   [ Autonomous Meal-Start Event Confirmed ]
                     [ Telemetry Polling ]      - Snapshot Fasting Glucose & Resting BP
                                                - Ingest ABDM FHIR R4 Calibration Data:
                                                  HbA1c (LOINC 4548-4), eGFR (LOINC 33914-3)
                                                - Query Ingested / Ordered Dish Payload
                                                - Extract Net Carbs, Amylose & Resistant Starch
                                                |
                                                v
                                     +----------------------+
                                     | Run 7-Compartment    |
                                     | Runge-Kutta 4th-Order|
                                     | ODE In-Silico Solver |
                                     +----------+-----------+
                                                |
                                                v
                                     +----------------------+
                                     | Is G_max > 140 mg/dL?|
                                     +----------+-----------+
                                                |
                                YES             | NO
                       +------------------------+------------------------+
                       |                                                 |
                       v                                                 v
      +---------------------------------+              +-----------------------------------+
      | Compute Surplus Glucose Mass:   |              | Euglycemic Safe Trajectory        |
      | m_excess = AUC_excess * V_G * BW|              | Log order as SAFE_STABLE          |
      | Compute Ambulation Step Target: |              | Continuous Telemetry Surveillance |
      | Steps = round(m_excess/0.38)*110|              +-----------------------------------+
      | Schedule Window: T_peak - 20min |
      +----------------+----------------+
                       |
                       v
      +---------------------------------+
      | Live Smartwatch Step Ingestion  |
      | Decrement Remaining Glucose Mass|
      | Check Pace >= 110 steps/minute  |
      +----------------+----------------+
                       |
                       v
      +---------------------------------+
      | Are Prescribed Steps Satisfied? |
      +----------------+----------------+
                       |
              YES      | NO (Deficit)
       +---------------+---------------+
       |                               |
       v                               v
[ Trigger Confirmation Haptic ] [ Transmit Ambulation Deficit ]
[ Log 100% Compliance to KDS  ] [ Alert to Attending Physician]
```

---
*(Dated this 9th day of November, 2026)*

**For BioSync AI Systems India Private Limited**
*(Patent Agent for the Applicant)*

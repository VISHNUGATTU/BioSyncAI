# FORM 2 - PATENT DRAWINGS
THE PATENTS ACT, 1970
(39 of 1970)
&
THE PATENTS RULES, 2003

## PATENT APPLICATION 2: FORMAL DRAWINGS (RULE 15 COMPLIANT)
**APPLICANT:** BioSync AI Systems India Private Limited
**TITLE:** A CYBER-PHYSICAL BIO-NUTRITIONAL DISPENSING WORKSTATION AND AYUR-ALLOPATHIC PHARMACOVIGILANCE APPARATUS FOR CLOSED-LOOP CULINARY ALLOCATION

**TOTAL SHEETS:** 7
**SHEET NUMBERS:** SHEET 1 TO SHEET 7

---

### SHEET 1 / 7
#### FIG. 1: CYBER-PHYSICAL SMART CULINARY WORKSTATION HARDWARE ARCHITECTURE & INTERCONNECT

```
+---------------------------------------------------------------------------------------------------+
|                        CYBER-PHYSICAL SMART CULINARY DISPENSING WORKSTATION (100)                 |
|                                                                                                   |
|  +---------------------------+   +---------------------------+   +-----------------------------+  |
|  | Multi-Plate Digital       |   | In-Situ Optical Dual-     |   | Multi-Directional Acoustic  |  |
|  | Gravimetric Load-Cells    |   | Wavelength NIR Sensor     |   | Speech Transducer Array     |  |
|  | LC1, LC2, LC3, LC4 (101)  |   | 450nm & 600nm (102)       |   | Vernacular Audio (103)      |  |
|  +-------------+-------------+   +-------------+-------------+   +--------------+--------------+  |
|                |                               |                                |                 |
|                | Real-Time Tare / Gram Data    | Optical Absorbance Data        | Spoken Speech   |
|                v                               v                                v                 |
|  +---------------------------------------------------------------------------------------------+  |
|  |                            WORKSTATION EMBEDDED CONTROLLER (200)                            |  |
|  |                                                                                             |  |
|  |  [Gravimetric Mass Verifier]   [Photometric TPC Engine]     [Vernacular Phonetic Parser]    |  |
|  |  Sum(m_i) == M_total +- eps    TPC = 12.5*A450 - 4.2*A600   Hindi, Telugu, Tamil, Marathi   |  |
|  |                                OQI = 100 - (TPC/25)*65      Katori, Chammach, Roti, Handi   |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|                                                 | Interlock Trigger / Thermal Print Command       |
|                                                 v                                                 |
|  +----------------------------------------------+----------------------------------------------+  |
|  |                             PHYSICAL ACTUATOR INTERLOCK STAGE                               |  |
|  |                                                                                             |  |
|  |  +---------------------------------------+   +-------------------------------------------+  |  |
|  |  | Physical Dispensing Solenoid Interlock |   | ESC/POS High-Density Thermal Receipt      |  |  |
|  |  | (104) Mechanically inhibits gate if    |   | Encoder (105) Prints 64-char SHA-256      |  |  |
|  |  | TPC >= 25% or Ayur collision detected |   | Custody Hash & 2D Matrix Barcode          |  |  |
|  |  +---------------------------------------+   +-------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  | ABDM FHIR R4 Care-Context Sealing (M2/M3)
                                                  v
+---------------------------------------------------------------------------------------------------+
|                           AYUSHMAN BHARAT DIGITAL MISSION (ABDM) GATEWAY                          |
|         Verified 14-Digit ABHA Health Locker | Encrypted Diagnostic Report & Meal Plan            |
+---------------------------------------------------------------------------------------------------+
```

---

### SHEET 2 / 7
#### FIG. 2: 15-BOTANICAL AYURVEDIC-ALLOPATHIC PHARMACOVIGILANCE SENTINEL & ACTUATOR LOCKOUT

```
                                  [ INGEST ORDER / RECIPE PAYLOAD ]
                                                  |
                                                  v
                               +------------------------------------+
                               | Query Patient Active Medications   |
                               | & Screen 15 Traditional Botanicals |
                               +------------------+-----------------+
                                                  |
                                                  v
     +--------------------------------------------+--------------------------------------------+
     |                                            |                                            |
     v Karela / Charantin                         v Mulethi / Glycyrrhizin                     v Ashwagandha / Withanolides
+----+-----------------------+               +----+-----------------------+               +----+-----------------------+
| Matched with Allopathic    |               | Matched with Allopathic    |               | Matched with Allopathic    |
| Sulfonylureas (Glimepiride)|               | Antihypertensives          |               | Thyroid Hormone            |
| or Exogenous Insulin?      |               | (Telmisartan, Amlodipine)? |               | (Levothyroxine, Thyronorm)?|
+----+-----------------------+               +----+-----------------------+               +----+-----------------------+
     |                                            |                                            |
     | YES (Lethal Hypoglycemia)                  | YES (11b-HSD2 Hypertensive)                | YES (Thyrotoxicosis / Arrhy)
     v                                            v                                            v
+----+-----------------------------------------------------------------------------------------+----+
|                                    CRITICAL_LOCKOUT TRIGGERED                                     |
|  1. ACTUATE PHYSICAL DISPENSING SOLENOID INTERLOCK (104) -> Mechanically Inhibit Dispensing Gate  |
|  2. FREEZE THERMAL RECEIPT PRINTER (105) -> Inhibit Printing of Order Packaging Ticket            |
|  3. EMIT ACOUSTIC WARNING DIRECTIVE (103) -> "Warning: Lethal botanical-drug collision detected"  |
|  4. LOG RECORD TO AUDIT TRAIL -> Prevented Fatal Medication Collision Recorded                    |
+---------------------------------------------------------------------------------------------------+
```

---

### SHEET 3 / 7
#### FIG. 3: SINGLE-POT MULTI-PHENOTYPE JOINT FAMILY DISAGGREGATION & DIGITAL LOAD-CELL BALANCE

```
                                [ COMMON BULK SINGLE-POT DISH ]
                        e.g., 1kg Handi Dum Biryani / 600g Dal Makhani (M_total)
                                                |
                                                v
                        +-----------------------------------------------+
                        | Multi-Phenotype Mathematical Allocation Model |
                        | Enforce Conservation of Mass: Sum(m_i) = M_tot|
                        +-----------------------+-----------------------+
                                                |
          +--------------------+----------------+--------------------+--------------------+
          |                    |                                     |                    |
          v                    v                                     v                    v
  +---------------+    +---------------+                     +---------------+    +---------------+
  | DADAJI (T2D)  |    | PAPAJI (HTN)  |                     | AMAN (ATHLETE)|    | MUMMYJI (NORM)|
  | Age: 78, CKD3 |    | Age: 52       |                     | Age: 24       |    | Age: 48       |
  | Top-Layer RS3 |    | Low-Sodium    |                     | Lean High-Prot|    | Balanced      |
  | Target: 250g  |    | Target: 300g  |                     | Target: 400g  |    | Target: 250g  |
  +-------+-------+    +-------+-------+                     +-------+-------+    +-------+-------+
          |                    |                                     |                    |
          v                    v                                     v                    v
  +---------------+    +---------------+                     +---------------+    +---------------+
  | LOAD CELL LC1 |    | LOAD CELL LC2 |                     | LOAD CELL LC3 |    | LOAD CELL LC4 |
  | Digital Scale |    | Digital Scale |                     | Digital Scale |    | Digital Scale |
  | Measured: 249g|    | Measured: 301g|                     | Measured: 400g|    | Measured: 250g|
  +-------+-------+    +-------+-------+                     +-------+-------+    +-------+-------+
          |                    |                                     |                    |
          +--------------------+----------------+--------------------+--------------------+
                                                |
                                                v Real-Time Gravimetric Telemetry
                        +-----------------------------------------------+
                        | GRAVIMETRIC MASS CONSERVATION VERIFICATION    |
                        | Total Plated = 249 + 301 + 400 + 250 = 1000g  |
                        | Differential = |1000g - 1000g| = 0.0g <= eps  |
                        | STATUS: GRAVIMETRICALLY_VERIFIED              |
                        | ARM PACKAGING ACTUATOR & AUTHORIZE PRINT HEAD |
                        +-----------------------------------------------+
```

---

### SHEET 4 / 7
#### FIG. 4: KITCHEN DISPLAY SYSTEM (KDS), VERNACULAR ACOUSTIC COACH & 3-PHASE PACKAGING

```
+---------------------------------------------------------------------------------------------------+
| KDS CULINARY DISPATCH CONSOLE                                                  STATION ID: HYD-04 |
| Order #BIO-GRD-882194 | Mode: VITALS_GUARD | Status: PREPARING | Table/Plating: 4 Plates Active   |
+---------------------------------------------------------------------------------------------------+
|  CHEF DIRECTIVES & ACOUSTIC DIRECTIVES:                                                           |
|  * Hindi Voice: "Dadaji ke liye upar se 250g chawal nikaliye; Papaji ke liye bina namak dal"      |
|  * Telugu Voice: "Dadaji kosam paina unna 250g ragi mudde mariyu aaku kura veyandi"               |
|                                                                                                   |
|  MANDATORY 3-PHASE COLOR-CODED PACKAGING BOX STICKERS:                                            |
|                                                                                                   |
|  +----------------------------+  +----------------------------+  +----------------------------+   |
|  | BOX 1: FIBER STARTER       |  | BOX 2: PROTEIN & LIPIDS    |  | BOX 3: COMPLEX CARBS       |   |
|  | [GREEN ADHESIVE STICKER]   |  | [ORANGE ADHESIVE STICKER]  |  | [PURPLE ADHESIVE STICKER]  |   |
|  | Raw Salad, Saag, Cucumbers |  | Dal Tadka, Paneer, Chicken |  | Parboiled Biryani / Roti   |   |
|  | Instructions: Eat 1st (T=0)|  | Instructions: Eat 2nd(T=10)|  | Instructions: Eat 3rd(T=20)|   |
|  +----------------------------+  +----------------------------+  +----------------------------+   |
+---------------------------------------------------------------------------------------------------+
```

---

### SHEET 5 / 7
#### FIG. 5: IN-SITU OPTICAL NIR SPECTROPHOTOMETER OIL QUALITY AUDITING & SOLENOID LOCKOUT

```
  +-------------------------------------------------------------------------------------------------+
  | Commercial Deep-Frying Cooking Medium Reservoir (A2 Mustard / Desi Ghee / Refined Oil Blend)    |
  +------------------------------------------------+------------------------------------------------+
                                                   |
                                                   v Optical Submersion Probe (102)
  +-------------------------------------------------------------------------------------------------+
  | DUAL-WAVELENGTH OPTICAL EMITTERS & PHOTODETECTOR RECEIVER:                                      |
  | Dual Peak Sampling: Blue-Violet Absorbance (450nm) & Reference Orange-Red Absorbance (600nm)    |
  +------------------------------------------------+------------------------------------------------+
                                                   |
                                                   v Photometric Absorbance Millivolt Streams
  +-------------------------------------------------------------------------------------------------+
  | TOTAL POLAR COMPOUNDS (TPC) & SMOKE POINT DERIVATION:                                           |
  | TPC (%) = 12.5 * A450 - 4.2 * A600 + 0.02 * max(0, T_oil - 160.0)                              |
  | SmokePoint (C) = BaselineSmoke - 1.95 * TPC                                                     |
  | OilQualityIndex (OQI) = max(5, min(100, 100 - [TPC / 25.0 * 65.0]))                             |
  +------------------------------------------------+------------------------------------------------+
                                                   |
                         +-------------------------+-------------------------+
                         |                                                   |
                         v TPC < 25.0% (FSSAI Compliant)                     v TPC >= 25.0% (Toxic Polar Degradation)
  +-----------------------------------------------+   +---------------------------------------------+
  | FSSAI 5-STAR CERTIFIED KITCHEN                |   | CONDEMNED HAZARDOUS OIL DETECTED            |
  | Status: OPTIMAL_VIRGIN / MODERATE_CYCLE       |   | ACTUATE PHYSICAL DISPENSING SOLENOID (104)  |
  | Solenoid Interlock: DISENGAGED (SAFE)         |   | -> Mechanically Locks Frying Dispenser Gate |
  | Print Ticket with Certified OQI Score Stamp   |   | -> Inhibit Ticket Dispatch & Alert Manager  |
  +-----------------------------------------------+   +---------------------------------------------+
```

---

### SHEET 6 / 7
#### FIG. 6: CRYPTOGRAPHIC SHA-256 CUSTODY HASH PIPELINE & ESC/POS THERMAL BARCODE PRINTING

```
  +---------------------------------------------------------------------------------------------+
  | KITCHEN CUSTODY DISPATCH PAYLOAD:                                                           |
  | S = (OrderID || StationID || OrderMode || PlateAllocationGrams || TPC_Score || Timestamp)   |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 v
  +---------------------------------------------------------------------------------------------+
  | SHA-256 CRYPTOGRAPHIC HASHING ENGINE:                                                       |
  | H = SHA-256(S) -> 64-Character Immutable Hexadecimal Digest:                                 |
  | e.g. "7217f80991423c77e5621415951a89c566580f4886e002daef736dcba7234a12"                     |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 v ESC/POS Binary Print Command Stream
  +---------------------------------------------------------------------------------------------+
  | PHYSICAL THERMAL ESC/POS ADHESIVE SLIP (80mm Width)                                         |
  |                                                                                             |
  |   +-------------------------------------------------------------------------------------+   |
  |   | BIOSYNC AI CERTIFIED CULINARY DISPATCH                                              |   |
  |   | Order: BIO-GRD-882194 | Mode: VITALS_GUARD | Station: HYD-04                            |   |
  |   | Single-Pot Plating: Dadaji (250g), Papaji (300g), Aman (400g), Mummyji (250g)       |   |
  |   | Gravimetric Status: VERIFIED (+-0.0g) | OQI Oil Score: 94/100 (Virgin Ghee)         |   |
  |   |                                                                                     |   |
  |   | [ HIGH-DENSITY 2D MATRIX BARCODE ]                                                  |   |
  |   | Imprinted QR Code encoding canonical SHA-256 hash                                    |   |
  |   | Scannable by delivery courier and patient to verify tamper-evident chain of custody |   |
  |   +-------------------------------------------------------------------------------------+   |
  +---------------------------------------------------------------------------------------------+
```

---

### SHEET 7 / 7
#### FIG. 7: CLINICAL NUTRITION SURVEILLANCE & ABDM CARE-CONTEXT NATIONAL LOCKER INTEGRATION

```
  +---------------------------------------------------------------------------------------------+
  | CLINICAL NUTRITION SURVEILLANCE DASHBOARD (Doctor / Hospital Portal)                        |
  | Population Metrics: Total Meals, Vitals Guard Adoption Rate, Cohort Mean Peak Glucose,      |
  | GLUT-4 Ambulation Compliance Rate, Adverse Botanical-Drug Lockouts Prevented               |
  +----------------------------------------------+----------------------------------------------+
                                                 |
                                                 v Authenticated ABDM Care-Context Sealing
  +---------------------------------------------------------------------------------------------+
  | AYUSHMAN BHARAT DIGITAL MISSION (ABDM) NATIONAL HEALTH GATEWAY                              |
  |                                                                                             |
  |  +---------------------------+   +---------------------------+   +-----------------------+  |
  |  | MILESTONE 1 (M1):         |   | MILESTONE 2 (M2):         |   | MILESTONE 3 (M3):     |  |
  |  | 14-Digit ABHA ID Linking  |   | Encrypted FHIR R4 Bundle  |   | HIU Electronic Health |  |
  |  | Demographic Verification  |   | Care-Context Transfer     |   | Record Ingestion &    |  |
  |  | via Aadhaar / Mobile OTP  |   | LOINC Observation Sealing |   | Twin Recalibration    |  |
  |  +---------------------------+   +---------------------------+   +-----------------------+  |
  +---------------------------------------------------------------------------------------------+
```

---
*(Dated this 9th day of November, 2026)*

**For BioSync AI Systems India Private Limited**
*(Patent Agent for the Applicant)*

# BioSyncAI Staff Mobile Application (Expo Go)

An enterprise-grade mobile application for **BioSyncAI Field Phlebotomists and Specimen Specialists**, engineered with **Expo SDK 57**, **React Native 0.86**, **React 19**, and **Zustand**.

---

## 🌟 Key Features

1. **State Machine Phlebotomy Workflow (Zero Placeholders)**:
   - `Assistant_Assigned` $\rightarrow$ `On_The_Way` $\rightarrow$ `Arrived` $\rightarrow$ `Collecting` $\rightarrow$ `Sample_Collected` $\rightarrow$ `At_Laboratory` $\rightarrow$ `Processing` $\rightarrow$ `Report_Generated`
2. **Patient OTP Verification**:
   - 6-digit cryptographic collection OTP verification with patient before blood draw.
3. **Specimen Collection & Barcode Tagging**:
   - Barcode generator and scanner support.
   - Specimen vial selection (`EDTA Whole Blood`, `Serum Separator Tube`, `Fluoride Tube`, `Urine Sterile Cup`).
   - Physical evidence photo capture (`expo-image-picker`).
   - Fasting verification checkbox and collection notes.
4. **Laboratory Handover & Drop-off**:
   - In-transit specimen inventory tracking.
   - Bulk drop-off and lab technician handover logging (`PUT /api/lab-assistant/samples/dropoff`).
   - Structured biomarker entry modal (`Fasting Blood Glucose`, `HbA1c %`).
5. **Real-Time GPS Location Broadcasting**:
   - Background/foreground GPS telemetry streaming to Admin Dispatch (`expo-location`).
6. **Live Duty Status Control**:
   - `Available` (Green), `On_Route` (Cyan), `Off_Duty` (Red) toggle syncing with the backend in real-time.
7. **Earnings & Real-Time Payouts**:
   - Total payout realization, ₹100 per pickup incentive ledger, and daily shift statistics.

---

## 🚀 Quick Start Guide

### 1. Ensure the Backend Server is Running
The Express backend should be running on port `6446`:
```bash
cd server
npm run server
```

### 2. Start the Expo Dev Server
Navigate to `staff-panel`:
```bash
cd staff-panel
npx expo start -c
```
*(or run `npm start`)*

### 3. Open in Expo Go
- Install **Expo Go** from the Google Play Store (Android) or Apple App Store (iOS).
- Scan the displayed QR code with your camera or the Expo Go app.
- Make sure your mobile phone is connected to the same Wi-Fi network as your development machine (`192.168.137.129`).

---

## 🔑 Login Credentials

Use the pre-configured field operative account or tap **"Demo Credentials"** directly on the login screen:
- **Phone**: `9876543210`
- **Password**: `password123`
- **Employee ID**: `EMP001` (Demo Assistant, Madhapur Zone)

---

## 🌐 Dynamic API Gateway Configuration

If your machine's local Wi-Fi IP address changes:
1. Tap the **Server Gateway** icon on the Login screen or navigate to **Staff ID -> API Host Gateway**.
2. Enter your current IP address (e.g. `http://192.168.x.x:6446/api`).
3. Tap **Test Ping** to verify connectivity, then tap **Save & Apply**.

---

## 📁 Architecture Overview

```
staff-panel/
├── App.js                         # Root navigation & theme provider
├── app.json                       # Expo configuration & permissions
├── package.json                   # Expo 57, RN 0.86, Lucide, Zustand
└── src/
    ├── api/
    │   ├── axios.js               # Auto-bearer injection & IP host resolver
    │   └── staffApi.js            # 16 connected lab assistant API routes
    ├── components/
    │   ├── AppointmentCard.js     # Home visit card with 1-tap call & maps
    │   ├── DutyStatusSwitch.js    # Online / On Route / Off Duty modal
    │   ├── GlassCard.js           # Premium frosted glass UI container
    │   ├── MetricCard.js          # Shift KPI metrics
    │   ├── OTPModal.js            # Patient 6-digit collection OTP verification
    │   └── StatusBadge.js         # Colorful lifecycle badge
    ├── navigation/
    │   ├── AppNavigator.js        # Root stack with auth state router
    │   └── TabNavigator.js        # Bottom navigation with real-time badges
    ├── screens/
    │   ├── ActiveCollectionScreen.js # Barcodes, vial checklist & photo upload
    │   ├── AppointmentDetailScreen.js # State machine trip actions & map route
    │   ├── AppointmentsScreen.js  # Filterable roster with pull-to-refresh
    │   ├── DashboardScreen.js     # Live shift metrics & next visit spotlight
    │   ├── EarningsScreen.js      # Incentive ledger & realized payouts
    │   ├── LoginScreen.js         # Phone/password auth with 1-tap demo
    │   ├── ProfileScreen.js       # Staff ID badge, GPS toggle & server config
    │   └── SamplesScreen.js       # Specimen tracking & bulk lab drop-off
    ├── store/
    │   ├── appointmentStore.js    # Zustand store for visits, samples & stats
    │   └── authStore.js           # Zustand store for auth token & duty status
    └── theme/
        └── colors.js              # Medical dark navy, cyan & emerald tokens
```

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import Admin from './models/Admin.js';
import LabAssistant from './models/LabAssistant.js';
import User from './models/User.js';
import TestCatalog from './models/TestCatalog.js';
import Appointment from './models/Appointment.js';
import Sample from './models/Sample.js';
import Transaction from './models/Transaction.js';
import Vitals from './models/Vitals.js';
import Notification from './models/Notification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/biosync';

async function seedCompleteDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully.');

    // 1. CLEAR EXISTING DATA
    console.log('🧹 Purging old collections to ensure clean test state...');
    await Promise.all([
      Admin.deleteMany({}),
      LabAssistant.deleteMany({}),
      User.deleteMany({}),
      TestCatalog.deleteMany({}),
      Appointment.deleteMany({}),
      Sample.deleteMany({}),
      Transaction.deleteMany({}),
      Vitals.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('✅ Database purged clean.');

    // 2. SEED ADMIN
    console.log('👤 Seeding System Admin...');
    const adminSalt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash('Admin123', adminSalt);
    const admin = await Admin.create({
      name: 'System SuperAdmin',
      email: 'admin@biosyncai.com',
      password: adminHashedPassword,
      role: 'SuperAdmin',
      lastLogin: new Date(),
    });
    console.log('✅ Admin created: admin@biosyncai.com / Admin123');

    // 3. SEED LAB ASSISTANT
    console.log('🩺 Seeding Lab Assistant...');
    const staffSalt = await bcrypt.genSalt(10);
    const staffHashedPassword = await bcrypt.hash('password123', staffSalt);
    const labAssistant = await LabAssistant.create({
      name: 'Demo Assistant',
      phone: '9876543210',
      password: staffHashedPassword,
      employeeId: 'EMP001',
      gender: 'Male',
      bloodGroup: 'O+',
      backgroundVerified: true,
      drivingLicense: 'DL-092023-88392',
      vehicleType: 'Two-Wheeler',
      vehicleNumber: 'TS-09-EA-4921',
      assignedZones: ['Madhapur', 'Hitec City', 'Gachibowli', 'Kondapur'],
      status: 'Available',
      shiftTiming: { start: '08:00 AM', end: '05:00 PM' },
      currentLocation: {
        lat: 17.4483,
        lng: 78.3915,
        heading: 90,
        lastUpdated: new Date(),
      },
      inventory: {
        bloodCollectionTubes: 35,
        urineContainers: 15,
        icePacks: 6,
      },
      performance: {
        totalCollectionsCompleted: 34,
        cancelledAppointments: 1,
        averageRating: 4.9,
      },
    });
    console.log('✅ Lab Assistant created: 9876543210 / password123 (EMP001)');

    // 4. SEED TEST CATALOGS
    console.log('🧪 Seeding Medical Diagnostic Test Catalogs...');
    const tests = await TestCatalog.insertMany([
      {
        testName: 'Complete Blood Count (CBC)',
        testCode: 'CBC01',
        category: 'Hematology',
        pricing: { basePrice: 450, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation needed. Maintain normal hydration.',
        fastingRequired: false,
        referenceRanges: [
          { biomarker: 'Hemoglobin', unit: 'g/dL', minNormal: 13.5, maxNormal: 17.5, genderSpecific: 'Male' },
          { biomarker: 'Hemoglobin', unit: 'g/dL', minNormal: 12.0, maxNormal: 15.5, genderSpecific: 'Female' },
          { biomarker: 'WBC Count', unit: '/mcL', minNormal: 4500, maxNormal: 11000, genderSpecific: 'All' },
          { biomarker: 'Platelet Count', unit: '/mcL', minNormal: 150000, maxNormal: 450000, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Fasting Blood Glucose',
        testCode: 'FBG02',
        category: 'Biochemistry',
        pricing: { basePrice: 250, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Requires strict 8-10 hours overnight fasting. Water permitted.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'Fasting Plasma Glucose', unit: 'mg/dL', minNormal: 70, maxNormal: 99, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Lipid Profile Panel',
        testCode: 'LIP03',
        category: 'Cardiology',
        pricing: { basePrice: 850, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: '10-12 hours fasting required. Avoid alcohol 24 hours prior.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'Total Cholesterol', unit: 'mg/dL', minNormal: 125, maxNormal: 200, genderSpecific: 'All' },
          { biomarker: 'Triglycerides', unit: 'mg/dL', minNormal: 50, maxNormal: 150, genderSpecific: 'All' },
          { biomarker: 'HDL Cholesterol', unit: 'mg/dL', minNormal: 40, maxNormal: 60, genderSpecific: 'All' },
          { biomarker: 'LDL Cholesterol', unit: 'mg/dL', minNormal: 50, maxNormal: 100, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'HbA1c Glycated Hemoglobin',
        testCode: 'HBA04',
        category: 'Diabetes',
        pricing: { basePrice: 600, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Non-fasting sample. Measures average glucose over past 3 months.',
        fastingRequired: false,
        referenceRanges: [
          { biomarker: 'HbA1c', unit: '%', minNormal: 4.0, maxNormal: 5.6, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Thyroid Profile (T3, T4, TSH)',
        testCode: 'THY05',
        category: 'Endocrinology',
        pricing: { basePrice: 750, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Morning collection recommended prior to daily medications.',
        fastingRequired: false,
        referenceRanges: [
          { biomarker: 'TSH', unit: 'uIU/mL', minNormal: 0.4, maxNormal: 4.0, genderSpecific: 'All' },
          { biomarker: 'Free T3', unit: 'pg/mL', minNormal: 2.0, maxNormal: 4.4, genderSpecific: 'All' },
          { biomarker: 'Free T4', unit: 'ng/dL', minNormal: 0.8, maxNormal: 1.8, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Liver Function Test (LFT)',
        testCode: 'LFT06',
        category: 'Hepatology',
        pricing: { basePrice: 900, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Overnight fasting recommended for accurate serum enzyme analysis.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'SGOT / AST', unit: 'U/L', minNormal: 10, maxNormal: 40, genderSpecific: 'All' },
          { biomarker: 'SGPT / ALT', unit: 'U/L', minNormal: 7, maxNormal: 56, genderSpecific: 'All' },
          { biomarker: 'Total Bilirubin', unit: 'mg/dL', minNormal: 0.2, maxNormal: 1.2, genderSpecific: 'All' },
        ],
        isActive: true,
      },
    ]);
    console.log(`✅ Seeded ${tests.length} diagnostic test catalogs.`);

    const cbcTest = tests[0];
    const fbgTest = tests[1];
    const lipTest = tests[2];
    const hbaTest = tests[3];

    // 5. SEED USERS / PATIENTS
    console.log('👥 Seeding Patient Users...');
    const users = await User.insertMany([
      {
        phoneNumber: '9123456780',
        firstName: 'Rahul',
        lastName: 'Sharma',
        dateOfBirth: new Date('1988-06-15'),
        gender: 'Male',
        bloodGroup: 'B+',
        address: {
          houseNumber: 'Flat 402, Sunshine Heights',
          street: 'Rd Number 36, Jubilee Hills',
          landmark: 'Near Metro Station Pillar 140',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500033',
          coordinates: { lat: 17.4319, lng: 78.4073 },
        },
        lifestyle: {
          dietPreference: 'Non-Veg',
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'Occasional',
          activityLevel: 'Active',
        },
        vitalsStatus: 'Lab_Verified',
        accountStatus: 'Active',
      },
      {
        phoneNumber: '9876501234',
        firstName: 'Priya',
        lastName: 'Patel',
        dateOfBirth: new Date('1994-11-20'),
        gender: 'Female',
        bloodGroup: 'A+',
        address: {
          houseNumber: 'Villa 12, Green Meadows',
          street: 'Madhapur Main Road',
          landmark: 'Opposite Cyber Towers',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          coordinates: { lat: 17.4483, lng: 78.3807 },
        },
        lifestyle: {
          dietPreference: 'Veg',
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'None',
          activityLevel: 'Lightly Active',
        },
        vitalsStatus: 'Lab_Verified',
        accountStatus: 'Active',
      },
      {
        phoneNumber: '9001122334',
        firstName: 'Ananya',
        lastName: 'Reddy',
        dateOfBirth: new Date('1992-04-10'),
        gender: 'Female',
        bloodGroup: 'O-',
        address: {
          houseNumber: 'Plot 58, Silicon Valley',
          street: 'Gachibowli Financial District',
          landmark: 'Near Wipro Circle',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500032',
          coordinates: { lat: 17.4401, lng: 78.3489 },
        },
        lifestyle: {
          dietPreference: 'Vegan',
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'None',
          activityLevel: 'Very Active',
        },
        vitalsStatus: 'Pending',
        accountStatus: 'Active',
      },
      {
        phoneNumber: '9988776655',
        firstName: 'Vikram',
        lastName: 'Malhotra',
        dateOfBirth: new Date('1979-09-02'),
        gender: 'Male',
        bloodGroup: 'AB+',
        address: {
          houseNumber: 'Apt 7B, Cyber Palms',
          street: 'Botanical Garden Road',
          landmark: 'Near Sarath City Capital Mall',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500084',
          coordinates: { lat: 17.4682, lng: 78.3615 },
        },
        lifestyle: {
          dietPreference: 'Non-Veg',
          smokingHabit: 'Occasional',
          alcoholConsumption: 'Occasional',
          activityLevel: 'Sedentary',
        },
        vitalsStatus: 'Lab_Verified',
        accountStatus: 'Active',
      },
    ]);
    console.log(`✅ Seeded ${users.length} patient accounts.`);

    const user1 = users[0];
    const user2 = users[1];
    const user3 = users[2];
    const user4 = users[3];

    // 6. SEED APPOINTMENTS
    console.log('📅 Seeding Operational Appointments...');
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const appt1 = await Appointment.create({
      user: user1._id,
      labAssistant: labAssistant._id,
      testCatalog: cbcTest._id,
      appointmentType: 'Lab_Collection',
      scheduledDate: today,
      timeSlot: '09:00 AM - 10:00 AM',
      status: 'Assistant_Assigned', // Triggers Spotlight / Next Action in Staff Panel
      preparationInstructions: cbcTest.preparationInstructions,
      address: user1.address,
      collectionOTP: '482910',
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(Date.now() - 3600000), notes: 'Booked by patient online' },
        { status: 'Assistant_Assigned', timestamp: new Date(Date.now() - 1800000), notes: 'Assigned to Demo Assistant' },
      ],
    });

    const appt2 = await Appointment.create({
      user: user2._id,
      labAssistant: labAssistant._id,
      testCatalog: fbgTest._id,
      appointmentType: 'Lab_Collection',
      scheduledDate: today,
      timeSlot: '10:30 AM - 11:30 AM',
      status: 'On_The_Way',
      preparationInstructions: fbgTest.preparationInstructions,
      address: user2.address,
      collectionOTP: '739104',
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(Date.now() - 7200000) },
        { status: 'Assistant_Assigned', timestamp: new Date(Date.now() - 3600000) },
        { status: 'On_The_Way', timestamp: new Date(Date.now() - 600000), notes: 'Phlebotomist dispatched' },
      ],
    });

    const appt3 = await Appointment.create({
      user: user3._id,
      labAssistant: labAssistant._id,
      testCatalog: lipTest._id,
      appointmentType: 'Lab_Collection',
      scheduledDate: today,
      timeSlot: '08:00 AM - 09:00 AM',
      status: 'Sample_Collected',
      preparationInstructions: lipTest.preparationInstructions,
      address: user3.address,
      collectionOTP: '112233',
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(Date.now() - 14400000) },
        { status: 'Sample_Collected', timestamp: new Date(Date.now() - 3600000), notes: 'Sample drawn safely' },
      ],
    });

    const appt4 = await Appointment.create({
      user: user4._id,
      labAssistant: labAssistant._id,
      testCatalog: hbaTest._id,
      appointmentType: 'Lab_Collection',
      scheduledDate: yesterday,
      timeSlot: '04:00 PM - 05:00 PM',
      status: 'Completed',
      preparationInstructions: hbaTest.preparationInstructions,
      address: user4.address,
      collectionOTP: '998811',
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(Date.now() - 86400000) },
        { status: 'Sample_Collected', timestamp: new Date(Date.now() - 82800000) },
        { status: 'At_Laboratory', timestamp: new Date(Date.now() - 79200000) },
        { status: 'Completed', timestamp: new Date(Date.now() - 72000000) },
      ],
    });
    console.log('✅ Seeded 4 Appointments spanning active lifecycle stages.');

    // 7. SEED SAMPLES
    console.log('🧪 Seeding Specimen Samples...');
    // Sample 1: In Transit with Phlebotomist (from Appt 3)
    const sample1 = await Sample.create({
      user: user3._id,
      appointment: appt3._id,
      testCatalog: lipTest._id,
      labAssistant: labAssistant._id,
      barcode: 'BS-LIP-73918',
      status: 'Sample_Collected', // Shows in Staff Panel Transit list
      collectionTime: new Date(Date.now() - 3600000),
    });

    // Sample 2: Dropped off at Laboratory, in Queue for assay
    const sample2 = await Sample.create({
      user: user4._id,
      appointment: appt4._id,
      testCatalog: hbaTest._id,
      labAssistant: labAssistant._id,
      barcode: 'BS-HBA-49201',
      status: 'At_Laboratory', // Shows in Lab Queue
      collectionTime: new Date(Date.now() - 7200000),
    });

    // Sample 3: Actively processing in Lab
    const sample3 = await Sample.create({
      user: user1._id,
      appointment: appt1._id,
      testCatalog: cbcTest._id,
      labAssistant: labAssistant._id,
      barcode: 'BS-CBC-83921',
      status: 'Processing',
      collectionTime: new Date(Date.now() - 5400000),
      labProcessingStartTime: new Date(Date.now() - 1800000),
    });
    console.log('✅ Seeded 3 Specimen Samples (In Transit, Lab Queue, Processing).');

    // 8. SEED TRANSACTIONS
    console.log('💳 Seeding Transactions...');
    await Transaction.insertMany([
      {
        appointment: appt1._id,
        user: user1._id,
        amount: 472.5,
        type: 'Cash_On_Collection',
        status: 'Pending',
      },
      {
        appointment: appt2._id,
        user: user2._id,
        amount: 262.5,
        type: 'UPI_Prepaid',
        status: 'Success',
      },
      {
        appointment: appt3._id,
        user: user3._id,
        amount: 892.5,
        type: 'Cash_On_Collection',
        status: 'Success',
      },
      {
        appointment: appt4._id,
        user: user4._id,
        amount: 630.0,
        type: 'Credit_Card_Prepaid',
        status: 'Success',
      },
    ]);
    console.log('✅ Seeded Transactions with Cash on Collection and Online payments.');

    // 9. SEED BASELINE VITALS
    console.log('📊 Seeding Clinical Vitals...');
    await Vitals.insertMany([
      {
        user: user1._id,
        source: 'Lab_Assistant',
        bodyMetrics: {
          heightCm: 178,
          weightKg: 74,
          bmi: 23.4,
          bodyFatPercentage: 17.5,
          muscleMassKg: 58.2,
          boneMassKg: 3.1,
          visceralFatIndex: 4,
          waterPercentage: 58,
        },
        continuousMetrics: {
          restingHeartRate: 71,
          hrv: 54,
          oxygenSaturationSpO2: 98.5,
          dailyStepCount: 8420,
        },
        labBiomarkers: {
          fastingGlucoseMgDl: 92,
          hba1cPercentage: 5.3,
          lipidPanel: {
            totalCholesterolMgDl: 182,
            hdlMgDl: 52,
            ldlMgDl: 98,
            triglyceridesMgDl: 132,
          },
        },
      },
      {
        user: user2._id,
        source: 'Lab_Assistant',
        bodyMetrics: {
          heightCm: 162,
          weightKg: 58,
          bmi: 22.1,
          bodyFatPercentage: 22.0,
          muscleMassKg: 42.0,
          boneMassKg: 2.6,
          visceralFatIndex: 3,
          waterPercentage: 54,
        },
        continuousMetrics: {
          restingHeartRate: 68,
          hrv: 62,
          oxygenSaturationSpO2: 99.0,
          dailyStepCount: 10240,
        },
        labBiomarkers: {
          fastingGlucoseMgDl: 88,
          hba1cPercentage: 5.1,
        },
      },
    ]);
    console.log('✅ Seeded Verified Clinical Vitals.');

    // 10. SEED NOTIFICATIONS
    console.log('🔔 Seeding System Notifications...');
    await Notification.insertMany([
      {
        title: 'New Phlebotomy Task Assigned',
        message: 'You have been assigned home assessment for Rahul Sharma in Jubilee Hills.',
        type: 'Appointments',
        targetAudience: 'LabAssistants',
        targetUserId: labAssistant._id,
        isRead: false,
      },
      {
        title: 'Specimen Handover Successful',
        message: 'Barcode BS-HBA-49201 verified and received at Central Lab Hub.',
        type: 'Reports',
        targetAudience: 'LabAssistants',
        targetUserId: labAssistant._id,
        isRead: true,
      },
      {
        title: 'Daily Logistics Briefing',
        message: 'Monsoon cold-chain protocols active. Ensure dual ice-packs inside thermal courier box.',
        type: 'Announcement',
        targetAudience: 'All',
        isRead: false,
      },
    ]);
    console.log('✅ Seeded System Notifications.');

    console.log('\n=============================================');
    console.log('🎉 COMPREHENSIVE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    console.log('🔑 ADMIN LOGIN CREDENTIALS:');
    console.log('   Email:    admin@biosyncai.com');
    console.log('   Password: Admin123');
    console.log('---------------------------------------------');
    console.log('📱 STAFF / LAB ASSISTANT LOGIN CREDENTIALS:');
    console.log('   Phone:    9876543210');
    console.log('   Password: password123');
    console.log('   Staff ID: EMP001 (Demo Assistant)');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Fatal Error:', error);
    process.exit(1);
  }
}

seedCompleteDatabase();

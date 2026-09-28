import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import Admin from './models/Admin.js';
import Doctor from './models/Doctor.js';
import LabAssistant from './models/LabAssistant.js';
import User from './models/User.js';
import TestCatalog from './models/TestCatalog.js';
import Appointment from './models/Appointment.js';
import Sample from './models/Sample.js';
import Transaction from './models/Transaction.js';
import Vitals from './models/Vitals.js';
import Notification from './models/Notification.js';
import { calculateDistanceKm } from './utils/distanceAssignment.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/biosync';

/**
 * Calculates distance to find the nearest staff member.
 * Shortest distance = assignment.
 */
function pickNearestStaff(targetCoords, staffList) {
  let nearest = null;
  let minDistance = Infinity;

  for (const staff of staffList) {
    const lat = staff.currentLocation?.lat;
    const lng = staff.currentLocation?.lng;
    if (lat != null && lng != null) {
      const dist = calculateDistanceKm(targetCoords.lat, targetCoords.lng, lat, lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = staff;
      }
    }
  }

  return {
    staff: nearest || staffList[0],
    distanceKm: minDistance === Infinity ? 1.2 : minDistance
  };
}

async function seedCompleteTestData() {
  try {
    console.log('\n======================================================');
    console.log('🌱 BIOSYNC AI - COMPLETE DATABASE SEEDER (ZERO NULLS & DISTANCE ROUTED)');
    console.log('======================================================');
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas successfully.');

    // 1. PURGE EXISTING DATA
    console.log('\n🧹 Purging all existing collections for clean testing state...');
    await Promise.all([
      Admin.deleteMany({}),
      Doctor.deleteMany({}),
      LabAssistant.deleteMany({}),
      User.deleteMany({}),
      TestCatalog.deleteMany({}),
      Appointment.deleteMany({}),
      Sample.deleteMany({}),
      Transaction.deleteMany({}),
      Vitals.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('✅ Collections purged.');

    // 2. CREATE SYSTEM ADMIN
    console.log('\n👤 Seeding System Administrator...');
    const adminHashedPassword = await bcrypt.hash('Admin123', 10);
    await Admin.create({
      name: 'System SuperAdmin',
      email: 'admin@biosyncai.com',
      password: adminHashedPassword,
      role: 'SuperAdmin',
      lastLogin: new Date(),
    });
    console.log('✅ Admin: admin@biosyncai.com / Admin123');

    // 3. CREATE DOCTORS / PATHOLOGISTS WITH GEOLOCATION HUBS
    console.log('\n🩺 Seeding Pathologist Doctors (with Real Geolocation Coordinates)...');
    const doctorHashedPassword = await bcrypt.hash('password123', 10);
    
    const doctors = await Doctor.insertMany([
      {
        name: 'Dr. Rajesh Sharma, MD',
        specialty: 'Chief Pathologist & Lab Director',
        email: 'dr.sharma@biosync.ai',
        phone: '9876500001',
        password: doctorHashedPassword,
        role: 'doctor',
        licenseNumber: 'MCI-PATH-88219',
        hospitalAffiliation: 'BioSync Central Reference Laboratory, Hitec City Hub',
        rating: 5.0,
        status: 'Active',
        currentLocation: {
          lat: 17.4480,
          lng: 78.3880,
          address: 'Plot 42, Hitec City Main Rd, Madhapur, Hyderabad',
          zone: 'Hitec City / Madhapur',
          lastUpdated: new Date()
        }
      },
      {
        name: 'Dr. Ananya Iyer, MD',
        specialty: 'Clinical Biochemist & Diagnostic Specialist',
        email: 'dr.ananya@biosync.ai',
        phone: '9876500002',
        password: doctorHashedPassword,
        role: 'doctor',
        licenseNumber: 'MCI-PATH-94102',
        hospitalAffiliation: 'BioSync South Diagnostic Hub, Banjara Hills',
        rating: 4.9,
        status: 'Active',
        currentLocation: {
          lat: 17.4156,
          lng: 78.4350,
          address: 'Road No. 12, Banjara Hills, Hyderabad',
          zone: 'Banjara Hills / Jubilee Hills',
          lastUpdated: new Date()
        }
      },
      {
        name: 'Dr. Vikramaditya Rao, MBBS, FRCPath',
        specialty: 'Senior Hematopathologist',
        email: 'dr.rao@biosync.ai',
        phone: '9876500003',
        password: doctorHashedPassword,
        role: 'doctor',
        licenseNumber: 'MCI-PATH-71822',
        hospitalAffiliation: 'BioSync North Central Hub, Secunderabad',
        rating: 4.95,
        status: 'Active',
        currentLocation: {
          lat: 17.4399,
          lng: 78.4983,
          address: 'Station Road, Secunderabad, Hyderabad',
          zone: 'Secunderabad',
          lastUpdated: new Date()
        }
      }
    ]);
    console.log(`✅ Seeded ${doctors.length} Doctors with geographical locations across Hyderabad.`);
    const primaryDoctor = doctors[0]; // Dr. Rajesh Sharma (9876500001)

    // 4. CREATE LAB ASSISTANTS / PHLEBOTOMISTS WITH REAL-TIME LOCATIONS
    console.log('\n🛵 Seeding Field Lab Assistants with Live Geolocation...');
    const assistantHashedPassword = await bcrypt.hash('password123', 10);
    
    const labAssistants = await LabAssistant.insertMany([
      {
        name: 'Demo Assistant',
        phone: '9876543210',
        password: assistantHashedPassword,
        employeeId: 'EMP001',
        gender: 'Male',
        bloodGroup: 'O+',
        backgroundVerified: true,
        drivingLicense: 'DL-092023-88392',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS-09-EA-4921',
        assignedZones: ['Madhapur', 'Hitec City', 'Kondapur'],
        status: 'Available',
        shiftTiming: { start: '08:00 AM', end: '05:00 PM' },
        currentLocation: {
          lat: 17.4483,
          lng: 78.3915,
          heading: 90,
          lastUpdated: new Date(),
        },
        inventory: {
          bloodCollectionTubes: 40,
          urineContainers: 20,
          icePacks: 8,
        },
        performance: {
          totalCollectionsCompleted: 35,
          cancelledAppointments: 0,
          averageRating: 4.95,
        },
      },
      {
        name: 'Suresh Kumar',
        phone: '9876543211',
        password: assistantHashedPassword,
        employeeId: 'EMP002',
        gender: 'Male',
        bloodGroup: 'B+',
        backgroundVerified: true,
        drivingLicense: 'DL-092022-77182',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS-10-UB-8219',
        assignedZones: ['Banjara Hills', 'Jubilee Hills', 'Panjagutta'],
        status: 'Available',
        shiftTiming: { start: '08:00 AM', end: '05:00 PM' },
        currentLocation: {
          lat: 17.4200,
          lng: 78.4350,
          heading: 180,
          lastUpdated: new Date(),
        },
        inventory: {
          bloodCollectionTubes: 50,
          urineContainers: 25,
          icePacks: 10,
        },
        performance: {
          totalCollectionsCompleted: 42,
          cancelledAppointments: 0,
          averageRating: 4.9,
        },
      },
      {
        name: 'Kiran Patel',
        phone: '9876543212',
        password: assistantHashedPassword,
        employeeId: 'EMP003',
        gender: 'Male',
        bloodGroup: 'A+',
        backgroundVerified: true,
        drivingLicense: 'DL-092021-39201',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS-08-KL-1102',
        assignedZones: ['Gachibowli', 'Financial District', 'Nanakramguda'],
        status: 'Available',
        shiftTiming: { start: '07:30 AM', end: '04:30 PM' },
        currentLocation: {
          lat: 17.4380,
          lng: 78.3450,
          heading: 270,
          lastUpdated: new Date(),
        },
        inventory: {
          bloodCollectionTubes: 45,
          urineContainers: 22,
          icePacks: 8,
        },
        performance: {
          totalCollectionsCompleted: 28,
          cancelledAppointments: 0,
          averageRating: 4.88,
        },
      }
    ]);
    console.log(`✅ Seeded ${labAssistants.length} Lab Assistants across Hyderabad zones.`);
    const primaryAssistant = labAssistants[0]; // Demo Assistant (9876543210)

    // 5. CREATE DIAGNOSTIC TEST CATALOGS (ALL DETAILS FILLED, ZERO NULLS)
    console.log('\n🧪 Seeding Diagnostic Test Catalogs...');
    const tests = await TestCatalog.insertMany([
      {
        testName: 'Complete Health Checkup & Biomarker Profile',
        testCode: 'CMP-FULL',
        category: 'Biochemistry & Pathology',
        pricing: { basePrice: 1200, taxPercentage: 5 },
        sampleType: 'Blood',
        specimenType: 'Venous Blood, Midstream Urine & Stool',
        description: 'Comprehensive biochemical profile covering complete hemogram, glucose, lipid, hepatic, and renal parameters.',
        preparationInstructions: 'Requires 8-10 hours overnight fasting. Water is permitted.',
        fastingRequired: true,
        turnAroundTime: 24,
        isActive: true,
      },
      {
        testName: 'Comprehensive Lipid & Cardiac Risk Assay',
        testCode: 'LIP-CARD',
        category: 'Cardiology',
        pricing: { basePrice: 850, taxPercentage: 5 },
        sampleType: 'Blood',
        specimenType: 'Venous Blood',
        description: 'Measures total cholesterol, LDL, HDL, triglycerides, and atherogenic lipoproteins.',
        preparationInstructions: '10-12 hours fasting required. Avoid heavy meals prior.',
        fastingRequired: true,
        turnAroundTime: 12,
        isActive: true,
      },
      {
        testName: 'Routine & Microscopic Urinalysis',
        testCode: 'URN-REN',
        category: 'Nephrology',
        pricing: { basePrice: 350, taxPercentage: 5 },
        sampleType: 'Urine',
        specimenType: 'Midstream Urine',
        description: 'Physical, chemical, and microscopic examination for renal function and cellular casts.',
        preparationInstructions: 'Midstream clean-catch sample in sterile container provided.',
        fastingRequired: false,
        turnAroundTime: 8,
        isActive: true,
      },
      {
        testName: 'Complete Blood Count & Hemogram',
        testCode: 'CBC-DIFF',
        category: 'Hematology',
        pricing: { basePrice: 450, taxPercentage: 5 },
        sampleType: 'Blood',
        specimenType: 'Venous EDTA Blood',
        description: 'Evaluates red cells, hemoglobin, hematocrit, white blood cells, differential, and platelets.',
        preparationInstructions: 'No special fasting required. Stay well hydrated.',
        fastingRequired: false,
        turnAroundTime: 6,
        isActive: true,
      }
    ]);
    console.log(`✅ Seeded ${tests.length} diagnostic test panels.`);

    const comprehensiveTest = tests[0];
    const lipidTest = tests[1];
    const urineTest = tests[2];
    const cbcTest = tests[3];

    // 6. CREATE PATIENTS / USERS (ALL DETAILS FILLED, ZERO NULLS)
    console.log('\n👥 Seeding Patient Accounts with Real Geolocation Coordinates...');
    const users = await User.insertMany([
      {
        phoneNumber: '9876512345',
        firstName: 'Priya',
        lastName: 'Sharma',
        dateOfBirth: new Date('1997-04-12'),
        gender: 'Female',
        bloodGroup: 'B+',
        profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        address: {
          houseNumber: 'Flat 402, Cyber Heights',
          street: 'Hitec City Main Road',
          landmark: 'Opposite Cyber Towers',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          coordinates: { lat: 17.4485, lng: 78.3768 },
          deliveryInstructions: 'Ring doorbell 402, elevator on right side'
        },
        lifestyle: {
          dietPreference: 'Non-Veg',
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'None',
          activityLevel: 'Active',
        },
        wearableSync: {
          deviceType: 'Smart Watch',
          deviceBrand: 'Apple Watch Series 9',
          lastSyncTimestamp: new Date()
        },
        emergencyContact: {
          name: 'Sunil Sharma',
          relation: 'Father',
          phoneNumber: '9876599999'
        },
        preferences: {
          appearance: 'Dark',
          notifications: { appointments: true, health: true, food: true, system: true }
        },
        vitalsStatus: 'Pending',
        accountStatus: 'Active',
      },
      {
        phoneNumber: '9988776655',
        firstName: 'Vikram',
        lastName: 'Malhotra',
        dateOfBirth: new Date('1982-08-25'),
        gender: 'Male',
        bloodGroup: 'O+',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        address: {
          houseNumber: 'Apt 7B, Cyber Palms',
          street: 'Botanical Garden Road',
          landmark: 'Near Sarath City Mall',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500084',
          coordinates: { lat: 17.4682, lng: 78.3615 },
          deliveryInstructions: 'Call on mobile when gate security is reached'
        },
        lifestyle: {
          dietPreference: 'Non-Veg',
          smokingHabit: 'Occasional',
          alcoholConsumption: 'Occasional',
          activityLevel: 'Sedentary',
        },
        wearableSync: {
          deviceType: 'Smart Ring',
          deviceBrand: 'Ultrahuman Ring AIR',
          lastSyncTimestamp: new Date()
        },
        emergencyContact: {
          name: 'Meera Malhotra',
          relation: 'Spouse',
          phoneNumber: '9988770000'
        },
        preferences: {
          appearance: 'Dark',
          notifications: { appointments: true, health: true, food: true, system: true }
        },
        vitalsStatus: 'Pending',
        accountStatus: 'Active',
      },
      {
        phoneNumber: '9001122334',
        firstName: 'Sneha',
        lastName: 'Reddy',
        dateOfBirth: new Date('1991-11-15'),
        gender: 'Female',
        bloodGroup: 'A+',
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        address: {
          houseNumber: 'Villa 18, Gachibowli Green',
          street: 'Financial District Expressway',
          landmark: 'Near Wipro Circle',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500032',
          coordinates: { lat: 17.4401, lng: 78.3489 },
          deliveryInstructions: 'Gated community, enter via visitor gate 2'
        },
        lifestyle: {
          dietPreference: 'Veg',
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'None',
          activityLevel: 'Lightly Active',
        },
        wearableSync: {
          deviceType: 'Smart Watch',
          deviceBrand: 'Fitbit Charge 6',
          lastSyncTimestamp: new Date()
        },
        emergencyContact: {
          name: 'Ramesh Reddy',
          relation: 'Brother',
          phoneNumber: '9001199999'
        },
        preferences: {
          appearance: 'Dark',
          notifications: { appointments: true, health: true, food: true, system: true }
        },
        vitalsStatus: 'Pending',
        accountStatus: 'Active',
      },
      {
        phoneNumber: '9123456780',
        firstName: 'Rahul',
        lastName: 'Verma',
        dateOfBirth: new Date('1989-02-18'),
        gender: 'Male',
        bloodGroup: 'AB+',
        profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        address: {
          houseNumber: 'House 12, Sunshine Villas',
          street: 'Jubilee Hills Rd 36',
          landmark: 'Near Metro Station',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500033',
          coordinates: { lat: 17.4319, lng: 78.4073 },
          deliveryInstructions: 'Corner villa with green gate'
        },
        lifestyle: {
          dietPreference: 'Non-Veg',
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'Occasional',
          activityLevel: 'Active',
        },
        wearableSync: {
          deviceType: 'Smart Watch',
          deviceBrand: 'Garmin Forerunner 965',
          lastSyncTimestamp: new Date()
        },
        emergencyContact: {
          name: 'Anita Verma',
          relation: 'Spouse',
          phoneNumber: '9123400000'
        },
        preferences: {
          appearance: 'Dark',
          notifications: { appointments: true, health: true, food: true, system: true }
        },
        vitalsStatus: 'Lab_Verified',
        accountStatus: 'Active',
      },
      {
        phoneNumber: '9112233445',
        firstName: 'Amit',
        lastName: 'Joshi',
        dateOfBirth: new Date('1994-06-30'),
        gender: 'Male',
        bloodGroup: 'O-',
        profilePicture: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        address: {
          houseNumber: 'Flat 204, Fortune Residency',
          street: 'Kavuri Hills Phase 2',
          landmark: 'Near Durgam Cheruvu Lake',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500033',
          coordinates: { lat: 17.4420, lng: 78.3960 },
          deliveryInstructions: 'Second block, 2nd floor'
        },
        lifestyle: {
          dietPreference: 'Veg',
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'None',
          activityLevel: 'Active',
        },
        wearableSync: {
          deviceType: 'Smart Watch',
          deviceBrand: 'Apple Watch Ultra 2',
          lastSyncTimestamp: new Date()
        },
        emergencyContact: {
          name: 'Pooja Joshi',
          relation: 'Sister',
          phoneNumber: '9112200000'
        },
        preferences: {
          appearance: 'Dark',
          notifications: { appointments: true, health: true, food: true, system: true }
        },
        vitalsStatus: 'Pending',
        accountStatus: 'Active',
      }
    ]);
    console.log(`✅ Seeded ${users.length} patient users with full demographic and address details.`);

    const priya = users[0];
    const vikram = users[1];
    const sneha = users[2];
    const rahul = users[3];
    const amit = users[4];

    // 7. CREATE APPOINTMENTS & SAMPLES DYNAMICALLY ASSIGNED BY DISTANCE
    console.log('\n📍 Performing Shortest-Distance Geolocation Routing for Assignments...');
    const now = new Date();

    // ------------------------------------------------------------------------
    // SCENARIO 1: FOR LAB ASSISTANT (PRIYA SHARMA)
    // Patient: Priya Sharma (Hitec City: 17.4485, 78.3768)
    // Nearest LA: Demo Assistant (1.5 km away)
    // Nearest Doctor: Dr. Rajesh Sharma (1.2 km away)
    // Status: Assistant_Assigned | OTP: 4829
    // Unique Barcodes: BIO-HYD-SMP-1001, BIO-HYD-SMP-1001-BLD, BIO-HYD-SMP-1001-URN, BIO-HYD-SMP-1001-STL
    // ------------------------------------------------------------------------
    const nearestLA1 = pickNearestStaff(priya.address.coordinates, labAssistants);
    const nearestDoc1 = pickNearestStaff(priya.address.coordinates, doctors);

    const appt1 = await Appointment.create({
      user: priya._id,
      labAssistant: nearestLA1.staff._id,
      doctor: nearestDoc1.staff._id,
      testCatalog: comprehensiveTest._id,
      appointmentType: 'Lab_Collection',
      scheduledDate: now,
      timeSlot: '09:00 AM - 10:00 AM',
      status: 'Assistant_Assigned',
      preparationInstructions: comprehensiveTest.preparationInstructions,
      address: priya.address,
      collectionOTP: '4829',
      paymentDetails: {
        isPaid: false,
        amount: 1260,
        method: 'None',
        collectedAt: new Date(),
        collectedBy: nearestLA1.staff._id
      },
      specimens: {
        blood: { collected: false, tubesCount: 3, barcode: 'BIO-HYD-SMP-1001-BLD' },
        urine: { collected: false, barcode: 'BIO-HYD-SMP-1001-URN' },
        stool: { collected: false, barcode: 'BIO-HYD-SMP-1001-STL' },
        coldChainSecured: true,
      },
      clinicalIntake: {
        vitals: {
          systolic: 118,
          diastolic: 78,
          pulse: 72,
          spO2: 99,
          temperatureF: 98.4,
          heightCm: 165,
          weightKg: 58,
          bmi: 21.3,
          waistCm: 72
        },
        medicalHistory: {
          chronicConditions: ['None'],
          currentMedications: 'Multivitamin daily',
          knownAllergies: 'None',
          familyHistory: ['Maternal Hypertension']
        },
        lifestyle: {
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'None',
          dietPreference: 'Non-Veg',
          activityLevel: 'Active',
          sleepHours: 7.5,
          stressLevel: 'Low'
        },
        preScreening: {
          fastingObserved: true,
          fastingDurationHours: 10,
          morningMedicationsTaken: 'None',
          bleedingDisorderHistory: false,
          faintingHistory: false,
          activeSymptoms: 'None. Routine checkup.',
          phlebotomistObservations: 'Patient well-hydrated, veins prominent on median cubital.'
        }
      },
      questionnaire: {
        fastingObserved: true,
        fastingDurationHours: 10,
        morningMedications: 'None',
        bleedingDisorderHistory: false,
        faintingHistory: false,
        activeSymptoms: 'None',
        clinicalNotes: 'First appointment on BioSync platform.'
      },
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(Date.now() - 3600000), notes: 'Booked by patient online.' },
        { 
          status: 'Assistant_Assigned', 
          timestamp: new Date(Date.now() - 1800000), 
          notes: `Shortest-distance routing: Assigned nearest Lab Assistant "${nearestLA1.staff.name}" (${nearestLA1.distanceKm} km away) and Pathologist "${nearestDoc1.staff.name}" (${nearestDoc1.distanceKm} km away).` 
        },
      ],
    });

    const sample1 = await Sample.create({
      user: priya._id,
      appointment: appt1._id,
      testCatalog: comprehensiveTest._id,
      labAssistant: nearestLA1.staff._id,
      doctor: nearestDoc1.staff._id,
      barcode: 'BIO-HYD-SMP-1001',
      status: 'Assigned',
      resultsDone: false,
      resultsStatus: 'Res yet to be obtained',
      turnaroundTimeHours: 24,
      specimens: {
        blood: { collected: false, barcode: 'BIO-HYD-SMP-1001-BLD' },
        urine: { collected: false, barcode: 'BIO-HYD-SMP-1001-URN' },
        stool: { collected: false, barcode: 'BIO-HYD-SMP-1001-STL' },
      },
      structuredResults: []
    });

    await Transaction.create({
      appointment: appt1._id,
      user: priya._id,
      amount: 1260,
      type: 'Cash_On_Collection',
      status: 'Pending',
      paymentGateway: 'Cash_On_Delivery',
      revenueType: 'Lab_Test'
    });

    console.log(`✅ Scenario 1 (LA Active Trip): Priya Sharma -> Nearest LA: ${nearestLA1.staff.name} (${nearestLA1.distanceKm} km), Nearest Doctor: ${nearestDoc1.staff.name} (${nearestDoc1.distanceKm} km) | Barcode: BIO-HYD-SMP-1001`);

    // ------------------------------------------------------------------------
    // SCENARIO 2: FOR DOCTOR (VIKRAM MALHOTRA)
    // Patient: Vikram Malhotra (Kondapur: 17.4682, 78.3615)
    // Dropped off at Laboratory! Ready for Doctor results decision & vitals!
    // Status: At_Laboratory | resultsDone: false | "Res yet to be obtained"
    // Unique Barcodes: BIO-HYD-SMP-1002, BIO-HYD-SMP-1002-BLD, BIO-HYD-SMP-1002-URN, BIO-HYD-SMP-1002-STL
    // ------------------------------------------------------------------------
    const nearestLA2 = pickNearestStaff(vikram.address.coordinates, labAssistants);
    const nearestDoc2 = pickNearestStaff(vikram.address.coordinates, doctors);

    const appt2 = await Appointment.create({
      user: vikram._id,
      labAssistant: nearestLA2.staff._id,
      doctor: nearestDoc2.staff._id,
      testCatalog: comprehensiveTest._id,
      appointmentType: 'Lab_Collection',
      scheduledDate: now,
      timeSlot: '07:30 AM - 08:30 AM',
      status: 'At_Laboratory',
      preparationInstructions: comprehensiveTest.preparationInstructions,
      address: vikram.address,
      collectionOTP: '6219',
      paymentDetails: {
        isPaid: true,
        amount: 1260,
        method: 'UPI',
        collectedAt: new Date(Date.now() - 7200000),
        collectedBy: nearestLA2.staff._id,
      },
      specimens: {
        blood: { collected: true, tubesCount: 3, barcode: 'BIO-HYD-SMP-1002-BLD' },
        urine: { collected: true, barcode: 'BIO-HYD-SMP-1002-URN' },
        stool: { collected: true, barcode: 'BIO-HYD-SMP-1002-STL' },
        coldChainSecured: true,
      },
      clinicalIntake: {
        vitals: {
          systolic: 128,
          diastolic: 84,
          pulse: 78,
          spO2: 98,
          temperatureF: 98.6,
          heightCm: 176,
          weightKg: 82,
          bmi: 26.5,
          waistCm: 88
        },
        medicalHistory: {
          chronicConditions: ['Mild Dyslipidemia'],
          currentMedications: 'Atorvastatin 10mg daily',
          knownAllergies: 'Sulfa drugs',
          familyHistory: ['Paternal Diabetes']
        },
        lifestyle: {
          smokingHabit: 'Occasional',
          alcoholConsumption: 'Occasional',
          dietPreference: 'Non-Veg',
          activityLevel: 'Sedentary',
          sleepHours: 6.5,
          stressLevel: 'Moderate'
        },
        preScreening: {
          fastingObserved: true,
          fastingDurationHours: 12,
          morningMedicationsTaken: 'Atorvastatin taken last night',
          bleedingDisorderHistory: false,
          faintingHistory: false,
          activeSymptoms: 'Occasional postprandial fatigue',
          phlebotomistObservations: 'Venipuncture performed smoothly. Good specimen yield.'
        }
      },
      questionnaire: {
        fastingObserved: true,
        fastingDurationHours: 12,
        morningMedications: 'None morning',
        bleedingDisorderHistory: false,
        faintingHistory: false,
        activeSymptoms: 'Fatigue',
        clinicalNotes: 'Lipid monitoring profile.'
      },
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(Date.now() - 14400000), notes: 'Booked via patient app.' },
        { 
          status: 'Assistant_Assigned', 
          timestamp: new Date(Date.now() - 10800000), 
          notes: `Assigned nearest LA "${nearestLA2.staff.name}" (${nearestLA2.distanceKm} km away) and Pathologist "${nearestDoc2.staff.name}" (${nearestDoc2.distanceKm} km away).` 
        },
        { status: 'Sample_Collected', timestamp: new Date(Date.now() - 7200000), notes: 'Blood and urine drawn successfully, barcoded, and sealed in cooling kit.' },
        { status: 'At_Laboratory', timestamp: new Date(Date.now() - 3600000), notes: 'Courier delivered to Central Laboratory accessioning desk.' },
      ],
    });

    const sample2 = await Sample.create({
      user: vikram._id,
      appointment: appt2._id,
      testCatalog: comprehensiveTest._id,
      labAssistant: nearestLA2.staff._id,
      doctor: nearestDoc2.staff._id,
      barcode: 'BIO-HYD-SMP-1002',
      status: 'At_Laboratory',
      resultsDone: false,
      resultsStatus: 'Res yet to be obtained',
      collectionTime: new Date(Date.now() - 7200000),
      turnaroundTimeHours: 12,
      specimens: {
        blood: { collected: true, barcode: 'BIO-HYD-SMP-1002-BLD' },
        urine: { collected: true, barcode: 'BIO-HYD-SMP-1002-URN' },
        stool: { collected: true, barcode: 'BIO-HYD-SMP-1002-STL' },
      },
      structuredResults: [
        { biomarker: 'Fasting Plasma Glucose', value: 98, isCritical: false },
        { biomarker: 'Serum Creatinine', value: 1.02, isCritical: false },
        { biomarker: 'Total Cholesterol', value: 215, isCritical: false },
        { biomarker: 'Triglycerides', value: 185, isCritical: false }
      ]
    });

    await Transaction.create({
      appointment: appt2._id,
      user: vikram._id,
      amount: 1260,
      type: 'UPI',
      status: 'Success',
      paymentGateway: 'Razorpay',
      revenueType: 'Lab_Test'
    });

    console.log(`✅ Scenario 2 (Doctor Received Tab): Vikram Malhotra -> Nearest LA: ${nearestLA2.staff.name} (${nearestLA2.distanceKm} km), Nearest Doctor: ${nearestDoc2.staff.name} (${nearestDoc2.distanceKm} km) | Barcode: BIO-HYD-SMP-1002`);

    // ------------------------------------------------------------------------
    // SCENARIO 3: FOR DOCTOR (SNEHA REDDY)
    // Patient: Sneha Reddy (Gachibowli: 17.4401, 78.3489)
    // Under Analyzer Processing! resultsDone: true | "Results Ready"
    // Unique Barcodes: BIO-HYD-SMP-1003, BIO-HYD-SMP-1003-BLD, BIO-HYD-SMP-1003-URN
    // ------------------------------------------------------------------------
    const nearestLA3 = pickNearestStaff(sneha.address.coordinates, labAssistants);
    const nearestDoc3 = pickNearestStaff(sneha.address.coordinates, doctors);

    const appt3 = await Appointment.create({
      user: sneha._id,
      labAssistant: nearestLA3.staff._id,
      doctor: nearestDoc3.staff._id,
      testCatalog: lipidTest._id,
      appointmentType: 'Lab_Collection',
      scheduledDate: now,
      timeSlot: '08:00 AM - 09:00 AM',
      status: 'Processing',
      address: sneha.address,
      collectionOTP: '8821',
      paymentDetails: {
        isPaid: true,
        amount: 892.5,
        method: 'UPI',
        collectedAt: new Date(Date.now() - 10800000),
        collectedBy: nearestLA3.staff._id
      },
      specimens: {
        blood: { collected: true, tubesCount: 2, barcode: 'BIO-HYD-SMP-1003-BLD' },
        urine: { collected: true, barcode: 'BIO-HYD-SMP-1003-URN' },
        stool: { collected: false, barcode: 'BIO-HYD-SMP-1003-STL' },
        coldChainSecured: true,
      },
      clinicalIntake: {
        vitals: {
          systolic: 112,
          diastolic: 74,
          pulse: 68,
          spO2: 99,
          temperatureF: 98.2,
          heightCm: 162,
          weightKg: 54,
          bmi: 20.6,
          waistCm: 68
        },
        medicalHistory: {
          chronicConditions: ['None'],
          currentMedications: 'None',
          knownAllergies: 'None',
          familyHistory: ['None']
        },
        lifestyle: {
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'None',
          dietPreference: 'Veg',
          activityLevel: 'Lightly Active',
          sleepHours: 8.0,
          stressLevel: 'Low'
        },
        preScreening: {
          fastingObserved: true,
          fastingDurationHours: 11,
          morningMedicationsTaken: 'None',
          bleedingDisorderHistory: false,
          faintingHistory: false,
          activeSymptoms: 'None',
          phlebotomistObservations: 'Smooth phlebotomy without complications.'
        }
      },
      questionnaire: {
        fastingObserved: true,
        fastingDurationHours: 11,
        morningMedications: 'None',
        bleedingDisorderHistory: false,
        faintingHistory: false,
        activeSymptoms: 'None',
        clinicalNotes: 'Routine wellness evaluation.'
      },
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(Date.now() - 18000000), notes: 'Booked via portal.' },
        { 
          status: 'Assistant_Assigned', 
          timestamp: new Date(Date.now() - 14400000), 
          notes: `Shortest-distance routing: Assigned nearest LA "${nearestLA3.staff.name}" (${nearestLA3.distanceKm} km away) and Pathologist "${nearestDoc3.staff.name}" (${nearestDoc3.distanceKm} km away).` 
        },
        { status: 'Sample_Collected', timestamp: new Date(Date.now() - 10800000), notes: 'Specimens labeled and loaded into temperature controlled transport.' },
        { status: 'At_Laboratory', timestamp: new Date(Date.now() - 7200000), notes: 'Received and verified at lab accessioning.' },
        { status: 'Processing', timestamp: new Date(Date.now() - 3600000), notes: 'Automated photometric and fluorometric analyzer assays in progress.' },
      ],
    });

    const sample3 = await Sample.create({
      user: sneha._id,
      appointment: appt3._id,
      testCatalog: lipidTest._id,
      labAssistant: nearestLA3.staff._id,
      doctor: nearestDoc3.staff._id,
      barcode: 'BIO-HYD-SMP-1003',
      status: 'Processing',
      resultsDone: true,
      resultsStatus: 'Results Ready',
      collectionTime: new Date(Date.now() - 10800000),
      labProcessingStartTime: new Date(Date.now() - 3600000),
      turnaroundTimeHours: 6,
      specimens: {
        blood: { collected: true, barcode: 'BIO-HYD-SMP-1003-BLD' },
        urine: { collected: true, barcode: 'BIO-HYD-SMP-1003-URN' },
        stool: { collected: false, barcode: 'BIO-HYD-SMP-1003-STL' },
      },
      structuredResults: [
        { biomarker: 'Total Cholesterol', value: 168, isCritical: false },
        { biomarker: 'HDL Cholesterol', value: 58, isCritical: false },
        { biomarker: 'LDL Cholesterol', value: 92, isCritical: false },
        { biomarker: 'Triglycerides', value: 110, isCritical: false },
        { biomarker: 'VLDL Cholesterol', value: 18, isCritical: false }
      ]
    });

    await Transaction.create({
      appointment: appt3._id,
      user: sneha._id,
      amount: 892.5,
      type: 'UPI',
      status: 'Success',
      paymentGateway: 'Razorpay',
      revenueType: 'Lab_Test'
    });

    console.log(`✅ Scenario 3 (Doctor Processing Tab): Sneha Reddy -> Nearest LA: ${nearestLA3.staff.name} (${nearestLA3.distanceKm} km), Nearest Doctor: ${nearestDoc3.staff.name} (${nearestDoc3.distanceKm} km) | Barcode: BIO-HYD-SMP-1003`);

    // ------------------------------------------------------------------------
    // SCENARIO 4: COMPLETED / VERIFIED SPECIMEN (RAHUL VERMA)
    // Patient: Rahul Verma (Jubilee Hills: 17.4319, 78.4073)
    // Fully certified report with User DB Vitals attached
    // Unique Barcodes: BIO-HYD-SMP-1004, BIO-HYD-SMP-1004-URN
    // ------------------------------------------------------------------------
    const yesterday = new Date(Date.now() - 86400000);
    const nearestLA4 = pickNearestStaff(rahul.address.coordinates, labAssistants);
    const nearestDoc4 = pickNearestStaff(rahul.address.coordinates, doctors);

    const appt4 = await Appointment.create({
      user: rahul._id,
      labAssistant: nearestLA4.staff._id,
      doctor: nearestDoc4.staff._id,
      testCatalog: urineTest._id,
      appointmentType: 'Lab_Collection',
      scheduledDate: yesterday,
      timeSlot: '11:00 AM - 12:00 PM',
      status: 'Completed',
      address: rahul.address,
      collectionOTP: '1100',
      paymentDetails: {
        isPaid: true,
        amount: 367.5,
        method: 'UPI',
        collectedAt: yesterday,
        collectedBy: nearestLA4.staff._id
      },
      specimens: {
        blood: { collected: false, barcode: 'BIO-HYD-SMP-1004-BLD' },
        urine: { collected: true, barcode: 'BIO-HYD-SMP-1004-URN' },
        stool: { collected: false, barcode: 'BIO-HYD-SMP-1004-STL' },
        coldChainSecured: true,
      },
      clinicalIntake: {
        vitals: {
          systolic: 120,
          diastolic: 80,
          pulse: 71,
          spO2: 98.5,
          temperatureF: 98.4,
          heightCm: 178,
          weightKg: 74,
          bmi: 23.4,
          waistCm: 81
        },
        medicalHistory: {
          chronicConditions: ['None'],
          currentMedications: 'None',
          knownAllergies: 'None',
          familyHistory: ['None']
        },
        lifestyle: {
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'Occasional',
          dietPreference: 'Non-Veg',
          activityLevel: 'Active',
          sleepHours: 7.2,
          stressLevel: 'Low'
        },
        preScreening: {
          fastingObserved: true,
          fastingDurationHours: 8,
          morningMedicationsTaken: 'None',
          bleedingDisorderHistory: false,
          faintingHistory: false,
          activeSymptoms: 'None',
          phlebotomistObservations: 'Clean specimen collected and sealed.'
        }
      },
      questionnaire: {
        fastingObserved: true,
        fastingDurationHours: 8,
        morningMedications: 'None',
        bleedingDisorderHistory: false,
        faintingHistory: false,
        activeSymptoms: 'None',
        clinicalNotes: 'Urinalysis screening.'
      },
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(yesterday.getTime() - 7200000), notes: 'Booked online.' },
        { 
          status: 'Assistant_Assigned', 
          timestamp: new Date(yesterday.getTime() - 5400000), 
          notes: `Shortest-distance routing: Assigned nearest LA "${nearestLA4.staff.name}" (${nearestLA4.distanceKm} km away) and Pathologist "${nearestDoc4.staff.name}" (${nearestDoc4.distanceKm} km away).` 
        },
        { status: 'Sample_Collected', timestamp: new Date(yesterday.getTime() - 3600000), notes: 'Specimen drawn and barcoded.' },
        { status: 'At_Laboratory', timestamp: new Date(yesterday.getTime() - 1800000), notes: 'Received in lab.' },
        { status: 'Processing', timestamp: new Date(yesterday.getTime() - 900000), notes: 'Automated test run.' },
        { status: 'Completed', timestamp: yesterday, notes: `Report authorized & digitally certified by ${nearestDoc4.staff.name} (${nearestDoc4.staff.licenseNumber}).` },
      ],
    });

    await Sample.create({
      user: rahul._id,
      appointment: appt4._id,
      testCatalog: urineTest._id,
      labAssistant: nearestLA4.staff._id,
      doctor: nearestDoc4.staff._id,
      barcode: 'BIO-HYD-SMP-1004',
      status: 'Report_Generated',
      resultsDone: true,
      resultsStatus: 'Results Entered',
      collectionTime: new Date(yesterday.getTime() - 3600000),
      labProcessingStartTime: new Date(yesterday.getTime() - 1800000),
      reportGenerationTime: yesterday,
      turnaroundTimeHours: 4,
      verifiedBy: nearestDoc4.staff.name,
      verifiedAt: yesterday,
      doctorLicense: nearestDoc4.staff.licenseNumber,
      doctorRemarks: 'Urinalysis parameters within biological reference intervals. No microscopic hematuria or proteinuria detected.',
      specimens: {
        blood: { collected: false, barcode: 'BIO-HYD-SMP-1004-BLD' },
        urine: { collected: true, barcode: 'BIO-HYD-SMP-1004-URN' },
        stool: { collected: false, barcode: 'BIO-HYD-SMP-1004-STL' },
      },
      structuredResults: [
        { biomarker: 'Urine Specific Gravity', value: 1.018, isCritical: false },
        { biomarker: 'Urine pH', value: 6.2, isCritical: false },
        { biomarker: 'Urine Protein', value: 0, isCritical: false },
        { biomarker: 'Urine Glucose', value: 0, isCritical: false },
      ],
    });

    await Vitals.create({
      user: rahul._id,
      source: 'Doctor',
      isInitialBaseline: true,
      isVerifiedByUser: true,
      recordedAt: yesterday,
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
        basalBodyTemperatureF: 98.4
      },
      metabolicHealth: {
        glucoseFasting: 92,
        hba1c: 5.3,
        insulinFasting: 8.5
      },
      cardiovascularRisk: {
        systolic: 120,
        diastolic: 80,
        totalCholesterol: 175,
        ldlCholesterol: 98,
        hdlCholesterol: 55,
        triglycerides: 110
      },
      organFunction: {
        creatinine: 0.9,
        uricAcid: 5.2,
        bun: 14.2,
        egfr: 98
      },
      immunology: {
        crp: 0.6,
        whiteBloodCellCount: 6800
      },
      hormones: {
        tsh: 2.1,
        freeT4: 1.3
      },
      micronutrients: {
        vitaminD: 38,
        vitaminB12: 540,
        ferritin: 120
      },
      geneticAndGut: {
        gutMicrobiomeScore: 84,
        inflammatoryRiskIndex: 'Low'
      }
    });

    console.log(`✅ Scenario 4 (Completed History): Rahul Verma -> Nearest LA: ${nearestLA4.staff.name} (${nearestLA4.distanceKm} km), Nearest Doctor: ${nearestDoc4.staff.name} (${nearestDoc4.distanceKm} km) | Barcode: BIO-HYD-SMP-1004`);

    // ------------------------------------------------------------------------
    // SCENARIO 5: SAMPLE IN FIELD TRANSIT (AMIT JOSHI)
    // Patient: Amit Joshi (Kavuri Hills, Madhapur: 17.4420, 78.3960)
    // Status: Sample_Collected | On route to laboratory
    // Unique Barcodes: BIO-HYD-SMP-1005, BIO-HYD-SMP-1005-BLD
    // ------------------------------------------------------------------------
    const nearestLA5 = pickNearestStaff(amit.address.coordinates, labAssistants);
    const nearestDoc5 = pickNearestStaff(amit.address.coordinates, doctors);

    const appt5 = await Appointment.create({
      user: amit._id,
      labAssistant: nearestLA5.staff._id,
      doctor: nearestDoc5.staff._id,
      testCatalog: cbcTest._id,
      appointmentType: 'Lab_Collection',
      scheduledDate: now,
      timeSlot: '01:00 PM - 02:00 PM',
      status: 'Sample_Collected',
      address: amit.address,
      collectionOTP: '3318',
      paymentDetails: {
        isPaid: true,
        amount: 472.5,
        method: 'UPI',
        collectedAt: new Date(Date.now() - 1800000),
        collectedBy: nearestLA5.staff._id
      },
      specimens: {
        blood: { collected: true, tubesCount: 1, barcode: 'BIO-HYD-SMP-1005-BLD' },
        urine: { collected: false, barcode: 'BIO-HYD-SMP-1005-URN' },
        stool: { collected: false, barcode: 'BIO-HYD-SMP-1005-STL' },
        coldChainSecured: true,
      },
      clinicalIntake: {
        vitals: {
          systolic: 122,
          diastolic: 82,
          pulse: 75,
          spO2: 99,
          temperatureF: 98.6,
          heightCm: 172,
          weightKg: 70,
          bmi: 23.6,
          waistCm: 79
        },
        medicalHistory: {
          chronicConditions: ['None'],
          currentMedications: 'None',
          knownAllergies: 'None',
          familyHistory: ['None']
        },
        lifestyle: {
          smokingHabit: 'Non-smoker',
          alcoholConsumption: 'None',
          dietPreference: 'Veg',
          activityLevel: 'Active',
          sleepHours: 7.5,
          stressLevel: 'Low'
        },
        preScreening: {
          fastingObserved: true,
          fastingDurationHours: 6,
          morningMedicationsTaken: 'None',
          bleedingDisorderHistory: false,
          faintingHistory: false,
          activeSymptoms: 'None',
          phlebotomistObservations: 'Venipuncture without incident. Specimen in ice pouch.'
        }
      },
      questionnaire: {
        fastingObserved: true,
        fastingDurationHours: 6,
        morningMedications: 'None',
        bleedingDisorderHistory: false,
        faintingHistory: false,
        activeSymptoms: 'None',
        clinicalNotes: 'Hemogram checkup.'
      },
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(Date.now() - 7200000), notes: 'Booked online.' },
        { 
          status: 'Assistant_Assigned', 
          timestamp: new Date(Date.now() - 5400000), 
          notes: `Shortest-distance routing: Assigned nearest LA "${nearestLA5.staff.name}" (${nearestLA5.distanceKm} km away) and Pathologist "${nearestDoc5.staff.name}" (${nearestDoc5.distanceKm} km away).` 
        },
        { status: 'Sample_Collected', timestamp: new Date(Date.now() - 1800000), notes: 'Specimen drawn, labeled with barcode BIO-HYD-SMP-1005-BLD and dispatched in cold carrier.' },
      ],
    });

    await Sample.create({
      user: amit._id,
      appointment: appt5._id,
      testCatalog: cbcTest._id,
      labAssistant: nearestLA5.staff._id,
      doctor: nearestDoc5.staff._id,
      barcode: 'BIO-HYD-SMP-1005',
      status: 'Sample_Collected',
      resultsDone: false,
      resultsStatus: 'Res yet to be obtained',
      collectionTime: new Date(Date.now() - 1800000),
      turnaroundTimeHours: 6,
      specimens: {
        blood: { collected: true, barcode: 'BIO-HYD-SMP-1005-BLD' },
        urine: { collected: false, barcode: 'BIO-HYD-SMP-1005-URN' },
        stool: { collected: false, barcode: 'BIO-HYD-SMP-1005-STL' },
      },
      structuredResults: []
    });

    await Transaction.create({
      appointment: appt5._id,
      user: amit._id,
      amount: 472.5,
      type: 'UPI',
      status: 'Success',
      paymentGateway: 'Razorpay',
      revenueType: 'Lab_Test'
    });

    console.log(`✅ Scenario 5 (Incoming Transit): Amit Joshi -> Nearest LA: ${nearestLA5.staff.name} (${nearestLA5.distanceKm} km), Nearest Doctor: ${nearestDoc5.staff.name} (${nearestDoc5.distanceKm} km) | Barcode: BIO-HYD-SMP-1005`);

    // 8. OPERATIONAL NOTIFICATIONS
    await Notification.insertMany([
      {
        title: 'New Phlebotomy Task Assigned',
        message: `Nearest routing: You are assigned home collection for Priya Sharma (${nearestLA1.distanceKm} km from current location).`,
        type: 'Appointments',
        targetAudience: 'LabAssistants',
        targetUserId: primaryAssistant._id,
        isRead: false,
      },
      {
        title: 'Specimen Handover at Central Lab',
        message: 'Barcode BIO-HYD-SMP-1002 received at accessioning and assigned to your desk.',
        type: 'Reports',
        targetAudience: 'Doctors',
        targetUserId: primaryDoctor._id,
        isRead: false,
      },
    ]);
    console.log('✅ Seeded Operational Notifications.');

    console.log('\n======================================================');
    console.log('🎉 SEEDING COMPLETED WITH ZERO NULLS & SHORTEST-DISTANCE ROUTING!');
    console.log('======================================================');
    console.log('📱 1. LAB ASSISTANT LOGIN (STAFF PANEL):');
    console.log('   Phone:     9876543210');
    console.log('   Password:  password123');
    console.log('   Action:    Active trip for Priya Sharma ready in Spotlight!');
    console.log('              Collection OTP: 4829');
    console.log('              Barcode: BIO-HYD-SMP-1001 (Unique, zero duplicates)');
    console.log('------------------------------------------------------');
    console.log('🩺 2. DOCTOR LOGIN (STAFF PANEL):');
    console.log('   Phone:     9876500001');
    console.log('   Password:  password123');
    console.log('   Action:    Vikram Malhotra waiting in "Received at Lab" (Barcode: BIO-HYD-SMP-1002)');
    console.log('              Sneha Reddy waiting in "In Processing" (Barcode: BIO-HYD-SMP-1003)');
    console.log('              Amit Joshi in "In Transit / Incoming" (Barcode: BIO-HYD-SMP-1005)');
    console.log('------------------------------------------------------');
    console.log('👤 3. ADMIN PORTAL LOGIN:');
    console.log('   Email:     admin@biosyncai.com');
    console.log('   Password:  Admin123');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
}

seedCompleteTestData();

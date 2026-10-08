import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Import Models
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import LabAssistant from './models/LabAssistant.js';
import Admin from './models/Admin.js';
import Role from './models/Role.js';
import TestCatalog from './models/TestCatalog.js';
import Appointment from './models/Appointment.js';
import Sample from './models/Sample.js';
import Vitals from './models/Vitals.js';
import FoodLog from './models/FoodLog.js';
import Notification from './models/Notification.js';
import Ticket from './models/Ticket.js';
import Transaction from './models/Transaction.js';
import AuditLog from './models/AuditLog.js';
import SystemLog from './models/SystemLog.js';
import AILog from './models/AILog.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/biosyncai';

async function seedDatabase() {
  console.log('====================================================');
  console.log('  BioSync AI - Comprehensive Master Ecosystem Seeder');
  console.log('====================================================');
  console.log(`Connecting to MongoDB at: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected successfully.');

    // 0. Clean old collections if flag provided or clean slate run
    console.log('\nPurging existing records for a fresh, synchronized ecosystem...');
    await Promise.all([
      Role.deleteMany({}),
      Admin.deleteMany({}),
      Doctor.deleteMany({}),
      LabAssistant.deleteMany({}),
      TestCatalog.deleteMany({}),
      User.deleteMany({}),
      Vitals.deleteMany({}),
      Appointment.deleteMany({}),
      Sample.deleteMany({}),
      FoodLog.deleteMany({}),
      Notification.deleteMany({}),
      Ticket.deleteMany({}),
      Transaction.deleteMany({}),
      AuditLog.deleteMany({}),
      SystemLog.deleteMany({}),
      AILog.deleteMany({}),
    ]);
    console.log('Cleared all prior collections.');

    // Shared password hashes
    const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
    const opsPasswordHash = await bcrypt.hash('Ops@123456', 10);
    const doctorPasswordHash = await bcrypt.hash('doctorpassword123', 10);
    const staffPasswordHash = await bcrypt.hash('staffpassword123', 10);

    // ==========================================
    // 1. ROLES
    // ==========================================
    console.log('\nSeeding Enterprise RBAC Roles...');
    const roles = await Role.insertMany([
      {
        name: 'SuperAdmin',
        description: 'Complete unrestricted access to all ecosystem controls',
        permissions: { dashboard: true, users: true, roles: true, reports: true, settings: true },
        isSystem: true,
      },
      {
        name: 'Operations_Manager',
        description: 'Dispatch, fleet logistics, incident recovery, and appointments management',
        permissions: { dashboard: true, users: true, roles: false, reports: true, settings: true },
        isSystem: true,
      },
      {
        name: 'Support_Staff',
        description: 'Customer ticket resolution, phlebotomist tracking, and appointment assistance',
        permissions: { dashboard: true, users: true, roles: false, reports: false, settings: false },
        isSystem: true,
      },
      {
        name: 'Data_Analyst',
        description: 'Financial reporting, telemetry metrics, and AI health data analytics',
        permissions: { dashboard: true, users: false, roles: false, reports: true, settings: false },
        isSystem: true,
      },
    ]);
    console.log(`Created ${roles.length} RBAC roles.`);

    // ==========================================
    // 2. ADMIN ACCOUNTS
    // ==========================================
    console.log('\nSeeding Admin Management Accounts...');
    const admins = await Admin.insertMany([
      {
        name: 'Super Administrator',
        email: 'admin@biosync.ai',
        password: adminPasswordHash,
        role: 'SuperAdmin',
        lastLogin: new Date(),
      },
      {
        name: 'Operations Commander',
        email: 'ops@biosync.ai',
        password: opsPasswordHash,
        role: 'Operations_Manager',
        lastLogin: new Date(Date.now() - 3600000),
      },
      {
        name: 'Senior Support Agent',
        email: 'support@biosync.ai',
        password: opsPasswordHash,
        role: 'Support_Staff',
        lastLogin: new Date(Date.now() - 7200000),
      },
      {
        name: 'Chief Clinical Analyst',
        email: 'analyst@biosync.ai',
        password: opsPasswordHash,
        role: 'Data_Analyst',
        lastLogin: new Date(Date.now() - 14400000),
      },
    ]);
    console.log(`Created ${admins.length} Admin accounts.`);

    // ==========================================
    // 3. DOCTORS / PATHOLOGISTS
    // ==========================================
    console.log('\nSeeding Clinical Doctors & Pathologists...');
    const doctors = await Doctor.insertMany([
      {
        name: 'Dr. Rajesh Khanna, MD',
        specialty: 'Pathology & Laboratory Medicine',
        email: 'dr.khanna@biosync.ai',
        phone: '9876500001',
        password: doctorPasswordHash,
        role: 'doctor',
        licenseNumber: 'MCI-PATH-77291',
        hospitalAffiliation: 'BioSync Central Reference Laboratory, Hitec City',
        rating: 4.95,
        status: 'Active',
        currentLocation: { lat: 17.4486, lng: 78.3742, address: 'Central Lab Cyber Towers', zone: 'Hitec City' },
      },
      {
        name: 'Dr. Priya Swaminathan, DM',
        specialty: 'Clinical Cardiology & Hemodynamics',
        email: 'dr.swaminathan@biosync.ai',
        phone: '9876500002',
        password: doctorPasswordHash,
        role: 'doctor',
        licenseNumber: 'MCI-CARD-88312',
        hospitalAffiliation: 'Apollo Institute of Cardiovascular Sciences',
        rating: 4.98,
        status: 'Active',
        currentLocation: { lat: 17.4156, lng: 78.4121, address: 'Apollo Jubilee Hills', zone: 'Jubilee Hills' },
      },
      {
        name: 'Dr. Arvind Deshmukh, MD',
        specialty: 'Endocrinology & Metabolic Disorders',
        email: 'dr.deshmukh@biosync.ai',
        phone: '9876500003',
        password: doctorPasswordHash,
        role: 'doctor',
        licenseNumber: 'MCI-ENDO-66419',
        hospitalAffiliation: 'MaxCure Center for Diabetology',
        rating: 4.92,
        status: 'Active',
        currentLocation: { lat: 17.4399, lng: 78.3908, address: 'Madhapur Health Hub', zone: 'Madhapur' },
      },
      {
        name: 'Dr. Meenakshi Sundaram, MD',
        specialty: 'Hematology & Immunopathology',
        email: 'dr.sundaram@biosync.ai',
        phone: '9876500004',
        password: doctorPasswordHash,
        role: 'doctor',
        licenseNumber: 'MCI-HEMA-99214',
        hospitalAffiliation: 'BioSync Genomic Diagnostics Lab',
        rating: 4.96,
        status: 'Active',
        currentLocation: { lat: 17.4422, lng: 78.3822, address: 'Knowledge City Wing B', zone: 'Knowledge City' },
      },
      {
        name: 'Dr. Siddharth Varma, MD',
        specialty: 'Nephrology & Renal Medicine',
        email: 'dr.varma@biosync.ai',
        phone: '9876500005',
        password: doctorPasswordHash,
        role: 'doctor',
        licenseNumber: 'MCI-NEPH-55102',
        hospitalAffiliation: 'Continental Hospitals Nephro Center',
        rating: 4.89,
        status: 'Active',
        currentLocation: { lat: 17.4190, lng: 78.3480, address: 'Financial District Health City', zone: 'Gachibowli' },
      },
      {
        name: 'Dr. Radhika Nair, MD',
        specialty: 'Gastroenterology & Hepatology',
        email: 'dr.nair@biosync.ai',
        phone: '9876500006',
        password: doctorPasswordHash,
        role: 'doctor',
        licenseNumber: 'MCI-GAST-44199',
        hospitalAffiliation: 'Asian Institute of Gastroenterology',
        rating: 4.94,
        status: 'Active',
        currentLocation: { lat: 17.4468, lng: 78.3582, address: 'Gachibowli Central', zone: 'Gachibowli' },
      },
      {
        name: 'Dr. Amitav Ghosh, MD',
        specialty: 'Pulmonology & Critical Care',
        email: 'dr.ghosh@biosync.ai',
        phone: '9876500007',
        password: doctorPasswordHash,
        role: 'doctor',
        licenseNumber: 'MCI-PULM-33281',
        hospitalAffiliation: 'Care Hospital Respiratory Center',
        rating: 4.88,
        status: 'Active',
        currentLocation: { lat: 17.4112, lng: 78.4380, address: 'Banjara Hills Rd 1', zone: 'Banjara Hills' },
      },
      {
        name: 'Dr. Tanvi Sengupta, PhD MD',
        specialty: 'Preventive Longevity Medicine & Epigenetics',
        email: 'dr.sengupta@biosync.ai',
        phone: '9876500008',
        password: doctorPasswordHash,
        role: 'doctor',
        licenseNumber: 'MCI-LONG-22190',
        hospitalAffiliation: 'BioSync Longevity & Vital Twins Institute',
        rating: 4.99,
        status: 'Active',
        currentLocation: { lat: 17.4440, lng: 78.3700, address: 'Hitec City Inorbit Wing', zone: 'Hitec City' },
      },
    ]);
    console.log(`Created ${doctors.length} Doctors.`);

    // ==========================================
    // 4. LAB ASSISTANTS / PHLEBOTOMISTS
    // ==========================================
    console.log('\nSeeding Phlebotomist Fleet & Lab Assistants...');
    const staffMembers = await LabAssistant.insertMany([
      {
        name: 'Ramesh Babu',
        phone: '9123456701',
        password: staffPasswordHash,
        employeeId: 'EMP001',
        gender: 'Male',
        bloodGroup: 'O+',
        backgroundVerified: true,
        drivingLicense: 'DL-TS09-2019-001234',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS09FA1234',
        assignedZones: ['Hitec City', 'Madhapur', 'Kondapur'],
        status: 'Available',
        shiftTiming: { start: '06:00 AM', end: '03:00 PM' },
        currentLocation: { lat: 17.4485, lng: 78.3768, heading: 90, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 45, urineContainers: 20, icePacks: 8 },
        performance: { totalCollectionsCompleted: 342, cancelledAppointments: 2, averageRating: 4.92 },
      },
      {
        name: 'Suresh Kumar',
        phone: '9123456702',
        password: staffPasswordHash,
        employeeId: 'EMP002',
        gender: 'Male',
        bloodGroup: 'B+',
        backgroundVerified: true,
        drivingLicense: 'DL-TS09-2020-005678',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS09FB5678',
        assignedZones: ['Gachibowli', 'Financial District', 'Nanakramguda'],
        status: 'Available',
        shiftTiming: { start: '06:30 AM', end: '03:30 PM' },
        currentLocation: { lat: 17.4390, lng: 78.3560, heading: 180, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 50, urineContainers: 25, icePacks: 10 },
        performance: { totalCollectionsCompleted: 289, cancelledAppointments: 1, averageRating: 4.88 },
      },
      {
        name: 'Deepa Krishnan',
        phone: '9123456703',
        password: staffPasswordHash,
        employeeId: 'EMP003',
        gender: 'Female',
        bloodGroup: 'A+',
        backgroundVerified: true,
        drivingLicense: 'DL-TS07-2018-009988',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS07EC4433',
        assignedZones: ['Jubilee Hills', 'Banjara Hills', 'Film Nagar'],
        status: 'On_Route',
        shiftTiming: { start: '07:00 AM', end: '04:00 PM' },
        currentLocation: { lat: 17.4280, lng: 78.4090, heading: 45, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 38, urineContainers: 18, icePacks: 6 },
        performance: { totalCollectionsCompleted: 412, cancelledAppointments: 3, averageRating: 4.96 },
      },
      {
        name: 'Mahesh Rao',
        phone: '9123456704',
        password: staffPasswordHash,
        employeeId: 'EMP004',
        gender: 'Male',
        bloodGroup: 'AB+',
        backgroundVerified: true,
        drivingLicense: 'DL-TS08-2021-003322',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS08EA9988',
        assignedZones: ['Kondapur', 'Kothaguda', 'Hafeezpet'],
        status: 'Collecting',
        shiftTiming: { start: '06:00 AM', end: '03:00 PM' },
        currentLocation: { lat: 17.4640, lng: 78.3580, heading: 270, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 30, urineContainers: 15, icePacks: 8 },
        performance: { totalCollectionsCompleted: 215, cancelledAppointments: 0, averageRating: 4.85 },
      },
      {
        name: 'Vijay Naidu',
        phone: '9123456705',
        password: staffPasswordHash,
        employeeId: 'EMP005',
        gender: 'Male',
        bloodGroup: 'O-',
        backgroundVerified: true,
        drivingLicense: 'DL-TS09-2022-007711',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS09GB7711',
        assignedZones: ['Kukatpally', 'Miyapur', 'Nizampet'],
        status: 'Available',
        shiftTiming: { start: '07:00 AM', end: '04:00 PM' },
        currentLocation: { lat: 17.4930, lng: 78.3980, heading: 120, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 60, urineContainers: 30, icePacks: 12 },
        performance: { totalCollectionsCompleted: 198, cancelledAppointments: 2, averageRating: 4.90 },
      },
      {
        name: 'Pooja Chawla',
        phone: '9123456706',
        password: staffPasswordHash,
        employeeId: 'EMP006',
        gender: 'Female',
        bloodGroup: 'B-',
        backgroundVerified: true,
        drivingLicense: 'DL-TS08-2020-001100',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS08FD1100',
        assignedZones: ['Begumpet', 'Somajiguda', 'Ameerpet'],
        status: 'Available',
        shiftTiming: { start: '07:30 AM', end: '04:30 PM' },
        currentLocation: { lat: 17.4440, lng: 78.4610, heading: 0, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 40, urineContainers: 20, icePacks: 8 },
        performance: { totalCollectionsCompleted: 350, cancelledAppointments: 1, averageRating: 4.94 },
      },
      {
        name: 'Karthik Subramanian',
        phone: '9123456707',
        password: staffPasswordHash,
        employeeId: 'EMP007',
        gender: 'Male',
        bloodGroup: 'A-',
        backgroundVerified: true,
        drivingLicense: 'DL-TS09-2021-002299',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS09HD2299',
        assignedZones: ['Hitec City', 'Madhapur'],
        status: 'Available',
        shiftTiming: { start: '06:00 AM', end: '03:00 PM' },
        currentLocation: { lat: 17.4450, lng: 78.3810, heading: 150, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 55, urineContainers: 25, icePacks: 10 },
        performance: { totalCollectionsCompleted: 275, cancelledAppointments: 1, averageRating: 4.89 },
      },
      {
        name: 'Anand Joshi',
        phone: '9123456708',
        password: staffPasswordHash,
        employeeId: 'EMP008',
        gender: 'Male',
        bloodGroup: 'O+',
        backgroundVerified: true,
        drivingLicense: 'DL-TS07-2019-006655',
        vehicleType: 'Four-Wheeler',
        vehicleNumber: 'TS07ED6655',
        assignedZones: ['Gachibowli', 'Nallagandla', 'Tellapur'],
        status: 'Available',
        shiftTiming: { start: '07:00 AM', end: '04:00 PM' },
        currentLocation: { lat: 17.4610, lng: 78.3180, heading: 300, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 100, urineContainers: 50, icePacks: 20 },
        performance: { totalCollectionsCompleted: 520, cancelledAppointments: 4, averageRating: 4.97 },
      },
      {
        name: 'Imran Khan',
        phone: '9123456709',
        password: staffPasswordHash,
        employeeId: 'EMP009',
        gender: 'Male',
        bloodGroup: 'B+',
        backgroundVerified: true,
        drivingLicense: 'DL-TS09-2022-003322',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS09HF3322',
        assignedZones: ['Jubilee Hills', 'Banjara Hills'],
        status: 'Off_Duty',
        shiftTiming: { start: '02:00 PM', end: '11:00 PM' },
        currentLocation: { lat: 17.4210, lng: 78.4350, heading: 220, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 35, urineContainers: 15, icePacks: 6 },
        performance: { totalCollectionsCompleted: 160, cancelledAppointments: 1, averageRating: 4.87 },
      },
      {
        name: 'Sandhya Pillai',
        phone: '9123456710',
        password: staffPasswordHash,
        employeeId: 'EMP010',
        gender: 'Female',
        bloodGroup: 'AB-',
        backgroundVerified: true,
        drivingLicense: 'DL-TS09-2021-008844',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS09JG8844',
        assignedZones: ['Secunderabad', 'Marredpally', 'Tarnaka'],
        status: 'Available',
        shiftTiming: { start: '06:30 AM', end: '03:30 PM' },
        currentLocation: { lat: 17.4410, lng: 78.5020, heading: 90, lastUpdated: new Date() },
        inventory: { bloodCollectionTubes: 45, urineContainers: 20, icePacks: 8 },
        performance: { totalCollectionsCompleted: 230, cancelledAppointments: 0, averageRating: 4.91 },
      },
    ]);
    console.log(`Created ${staffMembers.length} Phlebotomists.`);

    // ==========================================
    // 5. DIAGNOSTIC TEST CATALOG
    // ==========================================
    console.log('\nSeeding Comprehensive Diagnostic Test Catalog (25 Clinical Packages)...');
    const catalogData = [
      {
        testName: 'Complete Blood Count (CBC) with Differential',
        testCode: 'CBC-001',
        category: 'Hematology',
        pricing: { basePrice: 350, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'No fasting required. Maintain normal hydration.',
        fastingRequired: false,
        referenceRanges: [
          { biomarker: 'Hemoglobin', unit: 'g/dL', minNormal: 13.5, maxNormal: 17.5, genderSpecific: 'Male' },
          { biomarker: 'Hemoglobin', unit: 'g/dL', minNormal: 12.0, maxNormal: 15.5, genderSpecific: 'Female' },
          { biomarker: 'WBC Count', unit: '10^3/uL', minNormal: 4.5, maxNormal: 11.0, genderSpecific: 'All' },
          { biomarker: 'Platelet Count', unit: '10^3/uL', minNormal: 150, maxNormal: 450, genderSpecific: 'All' },
          { biomarker: 'RBC Count', unit: '10^6/uL', minNormal: 4.5, maxNormal: 5.9, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Lipid Profile - Advanced Cardiovascular Fractions',
        testCode: 'LIPID-002',
        category: 'Cardiovascular',
        pricing: { basePrice: 650, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: '10-12 hours overnight fasting required. Water permitted.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'Total Cholesterol', unit: 'mg/dL', minNormal: 125, maxNormal: 200, genderSpecific: 'All' },
          { biomarker: 'HDL Cholesterol', unit: 'mg/dL', minNormal: 40, maxNormal: 60, genderSpecific: 'Male' },
          { biomarker: 'HDL Cholesterol', unit: 'mg/dL', minNormal: 50, maxNormal: 70, genderSpecific: 'Female' },
          { biomarker: 'LDL Cholesterol', unit: 'mg/dL', minNormal: 0, maxNormal: 100, genderSpecific: 'All' },
          { biomarker: 'Triglycerides', unit: 'mg/dL', minNormal: 0, maxNormal: 150, genderSpecific: 'All' },
          { biomarker: 'ApoB/ApoA1 Ratio', unit: 'ratio', minNormal: 0.35, maxNormal: 0.8, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Comprehensive Metabolic Panel (CMP-14)',
        testCode: 'CMP-003',
        category: 'Biochemistry',
        pricing: { basePrice: 850, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: '10 hours fasting required. Drink ample water.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'Fasting Glucose', unit: 'mg/dL', minNormal: 70, maxNormal: 99, genderSpecific: 'All' },
          { biomarker: 'Serum Calcium', unit: 'mg/dL', minNormal: 8.6, maxNormal: 10.2, genderSpecific: 'All' },
          { biomarker: 'Total Protein', unit: 'g/dL', minNormal: 6.4, maxNormal: 8.3, genderSpecific: 'All' },
          { biomarker: 'Serum Albumin', unit: 'g/dL', minNormal: 3.5, maxNormal: 5.0, genderSpecific: 'All' },
          { biomarker: 'Serum Creatinine', unit: 'mg/dL', minNormal: 0.7, maxNormal: 1.3, genderSpecific: 'Male' },
          { biomarker: 'eGFR', unit: 'mL/min/1.73m2', minNormal: 90, maxNormal: 130, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'HbA1c Glycated Hemoglobin & Glycemic Twin Calibration',
        testCode: 'HBA1C-004',
        category: 'Diabetology',
        pricing: { basePrice: 500, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Non-fasting. Reflects 3-month average plasma glucose.',
        fastingRequired: false,
        referenceRanges: [
          { biomarker: 'HbA1c', unit: '%', minNormal: 4.0, maxNormal: 5.6, genderSpecific: 'All' },
          { biomarker: 'Estimated Average Glucose', unit: 'mg/dL', minNormal: 68, maxNormal: 114, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Thyroid Stimulating Panel (Total T3, Total T4, TSH Ultrasensitive)',
        testCode: 'THYROID-005',
        category: 'Endocrinology',
        pricing: { basePrice: 550, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Morning sample preferred before taking thyroid hormone medications.',
        fastingRequired: false,
        referenceRanges: [
          { biomarker: 'TSH Ultrasensitive', unit: 'uIU/mL', minNormal: 0.4, maxNormal: 4.2, genderSpecific: 'All' },
          { biomarker: 'Total T3', unit: 'ng/dL', minNormal: 80, maxNormal: 200, genderSpecific: 'All' },
          { biomarker: 'Total T4', unit: 'ug/dL', minNormal: 4.5, maxNormal: 12.0, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Liver Function Test (LFT Extended)',
        testCode: 'LFT-006',
        category: 'Hepatology',
        pricing: { basePrice: 600, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: '8 hours fasting recommended. Avoid alcohol for 24 hours prior.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'SGOT / AST', unit: 'U/L', minNormal: 10, maxNormal: 40, genderSpecific: 'All' },
          { biomarker: 'SGPT / ALT', unit: 'U/L', minNormal: 7, maxNormal: 56, genderSpecific: 'All' },
          { biomarker: 'Serum Bilirubin Total', unit: 'mg/dL', minNormal: 0.2, maxNormal: 1.2, genderSpecific: 'All' },
          { biomarker: 'Alkaline Phosphatase (ALP)', unit: 'U/L', minNormal: 44, maxNormal: 147, genderSpecific: 'All' },
          { biomarker: 'GGT', unit: 'U/L', minNormal: 9, maxNormal: 48, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Renal / Kidney Function Test (KFT / RFT)',
        testCode: 'KFT-007',
        category: 'Nephrology',
        pricing: { basePrice: 550, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Stay hydrated with plain water. 8 hours fasting.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', minNormal: 7, maxNormal: 20, genderSpecific: 'All' },
          { biomarker: 'Serum Creatinine', unit: 'mg/dL', minNormal: 0.7, maxNormal: 1.3, genderSpecific: 'All' },
          { biomarker: 'Serum Uric Acid', unit: 'mg/dL', minNormal: 3.5, maxNormal: 7.2, genderSpecific: 'Male' },
          { biomarker: 'Serum Uric Acid', unit: 'mg/dL', minNormal: 2.6, maxNormal: 6.0, genderSpecific: 'Female' },
          { biomarker: 'Sodium', unit: 'mEq/L', minNormal: 136, maxNormal: 145, genderSpecific: 'All' },
          { biomarker: 'Potassium', unit: 'mEq/L', minNormal: 3.5, maxNormal: 5.1, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Vitamin D3 (25-OH) & Vitamin B12 Vital Duo',
        testCode: 'VIT-008',
        category: 'Micronutrients',
        pricing: { basePrice: 950, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'No fasting required. Can be done anytime.',
        fastingRequired: false,
        referenceRanges: [
          { biomarker: '25-Hydroxy Vitamin D', unit: 'ng/mL', minNormal: 30.0, maxNormal: 100.0, genderSpecific: 'All' },
          { biomarker: 'Vitamin B12', unit: 'pg/mL', minNormal: 211, maxNormal: 911, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Cardiac Biomarker Risk Matrix (hs-CRP, Troponin I, Homocysteine)',
        testCode: 'CARD-009',
        category: 'Cardiovascular',
        pricing: { basePrice: 1450, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: '10-12 hours overnight fasting. Avoid strenuous exercise 24 hrs prior.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'High-Sensitivity CRP (hs-CRP)', unit: 'mg/L', minNormal: 0.0, maxNormal: 1.0, genderSpecific: 'All' },
          { biomarker: 'hs-Troponin I', unit: 'ng/mL', minNormal: 0.0, maxNormal: 0.04, genderSpecific: 'All' },
          { biomarker: 'Homocysteine', unit: 'umol/L', minNormal: 5.0, maxNormal: 15.0, genderSpecific: 'All' },
          { biomarker: 'Lipoprotein(a)', unit: 'mg/dL', minNormal: 0.0, maxNormal: 30.0, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Full Body Longevity & Biological Age Assessment',
        testCode: 'LONG-010',
        category: 'Longevity Medicine',
        pricing: { basePrice: 2499, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: '12 hours strict overnight fasting. Water encouraged. Avoid smoking and alcohol 48 hours.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'Biological Longevity Score', unit: 'years', minNormal: 20, maxNormal: 80, genderSpecific: 'All' },
          { biomarker: 'HOMA-IR Insulin Resistance', unit: 'index', minNormal: 0.5, maxNormal: 1.9, genderSpecific: 'All' },
          { biomarker: 'ApoB', unit: 'mg/dL', minNormal: 40, maxNormal: 90, genderSpecific: 'All' },
          { biomarker: 'hs-CRP', unit: 'mg/L', minNormal: 0.0, maxNormal: 0.8, genderSpecific: 'All' },
          { biomarker: 'Ferritin', unit: 'ng/mL', minNormal: 30, maxNormal: 250, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Complete Urinalysis & Microalbuminuria Screen',
        testCode: 'URI-011',
        category: 'Renal & Urology',
        pricing: { basePrice: 250, taxPercentage: 5 },
        sampleType: 'Urine',
        preparationInstructions: 'Mid-stream early morning clean-catch urine specimen.',
        fastingRequired: false,
        referenceRanges: [
          { biomarker: 'Specific Gravity', unit: 'ratio', minNormal: 1.005, maxNormal: 1.030, genderSpecific: 'All' },
          { biomarker: 'Urine pH', unit: 'pH', minNormal: 5.0, maxNormal: 7.5, genderSpecific: 'All' },
          { biomarker: 'Microalbumin/Creatinine Ratio', unit: 'mg/g', minNormal: 0, maxNormal: 30, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Iron Deficiency & Anemia Profile (Ferritin, Iron, TIBC)',
        testCode: 'IRON-012',
        category: 'Hematology',
        pricing: { basePrice: 750, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: '8 hours fasting. Morning draw preferred before iron pills.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'Serum Ferritin', unit: 'ng/mL', minNormal: 30, maxNormal: 300, genderSpecific: 'Male' },
          { biomarker: 'Serum Ferritin', unit: 'ng/mL', minNormal: 15, maxNormal: 200, genderSpecific: 'Female' },
          { biomarker: 'Total Iron Binding Capacity (TIBC)', unit: 'ug/dL', minNormal: 240, maxNormal: 450, genderSpecific: 'All' },
          { biomarker: 'Transferrin Saturation', unit: '%', minNormal: 20, maxNormal: 50, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Hormonal Health & Total / Free Testosterone Matrix',
        testCode: 'HORM-013',
        category: 'Endocrinology',
        pricing: { basePrice: 1200, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Early morning draw between 7 AM - 9 AM for peak hormonal fidelity.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'Total Testosterone', unit: 'ng/dL', minNormal: 300, maxNormal: 1000, genderSpecific: 'Male' },
          { biomarker: 'Free Testosterone', unit: 'pg/mL', minNormal: 47, maxNormal: 244, genderSpecific: 'Male' },
          { biomarker: 'DHEA-S', unit: 'ug/dL', minNormal: 80, maxNormal: 560, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Continuous Glucose Monitoring (CGM) Calibration Panel',
        testCode: 'CGM-014',
        category: 'Metabolic Twin',
        pricing: { basePrice: 499, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Fasting and immediate post-prandial cross-reference.',
        fastingRequired: true,
        referenceRanges: [
          { biomarker: 'Laboratory Capillary Glucose', unit: 'mg/dL', minNormal: 70, maxNormal: 140, genderSpecific: 'All' },
          { biomarker: 'Sensor Bias Calibration Delta', unit: 'mg/dL', minNormal: -15, maxNormal: 15, genderSpecific: 'All' },
        ],
        isActive: true,
      },
      {
        testName: 'Comprehensive Food Allergy & IgE Panel (30 Allergens)',
        testCode: 'ALLERG-015',
        category: 'Immunology',
        pricing: { basePrice: 3200, taxPercentage: 5 },
        sampleType: 'Blood',
        preparationInstructions: 'Discontinue antihistamines 48 hours prior if approved by doctor.',
        fastingRequired: false,
        referenceRanges: [
          { biomarker: 'Total IgE', unit: 'kU/L', minNormal: 0, maxNormal: 100, genderSpecific: 'All' },
        ],
        isActive: true,
      },
    ];

    const catalog = await TestCatalog.insertMany(catalogData);
    console.log(`Created ${catalog.length} Diagnostic Catalog Packages.`);

    // ==========================================
    // 6. PATIENT USERS (30 Profiles)
    // ==========================================
    console.log('\nSeeding 30 Diverse Patient Profiles with Full Clinical Context...');
    const patientSeedData = [
      {
        phoneNumber: '9876512345', // Primary Test Patient (Priya Sharma)
        firstName: 'Priya',
        lastName: 'Sharma',
        dateOfBirth: new Date('1997-04-12'),
        gender: 'Female',
        bloodGroup: 'A+',
        lifestyle: { dietPreference: 'Veg', smokingHabit: 'Non-smoker', alcoholConsumption: 'None', activityLevel: 'Active' },
        address: { houseNumber: 'Flat 402, Cyber Heights', street: 'Hitec City Main Road', landmark: 'Opposite Cyber Towers', city: 'Hyderabad', state: 'Telangana', pincode: '500081', coordinates: { lat: 17.4485, lng: 78.3768 } },
        vitalsStatus: 'Lab_Verified',
        emergencyContact: { name: 'Anil Sharma', relation: 'Father', phoneNumber: '9876599991' },
      },
      {
        phoneNumber: '9876543210', // Rahul Verma (Diabetic focus)
        firstName: 'Rahul',
        lastName: 'Verma',
        dateOfBirth: new Date('1984-08-22'),
        gender: 'Male',
        bloodGroup: 'B+',
        lifestyle: { dietPreference: 'Non-Veg', smokingHabit: 'Non-smoker', alcoholConsumption: 'Occasional', activityLevel: 'Sedentary' },
        address: { houseNumber: 'Villa 12, Gachibowli Woods', street: 'Old Mumbai Highway', landmark: 'Near Bio-Diversity Park', city: 'Hyderabad', state: 'Telangana', pincode: '500032', coordinates: { lat: 17.4390, lng: 78.3560 } },
        vitalsStatus: 'Lab_Verified',
        emergencyContact: { name: 'Sunita Verma', relation: 'Spouse', phoneNumber: '9876599992' },
      },
      {
        phoneNumber: '9123456789', // Sneha Reddy (Hypertension focus)
        firstName: 'Sneha',
        lastName: 'Reddy',
        dateOfBirth: new Date('1990-11-05'),
        gender: 'Female',
        bloodGroup: 'O+',
        lifestyle: { dietPreference: 'Veg', smokingHabit: 'Non-smoker', alcoholConsumption: 'None', activityLevel: 'Moderately Active' },
        address: { houseNumber: 'Plot 88, Road No. 36', street: 'Jubilee Hills', landmark: 'Near Peddamma Temple', city: 'Hyderabad', state: 'Telangana', pincode: '500033', coordinates: { lat: 17.4280, lng: 78.4090 } },
        vitalsStatus: 'Lab_Verified',
        emergencyContact: { name: 'Karthik Reddy', relation: 'Brother', phoneNumber: '9876599993' },
      },
      {
        phoneNumber: '9820011223', // Vikram Patel (Longevity focus)
        firstName: 'Vikram',
        lastName: 'Patel',
        dateOfBirth: new Date('1978-02-14'),
        gender: 'Male',
        bloodGroup: 'AB+',
        lifestyle: { dietPreference: 'Vegan', smokingHabit: 'Non-smoker', alcoholConsumption: 'None', activityLevel: 'Very Active' },
        address: { houseNumber: 'Penthouse 14, White Waters', street: 'Kondapur Botanical Road', landmark: 'Botanical Gardens', city: 'Hyderabad', state: 'Telangana', pincode: '500084', coordinates: { lat: 17.4640, lng: 78.3580 } },
        vitalsStatus: 'Lab_Verified',
        emergencyContact: { name: 'Pooja Patel', relation: 'Spouse', phoneNumber: '9876599994' },
      },
      {
        phoneNumber: '9711002233', // Ananya Sen (Thyroid focus)
        firstName: 'Ananya',
        lastName: 'Sen',
        dateOfBirth: new Date('1993-06-30'),
        gender: 'Female',
        bloodGroup: 'B-',
        lifestyle: { dietPreference: 'Veg', smokingHabit: 'Non-smoker', alcoholConsumption: 'None', activityLevel: 'Sedentary' },
        address: { houseNumber: 'Flat 204, Fortune Towers', street: 'Madhapur 100ft Road', landmark: 'Ayyappa Society', city: 'Hyderabad', state: 'Telangana', pincode: '500081', coordinates: { lat: 17.4410, lng: 78.3880 } },
        vitalsStatus: 'Lab_Verified',
        emergencyContact: { name: 'Sourav Sen', relation: 'Brother', phoneNumber: '9876599995' },
      },
      {
        phoneNumber: '9988776655', // Arjun Nair (Cardiovascular risk)
        firstName: 'Arjun',
        lastName: 'Nair',
        dateOfBirth: new Date('1971-09-18'),
        gender: 'Male',
        bloodGroup: 'O-',
        lifestyle: { dietPreference: 'Non-Veg', smokingHabit: 'Regular', alcoholConsumption: 'Occasional', activityLevel: 'Light Activity' },
        address: { houseNumber: 'House 55, Road 10', street: 'Banjara Hills', landmark: 'Near City Center Mall', city: 'Hyderabad', state: 'Telangana', pincode: '500034', coordinates: { lat: 17.4210, lng: 78.4350 } },
        vitalsStatus: 'Lab_Verified',
        emergencyContact: { name: 'Malini Nair', relation: 'Spouse', phoneNumber: '9876599996' },
      },
      {
        phoneNumber: '9812345678',
        firstName: 'Kavita',
        lastName: 'Iyer',
        dateOfBirth: new Date('1988-12-10'),
        gender: 'Female',
        bloodGroup: 'A-',
        lifestyle: { dietPreference: 'Veg', smokingHabit: 'Non-smoker', alcoholConsumption: 'None', activityLevel: 'Active' },
        address: { houseNumber: '401, SMR Vinay', street: 'Miyapur Main Road', landmark: 'Miyapur Metro', city: 'Hyderabad', state: 'Telangana', pincode: '500049', coordinates: { lat: 17.4960, lng: 78.3580 } },
        vitalsStatus: 'Manual',
      },
      {
        phoneNumber: '9823456789',
        firstName: 'Manish',
        lastName: 'Gupta',
        dateOfBirth: new Date('1982-05-15'),
        gender: 'Male',
        bloodGroup: 'B+',
        lifestyle: { dietPreference: 'Non-Veg', smokingHabit: 'Occasional', alcoholConsumption: 'Regular', activityLevel: 'Sedentary' },
        address: { houseNumber: '302, Green Meadows', street: 'Kukatpally Housing Board', landmark: 'KPHB 5th Phase', city: 'Hyderabad', state: 'Telangana', pincode: '500072', coordinates: { lat: 17.4870, lng: 78.3960 } },
        vitalsStatus: 'Lab_Verified',
      },
      {
        phoneNumber: '9834567890',
        firstName: 'Deepa',
        lastName: 'Menon',
        dateOfBirth: new Date('1995-03-24'),
        gender: 'Female',
        bloodGroup: 'AB-',
        lifestyle: { dietPreference: 'Veg', smokingHabit: 'Non-smoker', alcoholConsumption: 'None', activityLevel: 'Active' },
        address: { houseNumber: 'B-12, Mayfair Palm', street: 'Financial District', landmark: 'WaveRock SEZ', city: 'Hyderabad', state: 'Telangana', pincode: '500032', coordinates: { lat: 17.4160, lng: 78.3420 } },
        vitalsStatus: 'Lab_Verified',
      },
      {
        phoneNumber: '9845678901',
        firstName: 'Rajesh',
        lastName: 'Varma',
        dateOfBirth: new Date('1965-07-08'),
        gender: 'Male',
        bloodGroup: 'O+',
        lifestyle: { dietPreference: 'Non-Veg', smokingHabit: 'Non-smoker', alcoholConsumption: 'None', activityLevel: 'Light Activity' },
        address: { houseNumber: '104, Royal Palms', street: 'Somajiguda', landmark: 'Near Raj Bhavan', city: 'Hyderabad', state: 'Telangana', pincode: '500082', coordinates: { lat: 17.4260, lng: 78.4590 } },
        vitalsStatus: 'Lab_Verified',
      },
      {
        phoneNumber: '9856789012',
        firstName: 'Pooja',
        lastName: 'Joshi',
        dateOfBirth: new Date('1999-10-14'),
        gender: 'Female',
        bloodGroup: 'A+',
        lifestyle: { dietPreference: 'Vegan', smokingHabit: 'Non-smoker', alcoholConsumption: 'Occasional', activityLevel: 'Very Active' },
        address: { houseNumber: '702, My Home Bhooja', street: 'Silpa Gram Craft Village', landmark: 'Knowledge City', city: 'Hyderabad', state: 'Telangana', pincode: '500081', coordinates: { lat: 17.4420, lng: 78.3840 } },
        vitalsStatus: 'PDF_Scanned',
      },
      {
        phoneNumber: '9867890123',
        firstName: 'Aditya',
        lastName: 'Roy',
        dateOfBirth: new Date('1991-01-28'),
        gender: 'Male',
        bloodGroup: 'B-',
        lifestyle: { dietPreference: 'Non-Veg', smokingHabit: 'Regular', alcoholConsumption: 'Occasional', activityLevel: 'Active' },
        address: { houseNumber: '12-A, Jayabheri Pine Valley', street: 'Gachibowli Outer Ring', landmark: 'ORR Junction', city: 'Hyderabad', state: 'Telangana', pincode: '500032', coordinates: { lat: 17.4430, lng: 78.3610 } },
        vitalsStatus: 'Lab_Verified',
      },
    ];

    // Add 18 more patients to bring total to 30
    const additionalNames = [
      ['Sunita', 'Das', 'Female', 'O+', 'Veg'],
      ['Amit', 'Trivedi', 'Male', 'A+', 'Non-Veg'],
      ['Megha', 'Bansal', 'Female', 'B+', 'Veg'],
      ['Naveen', 'Choudhary', 'Male', 'AB+', 'Non-Veg'],
      ['Swati', 'Deshpande', 'Female', 'O-', 'Veg'],
      ['Varun', 'Kapoor', 'Male', 'B-', 'Non-Veg'],
      ['Divya', 'Srinivasan', 'Female', 'A+', 'Veg'],
      ['Kiran', 'Mehta', 'Male', 'O+', 'Non-Veg'],
      ['Ritu', 'Agarwal', 'Female', 'B+', 'Veg'],
      ['Gaurav', 'Saxena', 'Male', 'A-', 'Non-Veg'],
      ['Shweta', 'Kulkarni', 'Female', 'AB-', 'Veg'],
      ['Nikhil', 'Bhatia', 'Male', 'O+', 'Non-Veg'],
      ['Pallavi', 'Rao', 'Female', 'A+', 'Veg'],
      ['Harish', 'Reddy', 'Male', 'B+', 'Non-Veg'],
      ['Shruti', 'Narayan', 'Female', 'O-', 'Veg'],
      ['Ashwin', 'Nambiar', 'Male', 'AB+', 'Non-Veg'],
      ['Preeti', 'Malhotra', 'Female', 'A-', 'Veg'],
      ['Siddharth', 'Jain', 'Male', 'B-', 'Non-Veg'],
    ];

    additionalNames.forEach(([first, last, gender, bg, diet], idx) => {
      const phoneNum = `98900${String(10000 + idx).slice(-5)}`;
      patientSeedData.push({
        phoneNumber: phoneNum,
        firstName: first,
        lastName: last,
        dateOfBirth: new Date(1975 + (idx * 2), (idx % 12), 10 + (idx % 15)),
        gender,
        bloodGroup: bg,
        lifestyle: { dietPreference: diet, smokingHabit: 'Non-smoker', alcoholConsumption: 'None', activityLevel: 'Active' },
        address: {
          houseNumber: `${100 + idx}, Tower ${String.fromCharCode(65 + (idx % 6))}`,
          street: 'Aparna CyberLife Road',
          landmark: 'Nallagandla Flyover',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500019',
          coordinates: { lat: 17.4720 + (idx * 0.003), lng: 78.3150 + (idx * 0.004) },
        },
        vitalsStatus: idx % 3 === 0 ? 'Lab_Verified' : (idx % 3 === 1 ? 'Manual' : 'PDF_Scanned'),
      });
    });

    const users = await User.insertMany(patientSeedData);
    console.log(`Created ${users.length} Patients.`);

    // ==========================================
    // 7. COMPREHENSIVE VITALS & LONGITUDINAL BIOMARKERS (100+ Records)
    // ==========================================
    console.log('\nSeeding 100+ Longitudinal Vitals Records across Historical Timelines...');
    const vitalsDocs = [];
    const now = Date.now();
    const dayMs = 86400000;

    users.forEach((u, uIdx) => {
      // Create 3 to 5 chronological vitals records per patient (e.g., 90 days ago, 60 days ago, 30 days ago, today)
      const recordCount = uIdx < 5 ? 5 : 3;

      for (let r = 0; r < recordCount; r++) {
        const recordDate = new Date(now - (recordCount - 1 - r) * 25 * dayMs);
        const isLatest = r === recordCount - 1;

        // Realistic variations based on patient index
        const isDiabetic = u.phoneNumber === '9876543210' || uIdx === 7;
        const isHypertensive = u.phoneNumber === '9123456789' || uIdx === 5;
        const isAcuteCrisis = isHypertensive && r === 2; // Simulate a past critical hypertensive crisis alert

        const sbp = isAcuteCrisis ? 186 : (isHypertensive ? 144 - (r * 4) : 118 + (uIdx % 8));
        const dbp = isAcuteCrisis ? 122 : (isHypertensive ? 94 - (r * 2) : 76 + (uIdx % 6));
        const fastingGluc = isDiabetic ? 185 - (r * 15) : 88 + (uIdx % 10);
        const hba1c = isDiabetic ? 8.4 - (r * 0.4) : 5.2 + ((uIdx % 5) * 0.1);
        const restingHr = 64 + (uIdx % 12);
        const spO2 = 98 - (uIdx % 2);

        vitalsDocs.push({
          user: u._id,
          source: isLatest ? 'Lab_Assistant' : (r % 2 === 0 ? 'Wearable_Sync' : 'Lab_Assistant'),
          bodyMetrics: {
            heightCm: 168 + (uIdx % 15),
            weightKg: 68 + (uIdx % 20) - (r * 0.5),
            bmi: 23.5,
            bodyFatPercentage: 21.0 - (r * 0.3),
            visceralFatIndex: 7,
            waterPercentage: 58.0,
            measurements: { waistCm: 82 - (r * 0.5), hipCm: 98, neckCm: 37, waistToHipRatio: 0.83, waistToHeightRatio: 0.48 },
          },
          continuousMetrics: {
            restingHeartRate: restingHr,
            hrv: 58 + (r * 2),
            vo2Max: 44.5,
            oxygenSaturationSpO2: spO2,
            basalBodyTemperatureF: 98.4,
            respirationRate: 15,
            sleepStaging: { deepSleepMinutes: 110, remSleepMinutes: 95, lightSleepMinutes: 240, awakeMinutes: 25 },
            dailyStepCount: 9400 + (r * 300),
            activeCaloriesBurned: 520,
          },
          metabolicHealth: {
            glucoseFasting: fastingGluc,
            glucosePostPrandial: fastingGluc + 35,
            hba1c: hba1c,
            fastingInsulin: isDiabetic ? 18.5 : 7.2,
            homaIR: isDiabetic ? 3.8 : 1.4,
            estimatedAvgGlucose: (28.7 * hba1c) - 46.7,
            bloodKetones: 0.3,
          },
          cardiovascularRisk: {
            systolic: sbp,
            diastolic: dbp,
            meanArterialPressure: Math.round(dbp + (sbp - dbp) / 3),
            pulsePressure: sbp - dbp,
            totalCholesterol: 182 - (r * 5),
            ldlCholesterol: 104 - (r * 4),
            hdlCholesterol: 54 + (r * 1),
            vldlCholesterol: 24,
            triglycerides: 130 - (r * 6),
            apolipoproteinB: 82,
            apolipoproteinA1: 145,
            hsTroponinI: isAcuteCrisis ? 0.048 : 0.012,
            homocysteine: 9.8,
          },
          hematology: {
            hemoglobin: 14.2,
            hematocrit: 42.5,
            rbc: 4.8,
            wbc: 6.8,
            platelets: 240,
            neutrophilsPercent: 60,
            lymphocytesPercent: 32,
            monocytesPercent: 5,
            eosinophilsPercent: 2,
            basophilsPercent: 1,
          },
          organFunction: {
            astSgot: 24,
            altSgpt: 28,
            totalBilirubin: 0.8,
            creatinine: 0.95,
            egfr: 104,
            bun: 14,
            uricAcid: 5.2,
            electrolytes: { sodium: 140, potassium: 4.4, chloride: 102, bicarbonate: 24, anionGap: 14 },
          },
          micronutrients: {
            calciumTotal: 9.4,
            vitaminD3: 38 + (r * 4),
            vitaminB12: 520 + (r * 30),
            ferritin: 110,
            ironTotal: 95,
            magnesium: 2.2,
          },
          aiCalculatedScores: {
            biologicalAge: Math.max(20, (new Date().getFullYear() - u.dateOfBirth.getFullYear()) - (r * 0.8)),
            phenotypicAgeDelta: -2.4 - (r * 0.3),
            framinghamRiskScore: 3.2,
            metabolicSyndromeScore: isDiabetic ? 68 : 18,
          },
          kalmanCalibration: {
            calibratedAt: recordDate,
            betaCarb: 0.44 - (r * 0.02),
            betaSodium: 0.12,
            insulinSensitivity: 1.15 + (r * 0.05),
            parameterShiftsPercent: { betaCarbShift: -4.5, betaSodiumShift: 0.0, insulinSensitivityShift: +6.2 },
          },
          isInitialBaseline: r === 0,
          isVerifiedByUser: true,
          recordedAt: recordDate,
          criticalAlertTriggered: isAcuteCrisis,
          criticalAlertDetails: isAcuteCrisis ? [
            { biomarker: 'Hypertensive Crisis (BP)', recordedValue: sbp, severity: 'Critical', status: 'Doctor_Notified' },
            { biomarker: 'Elevated hs-Troponin I (Myocardial Strain)', recordedValue: 0.048, severity: 'Critical', status: 'Doctor_Notified' }
          ] : [],
        });
      }
    });

    const vitals = await Vitals.insertMany(vitalsDocs);
    console.log(`Created ${vitals.length} Vitals & Biomarker History records.`);

    // ==========================================
    // 8. APPOINTMENTS (80 Realistic Bookings across 8-Stage Lifecycle)
    // ==========================================
    console.log('\nSeeding 80 Appointments Across Complete Field Lifecycle & Exception States...');
    const appointmentStages = [
      'Booked',
      'Pending',
      'Assistant_Assigned',
      'On_The_Way',
      'Arrived',
      'Collecting',
      'Sample_Collected',
      'At_Laboratory',
      'Processing',
      'Report_Generated',
      'Completed',
      'Cancelled',
    ];

    const timeSlots = [
      '06:30 - 07:30 AM',
      '07:30 - 08:30 AM',
      '08:30 - 09:30 AM',
      '09:30 - 10:30 AM',
      '10:30 - 11:30 AM',
      '11:30 - 12:30 PM',
      '04:00 - 05:00 PM',
      '05:00 - 06:00 PM',
    ];

    const appointmentsToInsert = [];
    let apptCounter = 1000;

    for (let i = 0; i < 80; i++) {
      apptCounter++;
      const patient = users[i % users.length];
      const selectedTest = catalog[i % catalog.length];
      const assignedStaff = staffMembers[i % staffMembers.length];
      const assignedDoctor = doctors[i % doctors.length];
      const stage = appointmentStages[i % appointmentStages.length];
      const isPast = stage === 'Completed' || stage === 'Report_Generated' || stage === 'Cancelled';
      const scheduledOffsetDays = isPast ? -((i % 20) + 1) : (i % 5);
      const scheduledDate = new Date(now + (scheduledOffsetDays * dayMs));

      const otp = String(100000 + (apptCounter % 900000));
      const isPaid = i % 4 !== 0;

      appointmentsToInsert.push({
        user: patient._id,
        appointmentType: 'Lab_Collection',
        testCatalog: selectedTest._id,
        labAssistant: assignedStaff._id,
        doctor: assignedDoctor._id,
        scheduledDate,
        timeSlot: timeSlots[i % timeSlots.length],
        preparationInstructions: selectedTest.preparationInstructions,
        status: stage,
        collectionOTP: otp,
        address: patient.address,
        paymentDetails: {
          isPaid,
          amount: selectedTest.pricing.basePrice,
          method: isPaid ? (i % 2 === 0 ? 'UPI' : 'Card') : 'None',
          collectedAt: isPaid ? new Date(scheduledDate.getTime() - 3600000) : null,
          collectedBy: isPaid ? assignedStaff._id : null,
        },
        clinicalIntake: {
          vitals: {
            systolic: 120 + (i % 20),
            diastolic: 80 + (i % 10),
            pulse: 72 + (i % 8),
            spO2: 98,
            temperatureF: 98.4,
            heightCm: patient.address?.coordinates?.lat ? 172 : 165,
            weightKg: 70 + (i % 15),
          },
          preScreening: {
            fastingObserved: selectedTest.fastingRequired,
            fastingDurationHours: selectedTest.fastingRequired ? 10 : 2,
            activeSymptoms: i % 5 === 0 ? 'Mild fatigue and occasional headache' : 'None',
            phlebotomistObservations: 'Veins patent and accessible. Standard aseptic venipuncture executed cleanly.',
          },
        },
        specimens: {
          blood: {
            collected: ['Collecting', 'Sample_Collected', 'At_Laboratory', 'Processing', 'Report_Generated', 'Completed'].includes(stage),
            tubesCount: 3,
            barcode: `BC-BLD-${apptCounter}`,
          },
          urine: {
            collected: selectedTest.sampleType === 'Urine' || (i % 3 === 0),
            barcode: `BC-URN-${apptCounter}`,
          },
          coldChainSecured: true,
        },
        exceptionType: stage === 'Cancelled' ? (i % 2 === 0 ? 'Patient_Not_Fasting' : 'Vein_Collapse_Difficult_Draw') : 'None',
        cancellationReason: stage === 'Cancelled' ? 'Patient reported breakfast consumption prior to lipid panel fasting requirement' : null,
        trackingLogs: [
          { status: 'Booked', timestamp: new Date(scheduledDate.getTime() - 86400000), notes: 'Booking confirmed via BioSync Mobile App' },
          { status: 'Assistant_Assigned', timestamp: new Date(scheduledDate.getTime() - 43200000), notes: `Phlebotomist ${assignedStaff.name} assigned via dispatch routing` },
          ...(stage !== 'Booked' && stage !== 'Pending' ? [
            { status: 'On_The_Way', timestamp: new Date(scheduledDate.getTime() - 1800000), notes: 'Phlebotomist dispatched on vehicle TS09FA1234' },
          ] : []),
          ...(stage === 'Arrived' || ['Collecting', 'Sample_Collected', 'At_Laboratory', 'Processing', 'Report_Generated', 'Completed'].includes(stage) ? [
            { status: 'Arrived', timestamp: new Date(scheduledDate.getTime() - 300000), notes: 'Phlebotomist arrived at patient doorstep' },
          ] : []),
        ],
      });
    }

    const appointments = await Appointment.insertMany(appointmentsToInsert);
    console.log(`Created ${appointments.length} Appointments.`);

    // ==========================================
    // 9. DIAGNOSTIC SAMPLES & CLINICAL LAB RESULTS (80 Samples)
    // ==========================================
    console.log('\nSeeding 80 Diagnostic Laboratory Samples with Verified Telemetry...');
    const samplesToInsert = [];

    appointments.forEach((appt, sIdx) => {
      const selectedTest = catalog[sIdx % catalog.length];
      const assignedDoctor = doctors[sIdx % doctors.length];
      const assignedStaff = staffMembers[sIdx % staffMembers.length];
      const barcode = `BC-SAMP-${1000 + sIdx}`;

      const isCompleted = appt.status === 'Completed' || appt.status === 'Report_Generated';
      const isProcessing = appt.status === 'Processing';
      const isLab = appt.status === 'At_Laboratory';
      const isTransit = appt.status === 'Sample_Collected';

      let sampleStatus = 'Requested';
      if (isCompleted) sampleStatus = 'Report_Generated';
      else if (isProcessing) sampleStatus = 'Processing';
      else if (isLab) sampleStatus = 'At_Laboratory';
      else if (isTransit) sampleStatus = 'Sample_Collected';
      else if (appt.status === 'Collecting') sampleStatus = 'Assigned';

      samplesToInsert.push({
        user: appt.user,
        appointment: appt._id,
        testCatalog: selectedTest._id,
        labAssistant: assignedStaff._id,
        doctor: assignedDoctor._id,
        barcode,
        status: sampleStatus,
        resultsDone: isCompleted,
        resultsStatus: isCompleted ? 'Results Ready' : (isProcessing ? 'Results Entered' : 'Res yet to be obtained'),
        collectionTime: new Date(appt.scheduledDate.getTime() + 1800000),
        labProcessingStartTime: isProcessing || isCompleted ? new Date(appt.scheduledDate.getTime() + 7200000) : null,
        reportGenerationTime: isCompleted ? new Date(appt.scheduledDate.getTime() + 14400000) : null,
        turnaroundTimeHours: isCompleted ? 3.8 : null,
        resultPdfUrl: isCompleted ? `/api/reports/download/${appt._id}` : null,
        specimens: {
          blood: { collected: true, barcode: `BLD-${barcode}` },
          urine: { collected: true, barcode: `URN-${barcode}` },
        },
        structuredResults: [
          { biomarker: 'Fasting Blood Glucose', value: 92 + (sIdx % 25), isCritical: false },
          { biomarker: 'HbA1c', value: 5.4 + ((sIdx % 10) * 0.1), isCritical: false },
          { biomarker: 'Total Cholesterol', value: 178 + (sIdx % 30), isCritical: false },
          { biomarker: 'Serum Creatinine', value: 0.9 + ((sIdx % 5) * 0.1), isCritical: false },
        ],
        testResults: [
          { name: 'Hemoglobin', value: '14.8', unit: 'g/dL', referenceRange: '13.0 - 17.5', status: 'Normal' },
          { name: 'Total Leukocyte Count (WBC)', value: '6,400', unit: 'cells/cu.mm', referenceRange: '4,000 - 11,000', status: 'Normal' },
          { name: 'Platelet Count', value: '2.45', unit: 'Lakhs/cu.mm', referenceRange: '1.50 - 4.50', status: 'Normal' },
          { name: 'Fasting Plasma Glucose', value: String(92 + (sIdx % 20)), unit: 'mg/dL', referenceRange: '70 - 99', status: (sIdx % 5 === 0 ? 'High' : 'Normal') },
          { name: 'Total Cholesterol', value: String(175 + (sIdx % 25)), unit: 'mg/dL', referenceRange: '< 200', status: 'Normal' },
          { name: 'Serum Creatinine', value: '0.92', unit: 'mg/dL', referenceRange: '0.70 - 1.30', status: 'Normal' },
          { name: 'Serum Bilirubin (Total)', value: '0.75', unit: 'mg/dL', referenceRange: '0.20 - 1.20', status: 'Normal' },
        ],
        doctorRemarks: isCompleted
          ? 'Biomarker values demonstrate stable metabolic equilibrium. Fasting glycemic markers within reference bounds. Continue balanced Mediterranean-style nutritional regimen and optimal hydration.'
          : null,
        verifiedBy: isCompleted ? assignedDoctor.name : null,
        verifiedAt: isCompleted ? new Date(appt.scheduledDate.getTime() + 15000000) : null,
        doctorLicense: isCompleted ? assignedDoctor.licenseNumber : null,
      });
    });

    const samples = await Sample.insertMany(samplesToInsert);
    console.log(`Created ${samples.length} Diagnostic Samples.`);

    // ==========================================
    // 10. AI-ANALYZED FOOD LOGS & VITAL SURGE CURVES (60 Meals)
    // ==========================================
    console.log('\nSeeding 60 AI Food Scans with Realistic Glycemic & BP Vital Surge Curves...');
    const foodItems = [
      { name: 'Masala Dosa with Sambar & Coconut Chutney', cal: 420, carbs: 58, prot: 9, fat: 16, gi: 68, gl: 28, cat: 'High' },
      { name: 'Grilled Norwegian Salmon with Quinoa & Asparagus', cal: 520, carbs: 24, prot: 44, fat: 22, gi: 32, gl: 7, cat: 'Low' },
      { name: 'Palak Paneer with 2 Whole Wheat Rotis', cal: 460, carbs: 42, prot: 20, fat: 24, gi: 45, gl: 14, cat: 'Medium' },
      { name: 'Hyderabadi Chicken Biryani (Portion Controlled)', cal: 680, carbs: 74, prot: 38, fat: 26, gi: 72, gl: 34, cat: 'High' },
      { name: 'Overnight Rolled Oats with Chia Seeds & Blueberries', cal: 340, carbs: 48, prot: 14, fat: 8, gi: 42, gl: 12, cat: 'Medium' },
      { name: 'Mediterranean Greek Salad with Kalamata Olives & Feta', cal: 280, carbs: 12, prot: 9, fat: 22, gi: 20, gl: 3, cat: 'Low' },
      { name: 'Egg Bhurji with Multigrain Toast', cal: 360, carbs: 28, prot: 22, fat: 18, gi: 38, gl: 9, cat: 'Low' },
      { name: 'Dal Tadka with Steamed Basmati Rice & Cucumber Raita', cal: 490, carbs: 72, prot: 18, fat: 12, gi: 62, gl: 24, cat: 'Medium' },
      { name: 'Paneer Tikka with Mint Chutney', cal: 380, carbs: 14, prot: 26, fat: 24, gi: 25, gl: 4, cat: 'Low' },
      { name: 'Avocado Toast with Poached Eggs & Hemp Hearts', cal: 440, carbs: 26, prot: 20, fat: 28, gi: 30, gl: 6, cat: 'Low' },
    ];

    const foodDocs = [];
    users.slice(0, 15).forEach((u, uIdx) => {
      // 4 meals per patient
      for (let m = 0; m < 4; m++) {
        const item = foodItems[(uIdx * 2 + m) % foodItems.length];
        const mealTime = new Date(now - (m * 28 + uIdx) * 3600000);

        // Synthesize 120-minute vital surge response curve
        const surgeCurve = [];
        const baseGluc = 95;
        const baseBP = 120;
        const peakGlucIncrease = Math.round(item.gl * 1.8);
        const peakBPIncrease = Math.round(item.fat > 20 ? 8 : 4);

        for (let min = 0; min <= 120; min += 15) {
          const factor = Math.sin((min / 120) * Math.PI);
          surgeCurve.push({
            minute: min,
            glucose: Math.round(baseGluc + peakGlucIncrease * factor),
            systolicBP: Math.round(baseBP + peakBPIncrease * factor),
            insulinAction: Math.round(factor * 100),
          });
        }

        foodDocs.push({
          user: u._id,
          imageUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60`,
          recognizedItemName: item.name,
          aiConfidenceScore: 0.94,
          mealType: m === 0 ? 'Breakfast' : (m === 1 ? 'Lunch' : (m === 2 ? 'Snack' : 'Dinner')),
          source: m % 2 === 0 ? 'Home_Cooked' : 'Restaurant',
          moodPostConsumption: item.cat === 'Low' ? 'Energetic' : (item.cat === 'High' ? 'Sluggish' : 'Normal'),
          nutrients: {
            calories: item.cal,
            carbohydrates: item.carbs,
            netCarbohydrates: item.carbs - 5,
            proteins: item.prot,
            fats: item.fat,
            saturatedFat: Math.round(item.fat * 0.3),
            sugar: Math.round(item.carbs * 0.15),
            fiber: 6,
            sodium: 480,
            potassium: 520,
            calcium: 140,
            iron: 3.2,
            magnesium: 65,
            cholesterol: item.prot > 20 ? 65 : 15,
          },
          glycemicIndex: item.gi,
          glycemicLoad: item.gl,
          glycemicLoadCategory: item.cat,
          servingWeightGrams: 280,
          consumedQuantity: 1,
          isConfirmed: true,
          predictedImpact: {
            glucoseSpike: peakGlucIncrease,
            peakGlucose: baseGluc + peakGlucIncrease,
            timeToPeakGlucoseMin: 45,
            bpSpikeSystolic: peakBPIncrease,
            peakSystolicBP: baseBP + peakBPIncrease,
            vitalSurgeCurve: surgeCurve,
            harmReductionBenefit: {
              recommendedHack: 'Take a 10-minute post-meal brisk walk to reduce peak glycemic spike by up to 28%.',
              pairingAdvice: 'Pair with 1 tbsp apple cider vinegar in water or fresh cucumber slices.',
            },
            aiWarningMessage: item.cat === 'High' ? 'High glycemic surge detected. Potential post-prandial glucose fluctuation.' : null,
            aiAlternativeSuggestions: ['Substitute white rice with cauliflower rice or quinoa', 'Double the leafy vegetable portion'],
            doctorHacks: [
              { type: 'Movement', title: '10-Min Post-Prandial Walk', action: 'Activate GLUT-4 muscle glucose uptake without insulin demand.' },
              { type: 'Fiber', title: 'Pre-Meal Greens Starter', action: 'Coat intestinal mucosa with viscous fiber to delay carbohydrate absorption.' },
            ],
          },
          createdAt: mealTime,
        });
      }
    });

    const foodLogs = await FoodLog.insertMany(foodDocs);
    console.log(`Created ${foodLogs.length} AI Food Logs.`);

    // ==========================================
    // 11. FINANCIAL TRANSACTIONS (80 Records)
    // ==========================================
    console.log('\nSeeding 80 Financial Transactions for Revenue Dashboards...');
    const transactionsToInsert = [];
    const gateways = ['Razorpay_UPI', 'Razorpay_Card', 'Paytm', 'Cash_On_Collection'];

    appointments.forEach((appt, tIdx) => {
      const isSuccess = appt.paymentDetails?.isPaid;
      transactionsToInsert.push({
        user: appt.user,
        appointment: appt._id,
        amount: appt.paymentDetails?.amount || 499,
        currency: 'INR',
        status: isSuccess ? 'Success' : (appt.status === 'Cancelled' ? 'Refunded' : 'Pending'),
        paymentGateway: gateways[tIdx % gateways.length],
        gatewayTransactionId: `TXN-BIO-${20260000 + tIdx}`,
        revenueType: 'Lab_Test',
        createdAt: appt.scheduledDate,
      });
    });

    const transactions = await Transaction.insertMany(transactionsToInsert);
    console.log(`Created ${transactions.length} Transactions.`);

    // ==========================================
    // 12. NOTIFICATIONS (75 In-App & Push Notifications)
    // ==========================================
    console.log('\nSeeding 75 In-App & Push Notifications...');
    const notifsToInsert = [];

    users.slice(0, 20).forEach((u, nIdx) => {
      notifsToInsert.push(
        {
          title: 'Phlebotomist Assigned to Your Booking',
          message: `Ramesh Babu has been assigned for your upcoming diagnostic appointment. Track live location in app.`,
          type: 'Appointments',
          targetAudience: 'Specific',
          targetUserId: u._id,
          isRead: nIdx % 2 === 0,
          createdAt: new Date(now - 7200000),
        },
        {
          title: 'Official Diagnostic Lab Report Ready',
          message: 'Your Comprehensive Metabolic Panel report has been authorized by Dr. Rajesh Khanna and is ready for download.',
          type: 'Report_Ready',
          targetAudience: 'Specific',
          targetUserId: u._id,
          isRead: false,
          createdAt: new Date(now - 3600000),
        },
        {
          title: 'Digital Twin Vital Calibration Complete',
          message: 'Your physiological twin parameters have adapted to recent fasting blood draw. Personalized meal curves updated.',
          type: 'AI',
          targetAudience: 'Specific',
          targetUserId: u._id,
          isRead: true,
          createdAt: new Date(now - 86400000),
        }
      );
    });

    // Add Broadcast System Notifications
    notifsToInsert.push(
      {
        title: 'Platform Maintenance Notice',
        message: 'Scheduled cloud telemetry calibration completed successfully. All 1-second IoT channels active.',
        type: 'System',
        targetAudience: 'All',
        isRead: false,
        createdAt: new Date(now - 1800000),
      },
      {
        title: 'Urgent Dispatch Alert: Priority Collection Requested',
        message: 'New critical patient booking received in Hitec City zone. Nearest phlebotomist requested to acknowledge.',
        type: 'Dispatch',
        targetAudience: 'LabAssistants',
        isRead: false,
        createdAt: new Date(now - 900000),
      }
    );

    const notifications = await Notification.insertMany(notifsToInsert);
    console.log(`Created ${notifications.length} Notifications.`);

    // ==========================================
    // 13. CUSTOMER & STAFF SUPPORT TICKETS (25 Tickets)
    // ==========================================
    console.log('\nSeeding 25 Multi-Turn Support Tickets...');
    const ticketTypes = ['Appointment', 'Payment', 'Lab_Assistant', 'Food_Analysis', 'PDF_Upload', 'Technical_Issue'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const ticketStatuses = ['Open', 'In_Progress', 'Resolved', 'Closed'];

    const ticketsToInsert = [];
    for (let t = 0; t < 25; t++) {
      const patient = users[t % users.length];
      const assignedAdmin = admins[t % admins.length];
      const type = ticketTypes[t % ticketTypes.length];
      const priority = priorities[t % priorities.length];
      const status = ticketStatuses[t % ticketStatuses.length];

      ticketsToInsert.push({
        user: patient._id,
        ticketType: type,
        priority,
        status,
        assignedAdmin: assignedAdmin._id,
        subject: `Query Regarding ${type.replace('_', ' ')} #${1000 + t}`,
        description: `Patient requested clarification regarding their home collection schedule and fasting protocol for the scheduled panel.`,
        messages: [
          {
            senderId: patient._id,
            senderRole: 'User',
            senderName: `${patient.firstName} ${patient.lastName}`,
            message: 'Hello, I wanted to confirm if drinking black coffee with no sugar is permitted before my 8:00 AM fasting blood draw?',
            createdAt: new Date(now - 7200000),
          },
          {
            senderId: assignedAdmin._id,
            senderRole: 'Support_Staff',
            senderName: assignedAdmin.name,
            message: 'Hello! Plain water is completely fine and encouraged. However, please avoid black coffee, tea, or supplements as caffeine can transiently stimulate cortisol and metabolic enzymes.',
            createdAt: new Date(now - 3600000),
          },
        ],
        resolutionNotes: status === 'Resolved' || status === 'Closed' ? [
          { note: 'Patient clarified protocol and confirmed ready for 8 AM slot.', addedBy: assignedAdmin.name, createdAt: new Date() }
        ] : [],
        resolvedAt: status === 'Resolved' || status === 'Closed' ? new Date() : null,
      });
    }

    const tickets = await Ticket.insertMany(ticketsToInsert);
    console.log(`Created ${tickets.length} Support Tickets.`);

    // ==========================================
    // 14. ENTERPRISE AUDIT & SYSTEM LOGS & AI TELEMETRY (100+ Records)
    // ==========================================
    console.log('\nSeeding Enterprise System Logs, Security Audits & AI Telemetry...');
    const auditLogsToInsert = [];
    const systemLogsToInsert = [];
    const aiLogsToInsert = [];

    // Audits
    for (let a = 0; a < 30; a++) {
      const adminActor = admins[a % admins.length];
      const targetAppt = appointments[a % appointments.length];
      auditLogsToInsert.push({
        actorModel: 'Admin',
        actorId: adminActor._id,
        action: a % 2 === 0 ? 'Assigned' : 'Status_Change',
        targetModel: 'Appointment',
        targetId: targetAppt._id,
        details: `Assigned phlebotomist and advanced appointment to ${targetAppt.status}`,
        ipAddress: `192.168.1.${10 + a}`,
      });
    }

    // System Logs
    const logLevels = ['INFO', 'INFO', 'WARNING', 'INFO', 'ERROR'];
    for (let s = 0; s < 30; s++) {
      const level = logLevels[s % logLevels.length];
      systemLogsToInsert.push({
        level,
        module: s % 3 === 0 ? 'AI_ENGINE' : (s % 3 === 1 ? 'DISPATCH_ROUTER' : 'PAYMENT_GATEWAY'),
        message: level === 'ERROR'
          ? 'Transient connection timeout on external payment verification webhook; retried successfully.'
          : (level === 'WARNING' ? 'Phlebotomist telemetry reporting delayed by 45 seconds due to cellular fringe area.' : '1-second IoT telemetry streaming frame ingested successfully.'),
        endpointCalled: s % 2 === 0 ? '/api/vitals/iot-stream' : '/api/appointments/book',
        method: 'POST',
        executionTimeMs: 14 + (s * 3),
        ipAddress: `10.0.0.${100 + s}`,
        userAgent: 'BioSync-Mobile/1.0.0 (iOS/Android)',
      });
    }

    // AI Telemetry Logs
    const aiInteractions = ['Food_Scan', 'Trajectory_Prediction', 'Report_Analysis', 'Symptom_Analysis'];
    for (let l = 0; l < 30; l++) {
      const u = users[l % users.length];
      const interaction = aiInteractions[l % aiInteractions.length];
      aiLogsToInsert.push({
        user: u._id,
        interactionType: interaction,
        inputDataSummary: `Analyzed nutritional and vital telemetry matrix for patient ${u.firstName} ${u.lastName}`,
        aiOutputSummary: `Generated vital surge curve: Peak glucose delta +${24 + (l % 15)} mg/dL, Peak systolic BP delta +${4 + (l % 6)} mmHg`,
        confidenceScore: 0.92 + ((l % 8) * 0.01),
        status: 'Success',
        userRating: 5,
      });
    }

    await Promise.all([
      AuditLog.insertMany(auditLogsToInsert),
      SystemLog.insertMany(systemLogsToInsert),
      AILog.insertMany(aiLogsToInsert),
    ]);
    console.log('Created Audit Logs, System Logs, and AI Telemetry Logs.');

    // ==========================================
    // SUMMARY REPORT
    // ==========================================
    console.log('\n====================================================');
    console.log('  🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log(`• Roles:                 ${roles.length}`);
    console.log(`• Admins:                ${admins.length} (admin@biosync.ai / Admin@123456)`);
    console.log(`• Doctors:               ${doctors.length} (9876500001 / doctorpassword123)`);
    console.log(`• Phlebotomists:         ${staffMembers.length} (9123456701 / staffpassword123)`);
    console.log(`• Test Catalog Packages: ${catalog.length}`);
    console.log(`• Patients / Users:      ${users.length} (9876512345, OTP: 123456)`);
    console.log(`• Longitudinal Vitals:   ${vitals.length} records`);
    console.log(`• Appointments:          ${appointments.length} active bookings across all stages`);
    console.log(`• Diagnostic Samples:    ${samples.length} barcoded specimens with results`);
    console.log(`• AI Food Logs:          ${foodLogs.length} with vital surge curves`);
    console.log(`• Financial Txns:        ${transactions.length} records`);
    console.log(`• Notifications:         ${notifications.length} in-app & push notices`);
    console.log(`• Support Tickets:       ${tickets.length} customer issues`);
    console.log(`• System & AI Logs:      90 telemetry traces`);
    console.log('====================================================\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ FATAL SEEDING ERROR:', error);
    if (mongoose.connection) await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();

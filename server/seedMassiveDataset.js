import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

// Import All 25 System Models
import AbdmCareContext from './models/AbdmCareContext.js';
import Admin from './models/Admin.js';
import AILog from './models/AILog.js';
import Appointment from './models/Appointment.js';
import AuditLog from './models/AuditLog.js';
import ChatMessage from './models/ChatMessage.js';
import Doctor from './models/Doctor.js';
import FamilyGroup from './models/FamilyGroup.js';
import FoodItem from './models/FoodItem.js';
import FoodLog from './models/FoodLog.js';
import FoodOrder from './models/FoodOrder.js';
import IoTTelemetry from './models/IoTTelemetry.js';
import LabAssistant from './models/LabAssistant.js';
import MemberApplication from './models/MemberApplication.js';
import Notification from './models/Notification.js';
import Restaurant from './models/Restaurant.js';
import Role from './models/Role.js';
import Sample from './models/Sample.js';
import SystemLog from './models/SystemLog.js';
import TestCatalog from './models/TestCatalog.js';
import Ticket from './models/Ticket.js';
import Transaction from './models/Transaction.js';
import User from './models/User.js';
import UserDraft from './models/UserDraft.js';
import Vitals from './models/Vitals.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/biosyncai';

export async function seedMassiveDataset() {
  console.log('\n======================================================================');
  console.log('  BIOSYNC AI - MASSIVE PRODUCTION-GRADE MASTER ECOSYSTEM SEEDER');
  console.log('======================================================================');
  console.log(`Connecting to: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGO_URI);
  }
  console.log('Connected to MongoDB Atlas successfully.');

  console.log('\n[1/25] Purging all 25 collections for a pristine, synchronized dataset...');
  await Promise.all([
    AbdmCareContext.deleteMany({}),
    Admin.deleteMany({}),
    AILog.deleteMany({}),
    Appointment.deleteMany({}),
    AuditLog.deleteMany({}),
    ChatMessage.deleteMany({}),
    Doctor.deleteMany({}),
    FamilyGroup.deleteMany({}),
    FoodItem.deleteMany({}),
    FoodLog.deleteMany({}),
    FoodOrder.deleteMany({}),
    IoTTelemetry.deleteMany({}),
    LabAssistant.deleteMany({}),
    MemberApplication.deleteMany({}),
    Notification.deleteMany({}),
    Restaurant.deleteMany({}),
    Role.deleteMany({}),
    Sample.deleteMany({}),
    SystemLog.deleteMany({}),
    TestCatalog.deleteMany({}),
    Ticket.deleteMany({}),
    Transaction.deleteMany({}),
    User.deleteMany({}),
    UserDraft.deleteMany({}),
    Vitals.deleteMany({})
  ]);
  console.log('Cleared all prior collections.');

  // Pre-hashed passwords for deterministic fast seeding
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const opsPasswordHash = await bcrypt.hash('Ops@123456', 10);
  const doctorPasswordHash = await bcrypt.hash('doctorpassword123', 10);
  const staffPasswordHash = await bcrypt.hash('staffpassword123', 10);

  // ==========================================
  // 1. ROLES (6 Enterprise RBAC Roles)
  // ==========================================
  console.log('\n[2/25] Seeding Enterprise RBAC Roles...');
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
    {
      name: 'Phlebotomist_Supervisor',
      description: 'Field cold-chain oversight, centrifugation timestamp verification, route dispatch',
      permissions: { dashboard: true, users: true, roles: false, reports: true, settings: false },
      isSystem: false,
    },
    {
      name: 'Clinical_Auditor',
      description: 'ABDM care-context compliance, HIPAA/DPDP data privacy, and diagnostic QC audit',
      permissions: { dashboard: true, users: false, roles: false, reports: true, settings: true },
      isSystem: false,
    }
  ]);
  console.log(`Created ${roles.length} RBAC roles.`);

  // ==========================================
  // 2. ADMIN ACCOUNTS (5 Dedicated Staff)
  // ==========================================
  console.log('\n[3/25] Seeding Admin Management Accounts...');
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
    {
      name: 'Quality & Privacy Auditor',
      email: 'auditor@biosync.ai',
      password: opsPasswordHash,
      role: 'Clinical_Auditor',
      lastLogin: new Date(Date.now() - 28800000),
    }
  ]);
  console.log(`Created ${admins.length} Admin accounts.`);

  // ==========================================
  // 3. DOCTORS / SPECIALISTS (16 Physicians)
  // ==========================================
  console.log('\n[4/25] Seeding 16 Specialist Physicians & Pathologists...');
  const doctorSpecs = [
    { name: 'Dr. Rajesh Khanna, MD', specialty: 'Pathology & Laboratory Medicine', email: 'dr.khanna@biosync.ai', phone: '9876500001', lic: 'MCI-PATH-77291', hosp: 'BioSync Central Reference Laboratory, Hitec City', lat: 17.4486, lng: 78.3742, city: 'Hyderabad' },
    { name: 'Dr. Priya Swaminathan, DM', specialty: 'Clinical Cardiology & Hemodynamics', email: 'dr.swaminathan@biosync.ai', phone: '9876500002', lic: 'MCI-CARD-88312', hosp: 'Apollo Institute of Cardiovascular Sciences', lat: 17.4156, lng: 78.4121, city: 'Hyderabad' },
    { name: 'Dr. Arvind Deshmukh, MD', specialty: 'Endocrinology & Metabolic Disorders', email: 'dr.deshmukh@biosync.ai', phone: '9876500003', lic: 'MCI-ENDO-66419', hosp: 'MaxCure Center for Diabetology', lat: 17.4399, lng: 78.3908, city: 'Hyderabad' },
    { name: 'Dr. Meenakshi Sundaram, MD', specialty: 'Hematology & Immunopathology', email: 'dr.sundaram@biosync.ai', phone: '9876500004', lic: 'MCI-HEMA-99214', hosp: 'BioSync Genomic Diagnostics Lab', lat: 17.4422, lng: 78.3822, city: 'Hyderabad' },
    { name: 'Dr. Siddharth Varma, MD', specialty: 'Nephrology & Renal Medicine', email: 'dr.varma@biosync.ai', phone: '9876500005', lic: 'MCI-NEPH-44120', hosp: 'CARE Hospitals Nephro Sciences', lat: 17.4189, lng: 78.4501, city: 'Hyderabad' },
    { name: 'Dr. Ananya Sengupta, MD', specialty: 'Preventive Medicine & Longevity', email: 'dr.sengupta@biosync.ai', phone: '9876500006', lic: 'MCI-PREV-33108', hosp: 'Fortis Health Wellness Wing', lat: 17.4375, lng: 78.4482, city: 'Hyderabad' },
    { name: 'Dr. Vikramaditya Rathore, MS', specialty: 'Bariatric & Metabolic Surgery', email: 'dr.rathore@biosync.ai', phone: '9876500007', lic: 'MCI-SURG-55901', hosp: 'Yashoda Institute of Metabolic Care', lat: 17.4521, lng: 78.3611, city: 'Hyderabad' },
    { name: 'Dr. Sunita Kulkarni, BAMS, MD', specialty: 'Ayurvedic Medicine & Herbology', email: 'dr.kulkarni@biosync.ai', phone: '9876500008', lic: 'AYUSH-TEL-11029', hosp: 'National Center for Integrative Health', lat: 17.4267, lng: 78.4289, city: 'Hyderabad' },
    { name: 'Dr. Farooq Abdullah, MD', specialty: 'Clinical Biochemistry & Toxicology', email: 'dr.abdullah@biosync.ai', phone: '9876500009', lic: 'MCI-BIO-22341', hosp: 'BioSync AI Northern Hub, Delhi', lat: 28.5355, lng: 77.2410, city: 'Delhi' },
    { name: 'Dr. Malini Nambiar, MD', specialty: 'Pediatric Endocrinology', email: 'dr.nambiar@biosync.ai', phone: '9876500010', lic: 'MCI-PED-77812', hosp: 'Rainbow Childrens Hospital, Bengaluru', lat: 12.9716, lng: 77.5946, city: 'Bengaluru' },
    { name: 'Dr. Tanvi Shah, MD', specialty: 'Gynecology & Reproductive Endocrinology', email: 'dr.shah@biosync.ai', phone: '9876500011', lic: 'MCI-GYN-99823', hosp: 'Kokilaben Dhirubhai Ambani Hospital, Mumbai', lat: 19.1311, lng: 72.8258, city: 'Mumbai' },
    { name: 'Dr. Harish Balakrishnan, DM', specialty: 'Interventional Cardiology', email: 'dr.balakrishnan@biosync.ai', phone: '9876500012', lic: 'MCI-CARD-44331', hosp: 'MIOT International, Chennai', lat: 13.0213, lng: 80.1873, city: 'Chennai' },
    { name: 'Dr. Rohini Bhonsle, MD', specialty: 'Hepatology & Gastroenterology', email: 'dr.bhonsle@biosync.ai', phone: '9876500013', lic: 'MCI-HEP-55219', hosp: 'Ruby Hall Clinic, Pune', lat: 18.5284, lng: 73.8743, city: 'Pune' },
    { name: 'Dr. Sanjeev Goel, MD', specialty: 'Geriatric Medicine & Neuro-Metabolism', email: 'dr.goel@biosync.ai', phone: '9876500014', lic: 'MCI-GERI-66124', hosp: 'Max Super Speciality Hospital, Saket, Delhi', lat: 28.5273, lng: 77.2159, city: 'Delhi' },
    { name: 'Dr. Bhavna Chawla, MD', specialty: 'Dermatopathology & Systemic Biomarkers', email: 'dr.chawla@biosync.ai', phone: '9876500015', lic: 'MCI-DERM-77112', hosp: 'Sir Ganga Ram Hospital, Delhi', lat: 28.6389, lng: 77.1896, city: 'Delhi' },
    { name: 'Dr. Amit Joshi, MD', specialty: 'Sports Medicine & Exercise Physiology', email: 'dr.joshi@biosync.ai', phone: '9876500016', lic: 'MCI-SPRT-88456', hosp: 'Manipal Hospital, Old Airport Road, Bengaluru', lat: 12.9592, lng: 77.6534, city: 'Bengaluru' },
  ];

  const doctors = await Doctor.insertMany(doctorSpecs.map((d, idx) => ({
    name: d.name,
    specialty: d.specialty,
    email: d.email,
    phone: d.phone,
    password: doctorPasswordHash,
    role: idx === 0 || idx === 3 || idx === 8 ? 'pathologist' : 'doctor',
    licenseNumber: d.lic,
    hospitalAffiliation: d.hosp,
    rating: Number((4.90 + (idx % 10) * 0.01).toFixed(2)),
    status: 'Active',
    currentLocation: {
      lat: d.lat,
      lng: d.lng,
      address: d.hosp,
      zone: d.city,
      lastUpdated: new Date()
    }
  })));
  console.log(`Created ${doctors.length} Doctors.`);

  // ==========================================
  // 4. PHLEBOTOMISTS / LAB ASSISTANTS (16 Field Technicians)
  // ==========================================
  console.log('\n[5/25] Seeding 16 Phlebotomist Fleet Staff...');
  const phlebData = [
    { name: 'Kiran Kumar Varma', phone: '9123456701', empId: 'PHLEB-HYD-001', zones: ['Hitec City', 'Madhapur', 'Kondapur'], lat: 17.4485, lng: 78.3750, veh: 'Two-Wheeler', num: 'TS09EA1234' },
    { name: 'Sunil Reddy', phone: '9123456702', empId: 'PHLEB-HYD-002', zones: ['Jubilee Hills', 'Banjara Hills'], lat: 17.4320, lng: 78.4070, veh: 'Two-Wheeler', num: 'TS09EB5678' },
    { name: 'Pooja Sharma', phone: '9123456703', empId: 'PHLEB-HYD-003', zones: ['Gachibowli', 'Financial District'], lat: 17.4360, lng: 78.3490, veh: 'Two-Wheeler', num: 'TS09EC9012' },
    { name: 'Manish Tiwari', phone: '9123456704', empId: 'PHLEB-HYD-004', zones: ['Kukatpally', 'Miyapur'], lat: 17.4930, lng: 78.3990, veh: 'Two-Wheeler', num: 'TS09ED3456' },
    { name: 'Kavita Nair', phone: '9123456705', empId: 'PHLEB-HYD-005', zones: ['Begumpet', 'Secunderabad'], lat: 17.4440, lng: 78.4730, veh: 'Two-Wheeler', num: 'TS10EE7890' },
    { name: 'Arjun Das', phone: '9123456706', empId: 'PHLEB-HYD-006', zones: ['Tolichowki', 'Mehdipatnam'], lat: 17.3980, lng: 78.4180, veh: 'Two-Wheeler', num: 'TS09EF1122' },
    { name: 'Deepa Krishnan', phone: '9123456707', empId: 'PHLEB-BLR-001', zones: ['Koramangala', 'HSR Layout'], lat: 12.9352, lng: 77.6245, veh: 'Two-Wheeler', num: 'KA01AB3344' },
    { name: 'Rohan Deshmukh', phone: '9123456708', empId: 'PHLEB-BLR-002', zones: ['Indiranagar', 'Whitefield'], lat: 12.9784, lng: 77.6408, veh: 'Two-Wheeler', num: 'KA03CD5566' },
    { name: 'Sneha Patel', phone: '9123456709', empId: 'PHLEB-MUM-001', zones: ['Bandra West', 'Khar', 'Juhu'], lat: 19.0596, lng: 72.8295, veh: 'Two-Wheeler', num: 'MH02EF7788' },
    { name: 'Amit Saxena', phone: '9123456710', empId: 'PHLEB-DEL-001', zones: ['South Extension', 'Hauz Khas', 'Saket'], lat: 28.5672, lng: 77.2244, veh: 'Two-Wheeler', num: 'DL01GH9900' },
    { name: 'Venkatesh Murthy', phone: '9123456711', empId: 'PHLEB-BLR-003', zones: ['Jayanagar', 'JP Nagar'], lat: 12.9250, lng: 77.5838, veh: 'Two-Wheeler', num: 'KA05JK1234' },
    { name: 'Pravin Jadhav', phone: '9123456712', empId: 'PHLEB-PUN-001', zones: ['Kothrud', 'Aundh', 'Baner'], lat: 18.5074, lng: 73.8077, veh: 'Two-Wheeler', num: 'MH12LM5678' },
    { name: 'Swati Sen', phone: '9123456713', empId: 'PHLEB-KOL-001', zones: ['Salt Lake', 'New Town'], lat: 22.5867, lng: 88.4178, veh: 'Two-Wheeler', num: 'WB02NO9012' },
    { name: 'Karthik Raja', phone: '9123456714', empId: 'PHLEB-CHE-001', zones: ['Adyar', 'T. Nagar', 'Velachery'], lat: 13.0012, lng: 80.2565, veh: 'Two-Wheeler', num: 'TN07PQ3456' },
    { name: 'Harpreet Singh', phone: '9123456715', empId: 'PHLEB-DEL-002', zones: ['Rohini', 'Pitampura', 'Punjabi Bagh'], lat: 28.7041, lng: 77.1025, veh: 'Two-Wheeler', num: 'DL04RS7890' },
    { name: 'Divya Iyer', phone: '9123456716', empId: 'PHLEB-MUM-002', zones: ['Powai', 'Andheri East'], lat: 19.1176, lng: 72.9060, veh: 'Two-Wheeler', num: 'MH03TU1122' },
  ];

  const labAssistants = await LabAssistant.insertMany(phlebData.map(p => ({
    name: p.name,
    phone: p.phone,
    password: staffPasswordHash,
    employeeId: p.empId,
    gender: p.name.includes('Pooja') || p.name.includes('Kavita') || p.name.includes('Deepa') || p.name.includes('Sneha') || p.name.includes('Swati') || p.name.includes('Divya') ? 'Female' : 'Male',
    bloodGroup: 'O+',
    backgroundVerified: true,
    drivingLicense: `DL-${p.empId.replace('-', '')}`,
    vehicleType: p.veh,
    vehicleNumber: p.num,
    assignedZones: p.zones,
    status: 'Available',
    shiftTiming: { start: '06:00', end: '15:00' },
    currentLocation: { lat: p.lat, lng: p.lng, heading: 90, lastUpdated: new Date() },
    inventory: { bloodCollectionTubes: 50, urineContainers: 25, icePacks: 6 },
    performance: { totalCollectionsCompleted: 185, cancelledAppointments: 2, averageRating: 4.92, reviews: [] }
  })));
  console.log(`Created ${labAssistants.length} Phlebotomists.`);

  // ==========================================
  // 5. TEST CATALOG (25 Clinical Diagnostic Packages)
  // ==========================================
  console.log('\n[6/25] Seeding 25 Diagnostic Test Catalog Packages with LOINC Codes...');
  const catalogPackages = [
    { title: 'Complete Blood Count (CBC) with Automated Differential', category: 'Hematology', price: 399, originalPrice: 650, turnaroundHours: 4, fastingRequired: false, specimenType: 'Blood', loinc: '58410-2' },
    { title: 'Comprehensive Metabolic Panel (CMP-14)', category: 'Biochemistry', price: 899, originalPrice: 1400, turnaroundHours: 6, fastingRequired: true, specimenType: 'Blood', loinc: '24323-8' },
    { title: 'Advanced Lipid Profile & Apolipoproteins (ApoB/ApoA1)', category: 'Cardiology', price: 999, originalPrice: 1800, turnaroundHours: 8, fastingRequired: true, specimenType: 'Blood', loinc: '24331-1' },
    { title: 'Glycemic Health & HbA1c with Estimated Average Glucose', category: 'Diabetes', price: 549, originalPrice: 900, turnaroundHours: 4, fastingRequired: false, specimenType: 'Blood', loinc: '4548-4' },
    { title: 'Renal Function Test (KFT) with Cystatin-C & eGFR', category: 'Nephrology', price: 850, originalPrice: 1500, turnaroundHours: 6, fastingRequired: true, specimenType: 'Blood', loinc: '24362-6' },
    { title: 'Comprehensive Liver Function Test (LFT) & Fibrosis Score', category: 'Hepatology', price: 799, originalPrice: 1300, turnaroundHours: 6, fastingRequired: true, specimenType: 'Blood', loinc: '24325-3' },
    { title: 'Thyroid Complete Profile (TSH, Free T3, Free T4, Anti-TPO)', category: 'Endocrinology', price: 950, originalPrice: 1700, turnaroundHours: 8, fastingRequired: true, specimenType: 'Blood', loinc: '99990-2' },
    { title: 'High-Sensitivity Cardiac Risk Panel (hs-CRP, NT-proBNP, Homocysteine)', category: 'Cardiology', price: 1899, originalPrice: 3200, turnaroundHours: 12, fastingRequired: true, specimenType: 'Blood', loinc: '30522-7' },
    { title: 'Vitamin D3 (25-OH) & Vitamin B12 Immunoassay', category: 'Micronutrients', price: 1199, originalPrice: 2200, turnaroundHours: 8, fastingRequired: false, specimenType: 'Blood', loinc: '62292-8' },
    { title: 'Iron Deficiency & Complete Anemia Panel (Ferritin, TIBC, Transferrin)', category: 'Hematology', price: 899, originalPrice: 1600, turnaroundHours: 6, fastingRequired: true, specimenType: 'Blood', loinc: '2498-4' },
    { title: 'Urine Microalbumin-to-Creatinine Ratio (UACR) & Automated Microscopy', category: 'Nephrology', price: 499, originalPrice: 850, turnaroundHours: 4, fastingRequired: false, specimenType: 'Urine', loinc: '14959-1' },
    { title: 'Insulin Resistance Profile (Fasting Insulin, HOMA-IR, C-Peptide)', category: 'Diabetes', price: 1299, originalPrice: 2400, turnaroundHours: 8, fastingRequired: true, specimenType: 'Blood', loinc: '20448-7' },
    { title: 'Extended Serum Electrolytes (Na+, K+, Cl-, HCO3-, Ionized Ca++)', category: 'Biochemistry', price: 499, originalPrice: 800, turnaroundHours: 4, fastingRequired: false, specimenType: 'Blood', loinc: '24326-1' },
    { title: 'Ayur-Metabolic Biomarker Assay (Oxidative Stress, MDA, TAC)', category: 'Metabolism', price: 1499, originalPrice: 2800, turnaroundHours: 12, fastingRequired: true, specimenType: 'Blood', loinc: '99995-1' },
    { title: 'Coagulation & Thrombosis Panel (PT/INR, aPTT, D-Dimer)', category: 'Hematology', price: 1100, originalPrice: 1900, turnaroundHours: 6, fastingRequired: false, specimenType: 'Blood', loinc: '5902-2' },
    { title: 'Pancreatic Enzyme Profile (Serum Amylase & Lipase)', category: 'Gastroenterology', price: 650, originalPrice: 1100, turnaroundHours: 4, fastingRequired: false, specimenType: 'Blood', loinc: '1798-8' },
    { title: 'Bone Mineral Health & Intact Parathyroid Hormone (iPTH)', category: 'Endocrinology', price: 1350, originalPrice: 2500, turnaroundHours: 10, fastingRequired: true, specimenType: 'Blood', loinc: '2731-8' },
    { title: 'Autoimmune Arthritis Screening (RA Factor, Anti-CCP, ANA Screen)', category: 'Rheumatology', price: 1650, originalPrice: 3000, turnaroundHours: 12, fastingRequired: false, specimenType: 'Blood', loinc: '11572-5' },
    { title: 'Comprehensive Food Allergy IgE Panel (Common Indian Allergen Profile)', category: 'Immunology', price: 2499, originalPrice: 4500, turnaroundHours: 24, fastingRequired: false, specimenType: 'Blood', loinc: '60567-5' },
    { title: 'Heavy Metal & Environmental Toxicology Screen (Lead, Arsenic, Mercury)', category: 'Toxicology', price: 2899, originalPrice: 5200, turnaroundHours: 24, fastingRequired: false, specimenType: 'Blood', loinc: '5688-7' },
    { title: 'Tumor Marker Baseline Panel (PSA, CEA, CA-125, AFP)', category: 'Oncology', price: 2999, originalPrice: 5800, turnaroundHours: 16, fastingRequired: true, specimenType: 'Blood', loinc: '19197-3' },
    { title: 'Diabetic Neuropathy & Microvascular Risk Profile', category: 'Diabetes', price: 1450, originalPrice: 2600, turnaroundHours: 8, fastingRequired: true, specimenType: 'Blood', loinc: '99996-9' },
    { title: 'Post-Prandial Glycemic Excursion & Starch Challenge (2hr Oral Load)', category: 'Diabetes', price: 399, originalPrice: 700, turnaroundHours: 4, fastingRequired: true, specimenType: 'Blood', loinc: '1558-6' },
    { title: 'Pediatric Growth & Metabolic Baseline Screen', category: 'Pediatrics', price: 1250, originalPrice: 2100, turnaroundHours: 8, fastingRequired: true, specimenType: 'Blood', loinc: '99997-7' },
    { title: 'Master Senior Citizen Executive Health Diagnostic Shield (84 Parameters)', category: 'Comprehensive', price: 3499, originalPrice: 7500, turnaroundHours: 12, fastingRequired: true, specimenType: 'Blood', loinc: '99998-5' },
  ];

  const testCatalog = await TestCatalog.insertMany(catalogPackages.map((pkg, idx) => ({
    testName: pkg.title,
    testCode: `PKG-${(100 + idx)}`,
    category: pkg.category,
    pricing: { basePrice: pkg.price, taxPercentage: 5 },
    sampleType: pkg.specimenType,
    preparationInstructions: pkg.fastingRequired ? 'Strict 10-12 hours overnight fasting mandatory. Water permitted.' : 'No fasting required. Maintain routine medication.',
    fastingRequired: pkg.fastingRequired,
    referenceRanges: [
      { biomarker: 'Biomarker Primary', unit: 'mg/dL', minNormal: 70, maxNormal: 120, genderSpecific: 'All' }
    ],
    isActive: true,
  })));
  console.log(`Created ${testCatalog.length} Diagnostic Test Catalog Packages.`);

  // ==========================================
  // 6. PATIENT USERS (55 Diverse Phenotypic Profiles)
  // ==========================================
  console.log('\n[7/25] Seeding 55 Diverse Multi-Phenotype Patient Profiles...');
  const patientSeeds = [
    { fn: 'Srinivas', ln: 'Rao', phone: '9876512345', gen: 'Male', age: 58, bg: 'B+', city: 'Hyderabad', st: 'Telangana', pin: '500081', cond: ['Type_2_Diabetes', 'Hypertension'], abha: '91-1234-5678-9012', addr: 'srinivas.rao@abdm', diet: 'Veg' },
    { fn: 'Priya', ln: 'Nair', phone: '9876512346', gen: 'Female', age: 32, bg: 'O+', city: 'Bengaluru', st: 'Karnataka', pin: '560034', cond: ['PCOS', 'Insulin_Resistance'], abha: '91-2345-6789-0123', addr: 'priya.nair@abdm', diet: 'Veg' },
    { fn: 'Vikram', ln: 'Malhotra', phone: '9876512347', gen: 'Male', age: 46, bg: 'A+', city: 'Mumbai', st: 'Maharashtra', pin: '400050', cond: ['Dyslipidemia', 'Hypertension'], abha: '91-3456-7890-1234', addr: 'vikram.m@abdm', diet: 'Non-Veg' },
    { fn: 'Sunita', ln: 'Verma', phone: '9876512348', gen: 'Female', age: 64, bg: 'AB+', city: 'Delhi', st: 'Delhi', pin: '110016', cond: ['Type_2_Diabetes', 'CKD_Stage_3'], abha: '91-4567-8901-2345', addr: 'sunita.v@abdm', diet: 'Veg' },
    { fn: 'Arjun', ln: 'Mehta', phone: '9876512349', gen: 'Male', age: 29, bg: 'O+', city: 'Bengaluru', st: 'Karnataka', pin: '560038', cond: ['Athlete_Healthy'], abha: '91-5678-9012-3456', addr: 'arjun.mehta@abdm', diet: 'Non-Veg' },
    { fn: 'Padmavathi', ln: 'Rao', phone: '9876512350', gen: 'Female', age: 54, bg: 'B+', city: 'Hyderabad', st: 'Telangana', pin: '500081', cond: ['Hypothyroidism', 'Dyslipidemia'], abha: '91-6789-0123-4567', addr: 'padma.rao@abdm', diet: 'Veg' },
    { fn: 'Ramesh', ln: 'Patel', phone: '9876512351', gen: 'Male', age: 68, bg: 'O+', city: 'Ahmedabad', st: 'Gujarat', pin: '380015', cond: ['Hypertension', 'Fatty_Liver_MASLD'], abha: '91-7890-1234-5678', addr: 'ramesh.patel@abdm', diet: 'Veg' },
    { fn: 'Ananya', ln: 'Deshmukh', phone: '9876512352', gen: 'Female', age: 24, bg: 'A+', city: 'Pune', st: 'Maharashtra', pin: '411004', cond: ['Healthy_Control'], abha: '91-8901-2345-6789', addr: 'ananya.d@abdm', diet: 'Veg' },
    { fn: 'Mohammad', ln: 'Zubair', phone: '9876512353', gen: 'Male', age: 52, bg: 'B-', city: 'Hyderabad', st: 'Telangana', pin: '500028', cond: ['Type_2_Diabetes', 'Post_MI_Cardiac'], abha: '91-9012-3456-7890', addr: 'm.zubair@abdm', diet: 'Non-Veg' },
    { fn: 'Lakshmi', ln: 'Sundaram', phone: '9876512354', gen: 'Female', age: 71, bg: 'AB-', city: 'Chennai', st: 'Tamil Nadu', pin: '600020', cond: ['Osteopenia', 'Hypertension'], abha: '91-0123-4567-8901', addr: 'lakshmi.s@abdm', diet: 'Veg' },
    { fn: 'Kabir', ln: 'Sen', phone: '9876512355', gen: 'Male', age: 39, bg: 'O-', city: 'Kolkata', st: 'West Bengal', pin: '700019', cond: ['Thin_Fat_Phenotype', 'Hyperuricemia'], abha: '91-1122-3344-5566', addr: 'kabir.sen@abdm', diet: 'Non-Veg' },
    { fn: 'Pooja', ln: 'Kapoor', phone: '9876512356', gen: 'Female', age: 30, bg: 'B+', city: 'Delhi', st: 'Delhi', pin: '110024', cond: ['Gestational_Diabetes'], abha: '91-2233-4455-6677', addr: 'pooja.kapoor@abdm', diet: 'Veg' },
    { fn: 'Devendra', ln: 'Choudhury', phone: '9876512357', gen: 'Male', age: 62, bg: 'A-', city: 'Jaipur', st: 'Rajasthan', pin: '302004', cond: ['Type_2_Diabetes', 'Diabetic_Neuropathy'], abha: '91-3344-5566-7788', addr: 'devendra.c@abdm', diet: 'Veg' },
    { fn: 'Deepika', ln: 'Bhat', phone: '9876512358', gen: 'Female', age: 28, bg: 'O+', city: 'Bengaluru', st: 'Karnataka', pin: '560076', cond: ['Hashimoto_Thyroiditis'], abha: '91-4455-6677-8899', addr: 'deepika.bhat@abdm', diet: 'Vegan' },
    { fn: 'Rahul', ln: 'Dravid', phone: '9876512359', gen: 'Male', age: 44, bg: 'A+', city: 'Bengaluru', st: 'Karnataka', pin: '560001', cond: ['Pre_Hypertension'], abha: '91-5566-7788-9900', addr: 'rahul.d@abdm', diet: 'Veg' },
    { fn: 'Harish', ln: 'Bansal', phone: '9876512360', gen: 'Male', age: 50, bg: 'B+', city: 'Chandigarh', st: 'Punjab', pin: '160022', cond: ['Metabolic_Syndrome'], abha: '91-6677-8899-0011', addr: 'harish.bansal@abdm', diet: 'Veg' },
    { fn: 'Shweta', ln: 'Tiwari', phone: '9876512361', gen: 'Female', age: 36, bg: 'O+', city: 'Lucknow', st: 'Uttar Pradesh', pin: '226010', cond: ['Hypothyroidism'], abha: '91-7788-9900-1122', addr: 'shweta.t@abdm', diet: 'Veg' },
    { fn: 'Gautam', ln: 'Kashyap', phone: '9876512362', gen: 'Male', age: 33, bg: 'AB+', city: 'Noida', st: 'Uttar Pradesh', pin: '201301', cond: ['Elevated_ApoB', 'Sedentary'], abha: '91-8899-0011-2233', addr: 'gautam.k@abdm', diet: 'Non-Veg' },
    { fn: 'Meera', ln: 'Namboodiri', phone: '9876512363', gen: 'Female', age: 60, bg: 'A+', city: 'Kochi', st: 'Kerala', pin: '682016', cond: ['Osteoarthritis', 'Type_2_Diabetes'], abha: '91-9900-1122-3344', addr: 'meera.n@abdm', diet: 'Veg' },
    { fn: 'Aditya', ln: 'Gokhale', phone: '9876512364', gen: 'Male', age: 27, bg: 'B+', city: 'Pune', st: 'Maharashtra', pin: '411038', cond: ['CrossFit_Athlete'], abha: '91-0011-2233-4455', addr: 'aditya.g@abdm', diet: 'Non-Veg' },
  ];

  // Extend up to 55 patients algorithmically for comprehensive multi-city coverage
  for (let i = 20; i < 55; i++) {
    const isMale = i % 2 === 0;
    const firstNamesMale = ['Nikhil', 'Tanmay', 'Suresh', 'Kunal', 'Vikas', 'Prashant', 'Ashwin', 'Chirag', 'Manoj', 'Hemant'];
    const firstNamesFem = ['Geeta', 'Suman', 'Neha', 'Ritu', 'Bhavna', 'Kavita', 'Preeti', 'Swati', 'Alka', 'Usha'];
    const lastNames = ['Agarwal', 'Chatterjee', 'Reddy', 'Pillai', 'Singhania', 'Chauhan', 'Nair', 'Venkatesh', 'Joshi', 'Menon'];
    const cities = [
      { c: 'Hyderabad', s: 'Telangana', p: '500032', lat: 17.44, lng: 78.38 },
      { c: 'Bengaluru', s: 'Karnataka', p: '560100', lat: 12.98, lng: 77.59 },
      { c: 'Mumbai', s: 'Maharashtra', p: '400001', lat: 19.07, lng: 72.87 },
      { c: 'Delhi', s: 'Delhi', p: '110001', lat: 28.61, lng: 77.20 },
      { c: 'Chennai', s: 'Tamil Nadu', p: '600001', lat: 13.08, lng: 80.27 }
    ];
    const loc = cities[i % cities.length];
    const fn = isMale ? firstNamesMale[i % firstNamesMale.length] : firstNamesFem[i % firstNamesFem.length];
    const ln = lastNames[i % lastNames.length];
    const phone = `98765123${(i + 45).toString().padStart(2, '0')}`;
    patientSeeds.push({
      fn,
      ln,
      phone,
      gen: isMale ? 'Male' : 'Female',
      age: 22 + (i * 2) % 55,
      bg: ['A+', 'B+', 'O+', 'AB+', 'O-'][i % 5],
      city: loc.c,
      st: loc.s,
      pin: loc.p,
      cond: i % 3 === 0 ? ['Type_2_Diabetes'] : i % 3 === 1 ? ['Hypertension'] : ['Healthy_Control'],
      abha: `91-${(3000 + i * 111).toString().padStart(4, '0')}-${(4000 + i * 77).toString().padStart(4, '0')}-${(5000 + i * 33).toString().padStart(4, '0')}`,
      addr: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@abdm`,
      diet: i % 2 === 0 ? 'Veg' : 'Non-Veg'
    });
  }

  const users = await User.insertMany(patientSeeds.map((p, idx) => ({
    phoneNumber: p.phone,
    firstName: p.fn,
    lastName: p.ln,
    dateOfBirth: new Date(Date.now() - p.age * 365.25 * 24 * 3600 * 1000),
    gender: p.gen,
    bloodGroup: p.bg,
    address: {
      houseNumber: `Plot ${100 + idx}`,
      street: `${p.fn} Enclave, Sector ${1 + (idx % 15)}`,
      city: p.city,
      state: p.st,
      pincode: p.pin,
      coordinates: { lat: 17.4480 + (idx * 0.005) % 0.1, lng: 78.3900 + (idx * 0.005) % 0.1 }
    },
    lifestyle: {
      dietPreference: p.diet,
      smokingHabit: idx % 8 === 0 ? 'Occasional' : 'Non-smoker',
      alcoholConsumption: idx % 5 === 0 ? 'Occasional' : 'None',
      activityLevel: p.cond.includes('Athlete') ? 'Very Active' : p.cond.includes('Sedentary') ? 'Sedentary' : 'Moderate'
    },
    wearableSync: {
      deviceType: idx % 3 === 0 ? 'Smart Watch' : idx % 3 === 1 ? 'Smart Ring' : 'None',
      deviceBrand: idx % 3 === 0 ? 'Apple Watch Ultra / Ultrahuman' : idx % 3 === 1 ? 'Oura Ring Gen 3' : null,
      lastSyncTimestamp: new Date()
    },
    emergencyContact: {
      name: `Dr. Contact for ${p.fn}`,
      relation: 'Family Physician',
      phoneNumber: '9849011223'
    },
    abha: {
      abhaNumber: p.abha,
      abhaAddress: p.addr,
      status: 'LINKED',
      linkedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      hipId: 'IN3610001899',
      profileData: {
        fullName: `${p.fn} ${p.ln}`,
        gender: p.gen,
        stateName: p.st
      }
    },
    vitalsStatus: 'Lab_Verified',
    needsRecalibration: false,
    lastBloodDrawDate: new Date(Date.now() - 7 * 24 * 3600 * 1000)
  })));
  console.log(`Created ${users.length} Multi-Phenotype Patients.`);

  // ==========================================
  // 7. VITALS RECORDS (320+ Longitudinal Biomarker Snapshots)
  // ==========================================
  console.log('\n[8/25] Seeding 320+ Longitudinal Vitals Records across 90-Day Timelines...');
  const vitalsDocs = [];
  const sources = ['Lab_Assistant', 'Wearable_Sync', 'CGM_Sensor', 'Manual', 'Doctor'];

  for (let uIdx = 0; uIdx < users.length; uIdx++) {
    const u = users[uIdx];
    const isDiabetic = uIdx % 3 === 0;
    const isHypertensive = uIdx % 4 === 0;
    const recordsPerUser = uIdx < 15 ? 10 : 4;

    for (let r = 0; r < recordsPerUser; r++) {
      const daysAgo = (recordsPerUser - r) * 7 + (uIdx % 3);
      const timestamp = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
      const fGlucose = isDiabetic ? 135 + (r % 5) * 8 : 88 + (r % 4) * 4;
      const ppGlucose = isDiabetic ? 190 + (r % 6) * 12 : 118 + (r % 5) * 5;
      const sBP = isHypertensive ? 142 + (r % 4) * 4 : 118 + (r % 3) * 2;
      const dBP = isHypertensive ? 92 + (r % 3) * 2 : 78 + (r % 2) * 2;

      vitalsDocs.push({
        user: u._id,
        source: sources[r % sources.length],
        createdAt: timestamp,
        updatedAt: timestamp,
        bodyMetrics: {
          heightCm: 165 + (uIdx % 15),
          weightKg: 65 + (uIdx % 25),
          bmi: Number((23.5 + (uIdx % 8) * 0.8).toFixed(1)),
          bodyFatPercentage: 22 + (uIdx % 10),
          muscleMassKg: 45 + (uIdx % 10),
          visceralFatIndex: isDiabetic ? 12 : 6,
          measurements: { waistCm: 84 + (uIdx % 12), hipCm: 98 + (uIdx % 10) }
        },
        continuousMetrics: {
          restingHeartRate: 68 + (r % 8),
          hrv: 48 + (r % 20),
          vo2Max: 38 + (r % 12),
          oxygenSaturationSpO2: 98,
          dailyStepCount: 6500 + (r * 750) % 6000,
          activeCaloriesBurned: 420 + (r * 45) % 300
        },
        metabolicHealth: {
          glucoseFasting: fGlucose,
          glucosePostPrandial: ppGlucose,
          hba1c: Number((isDiabetic ? 7.6 + (r % 3) * 0.2 : 5.4 + (r % 2) * 0.1).toFixed(1)),
          fastingInsulin: isDiabetic ? 18.5 : 8.2,
          homaIR: isDiabetic ? 4.2 : 1.4
        },
        lipidProfile: {
          cholesterolTotal: 185 + (uIdx % 40),
          ldl: 110 + (uIdx % 30),
          hdl: 48 + (uIdx % 10),
          triglycerides: 145 + (uIdx % 50),
          apolipoproteinB: 92 + (uIdx % 25)
        },
        bloodPressure: {
          systolic: sBP,
          diastolic: dBP,
          meanArterialPressure: Math.round(dBP + (sBP - dBP) / 3),
          pulseTransitTimeMs: 180 + (r % 20)
        }
      });
    }
  }

  const vitals = await Vitals.insertMany(vitalsDocs);
  console.log(`Created ${vitals.length} Longitudinal Vitals records.`);

  // ==========================================
  // 8. APPOINTMENTS (135 Field Lifecycle Bookings)
  // ==========================================
  console.log('\n[9/25] Seeding 135 Diagnostic Appointments across All Stages...');
  const apptStatuses = [
    'Booked', 'Confirmed', 'Assistant_Assigned', 'On_Route', 'Arrived',
    'Collecting', 'Sample_Collected', 'At_Laboratory', 'Processing',
    'Report_Generated', 'Completed', 'Completed', 'Completed', 'Cancelled'
  ];

  const apptDocs = [];
  for (let i = 0; i < 135; i++) {
    const user = users[i % users.length];
    const doc = doctors[i % doctors.length];
    const phleb = labAssistants[i % labAssistants.length];
    const cat = testCatalog[i % testCatalog.length];
    const st = apptStatuses[i % apptStatuses.length];
    const daysAgo = (i % 30) - 5;
    const schedDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);

    apptDocs.push({
      user: user._id,
      appointmentType: i % 4 === 0 ? 'Doctor_Consultation' : 'Lab_Collection',
      testCatalog: cat._id,
      doctor: doc._id,
      labAssistant: phleb._id,
      scheduledDate: schedDate,
      timeSlot: ['07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '04:00 PM - 05:00 PM'][i % 5],
      preparationInstructions: cat.preparationInstructions,
      status: st,
      collectionOTP: `${100000 + (i * 137) % 900000}`,
      address: {
        houseNumber: user.address?.houseNumber || 'House 12',
        street: user.address?.street || 'Cyber Towers Road',
        city: user.address?.city || 'Hyderabad',
        state: user.address?.state || 'Telangana',
        pincode: user.address?.pincode || '500081',
        coordinates: user.address?.coordinates || { lat: 17.44, lng: 78.39 }
      },
      paymentDetails: {
        isPaid: st !== 'Cancelled' && st !== 'Booked',
        amount: cat.pricing.basePrice,
        method: ['UPI', 'Card', 'Cash', 'Online'][i % 4],
        collectedAt: st === 'Completed' || st === 'Report_Generated' ? schedDate : null,
        collectedBy: phleb._id
      },
      clinicalIntake: {
        vitals: {
          systolic: 120 + (i % 20),
          diastolic: 80 + (i % 10),
          pulse: 72 + (i % 12),
          spO2: 98,
          bmi: 24.5
        },
        medicalHistory: {
          chronicConditions: i % 2 === 0 ? ['Diabetes Type 2'] : ['Hypertension'],
          currentMedications: 'Metformin 500mg, Telmisartan 40mg',
          knownAllergies: 'None'
        }
      },
      trackingLogs: [
        { status: 'Booked', timestamp: new Date(schedDate.getTime() - 24 * 3600 * 1000), notes: 'Appointment booked via BioSync AI App' },
        { status: 'Confirmed', timestamp: new Date(schedDate.getTime() - 12 * 3600 * 1000), notes: 'Lab technician assigned and scheduled' },
        { status: st, timestamp: schedDate, notes: `Current operational status: ${st}` }
      ]
    });
  }

  const appointments = await Appointment.insertMany(apptDocs);
  console.log(`Created ${appointments.length} Appointments.`);

  // ==========================================
  // 9. SAMPLES (135 Barcoded Specimens with Results)
  // ==========================================
  console.log('\n[10/25] Seeding 135 Barcoded Diagnostic Samples with LOINC Results...');
  const sampleStatuses = [
    'Sample_Collected', 'At_Laboratory', 'Processing',
    'Report_Generated', 'Delivered', 'Delivered', 'Delivered'
  ];

  const sampleDocs = [];
  for (let i = 0; i < 135; i++) {
    const appt = appointments[i];
    const cat = testCatalog[i % testCatalog.length];
    const doc = doctors[i % doctors.length];
    const phleb = labAssistants[i % labAssistants.length];
    const st = sampleStatuses[i % sampleStatuses.length];
    const barcode = `SPL-${(202600000 + i).toString()}`;
    const isCompleted = st === 'Report_Generated' || st === 'Delivered';

    sampleDocs.push({
      user: appt.user,
      appointment: appt._id,
      testCatalog: cat._id,
      labAssistant: phleb._id,
      doctor: doc._id,
      barcode,
      status: st,
      collectionTime: new Date(appt.scheduledDate),
      labProcessingStartTime: new Date(appt.scheduledDate.getTime() + 2 * 3600 * 1000),
      reportGenerationTime: isCompleted ? new Date(appt.scheduledDate.getTime() + 5 * 3600 * 1000) : null,
      resultsDone: isCompleted,
      resultsStatus: isCompleted ? 'Results Ready' : 'Res yet to be obtained',
      turnaroundTimeHours: 4,
      resultPdfUrl: isCompleted ? `https://storage.biosync.ai/reports/${barcode}.pdf` : null,
      specimens: {
        blood: { collected: true, barcode: `${barcode}-B`, photoUrl: 'https://images.biosync.ai/tubes/edta_tube.jpg' },
        urine: { collected: cat.sampleType === 'Urine', barcode: `${barcode}-U` }
      },
      structuredResults: [
        { biomarker: 'Fasting Plasma Glucose', value: 104 + (i % 25), isCritical: (104 + (i % 25)) > 126 },
        { biomarker: 'HbA1c', value: Number((5.6 + (i % 15) * 0.2).toFixed(1)), isCritical: (5.6 + (i % 15) * 0.2) > 7.0 },
        { biomarker: 'Total Cholesterol', value: 175 + (i % 40), isCritical: (175 + (i % 40)) > 200 },
        { biomarker: 'Serum Creatinine', value: Number((0.9 + (i % 10) * 0.1).toFixed(2)), isCritical: (0.9 + (i % 10) * 0.1) > 1.3 }
      ],
      testResults: [
        { name: 'Plasma Glucose (Fasting)', value: `${104 + (i % 25)}`, unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', status: 'COMPLETED' },
        { name: 'Glycated Hemoglobin (HbA1c)', value: `${(5.6 + (i % 15) * 0.2).toFixed(1)}`, unit: '%', referenceRange: '< 5.7 %', status: 'COMPLETED' },
        { name: 'Serum Creatinine', value: `${(0.9 + (i % 10) * 0.1).toFixed(2)}`, unit: 'mg/dL', referenceRange: '0.7 - 1.2 mg/dL', status: 'COMPLETED' }
      ]
    });
  }

  const samples = await Sample.insertMany(sampleDocs);
  console.log(`Created ${samples.length} Barcoded Diagnostic Samples.`);

  // ==========================================
  // 10. RESTAURANTS (16 Certified Cloud Kitchens & Regional Restaurants)
  // ==========================================
  console.log('\n[11/25] Seeding 16 Certified Cloud Kitchens across Indian Metros...');
  const restaurantSeeds = [
    { name: 'Arogya Sattva Cloud Kitchen', slug: 'arogya-sattva-cloud-kitchen', cuisine: ['Sattvic', 'Millet Bowls & Health', 'Diabetic-Friendly', 'South Indian'], oqi: 96, oil: 'Cold_Pressed_Mustard_Oil', fssai: '13622011000452', city: 'Hyderabad', lat: 17.4483, lng: 78.3915 },
    { name: "Nizam's Royal Heritage Biryani & Curries", slug: 'nizams-royal-heritage-biryani', cuisine: ['Mughlai', 'North Indian'], oqi: 88, oil: 'Desi_Cow_Ghee', fssai: '13621014000981', city: 'Hyderabad', lat: 17.4156, lng: 78.4357 },
    { name: 'Dakshin Delights Pure Veg & Tiffin', slug: 'dakshin-delights-pure-veg', cuisine: ['South Indian', 'Diabetic-Friendly'], oqi: 94, oil: 'Cold_Pressed_Sesame_Oil', fssai: '13623015000312', city: 'Hyderabad', lat: 17.4947, lng: 78.3996 },
    { name: 'Punjab Da Royal Kitchen & Tandoor', slug: 'punjab-da-royal-kitchen', cuisine: ['North Indian'], oqi: 86, oil: 'Cold_Pressed_Mustard_Oil', fssai: '13620012000843', city: 'Hyderabad', lat: 17.4401, lng: 78.3489 },
    { name: 'AyurBite Herb & Wellness Kitchen', slug: 'ayurbite-herb-wellness-kitchen', cuisine: ['Diabetic-Friendly', 'Sattvic', 'Millet Bowls & Health'], oqi: 98, oil: 'Desi_Cow_Ghee', fssai: '13624019000109', city: 'Hyderabad', lat: 17.4267, lng: 78.4289 },
    { name: 'Green Leaf Organic Millet Thali', slug: 'green-leaf-organic-millet', cuisine: ['Millet Bowls & Health', 'Sattvic'], oqi: 95, oil: 'Cold_Pressed_Sesame_Oil', fssai: '11222334000512', city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
    { name: 'Coastal Karavali Seafood & Millet Kitchen', slug: 'coastal-karavali-kitchen', cuisine: ['South Indian', 'Diabetic-Friendly'], oqi: 91, oil: 'Coconut_Oil', fssai: '11223345000678', city: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
    { name: 'The Great Indian Tiffin & Paratha House', slug: 'great-indian-tiffin-house', cuisine: ['North Indian', 'Diabetic-Friendly'], oqi: 89, oil: 'Desi_Cow_Ghee', fssai: '13321008000912', city: 'Delhi', lat: 28.5672, lng: 77.2244 },
    { name: 'Sattva Rasam & Steamed Idli Corner', slug: 'sattva-rasam-idli-corner', cuisine: ['South Indian', 'Sattvic'], oqi: 97, oil: 'Cold_Pressed_Sesame_Oil', fssai: '12422003000456', city: 'Chennai', lat: 13.0012, lng: 80.2565 },
    { name: 'Maratha Wada Authentic Bhakri & Pitla', slug: 'maratha-wada-bhakri', cuisine: ['Maharashtrian', 'Millet Bowls & Health'], oqi: 93, oil: 'Rice_Bran_Oil', fssai: '11521019000789', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
    { name: 'Swasthya Millet & Superfood Co.', slug: 'swasthya-millet-superfood', cuisine: ['Millet Bowls & Health', 'Diabetic-Friendly'], oqi: 96, oil: 'Cold_Pressed_Mustard_Oil', fssai: '11224009000123', city: 'Bengaluru', lat: 12.9250, lng: 77.5838 },
    { name: 'Awadh Dastarkhwan Heritage Kitchen', slug: 'awadh-dastarkhwan-heritage', cuisine: ['Mughlai', 'North Indian'], oqi: 87, oil: 'Desi_Cow_Ghee', fssai: '13323011000876', city: 'Delhi', lat: 28.5273, lng: 77.2159 },
    { name: 'Gujarat Kathiyawadi Healthy Handi', slug: 'gujarat-kathiyawadi-handi', cuisine: ['Sattvic', 'North Indian'], oqi: 92, oil: 'Cold_Pressed_Sesame_Oil', fssai: '10722020000345', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Bengal Sattvic Fish & Shorshe Kitchen', slug: 'bengal-sattvic-kitchen', cuisine: ['Bengali', 'Diabetic-Friendly'], oqi: 90, oil: 'Cold_Pressed_Mustard_Oil', fssai: '12821015000654', city: 'Kolkata', lat: 22.5867, lng: 88.4178 },
    { name: 'Dilli 6 Purani Dilli Healthy Tandoor', slug: 'dilli-6-healthy-tandoor', cuisine: ['North Indian'], oqi: 88, oil: 'Cold_Pressed_Mustard_Oil', fssai: '13324002000999', city: 'Delhi', lat: 28.6562, lng: 77.2410 },
    { name: 'Malabar Spice & Brown Rice Bowls', slug: 'malabar-spice-brown-rice', cuisine: ['South Indian', 'Diabetic-Friendly'], oqi: 94, oil: 'Coconut_Oil', fssai: '11322008000432', city: 'Kochi', lat: 9.9312, lng: 76.2673 },
  ];

  const restaurants = await Restaurant.insertMany(restaurantSeeds.map(r => ({
    name: r.name,
    slug: r.slug,
    description: `Biophysically audited kitchen certified with Oil Quality Index of ${r.oqi}/100 and zero reused cooking oil.`,
    cuisineTypes: r.cuisine,
    fssaiLicenseNumber: r.fssai,
    hygieneRating: Number((4.6 + (r.oqi % 5) * 0.08).toFixed(1)),
    oilQualityIndex: r.oqi,
    oilReplacementCycleHours: 18,
    primaryCookingMedium: r.oil,
    isCloudKitchen: true,
    kitchenDisplaySystem: {
      enabled: true,
      webhookUrl: `https://kds.biosyncai.internal/webhook/${r.slug}`,
      autoApplyModifications: true,
      supportedModifiers: ['LOW_SODIUM_KSALT', 'SUB_FOXTAIL_MILLET', 'SUB_BROWN_RICE', 'NO_REFINED_SUGAR_STEVIA', 'SUB_CURD_FOR_CREAM', 'EXTRA_FIBER_VEG_BULK']
    },
    address: {
      street: `Commercial Hub Road, ${r.city}`,
      area: 'Central Zone',
      city: r.city,
      state: 'India',
      pincode: '500001',
      coordinates: { lat: r.lat, lng: r.lng }
    },
    contact: { phone: '+91 98490 99888', email: `kitchen@${r.slug}.in` },
    rating: { average: 4.8, count: 420 },
    deliveryTimeEstimateMin: 25,
    costForTwo: 350,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    bannerUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    isVitalsGuardCertified: true,
    status: 'Active'
  })));
  console.log(`Created ${restaurants.length} Certified Restaurants.`);

  // ==========================================
  // 11. FOOD ITEMS (82 Biophysically Annotated Dishes)
  // ==========================================
  console.log('\n[12/25] Seeding 82 Biophysically Annotated Indian Dishes...');
  const foodItemSeeds = [
    { name: 'Foxtail Millet Khichdi with Moong Dal & Ghee', grain: 'Foxtail_Millet', cat: 'Main_Course', amylose: 0.28, rs3: 8.5, gi: 45, gl: 12, botanicals: ['Fenugreek', 'Curcumin'], price: 180, cal: 260 },
    { name: 'Steamed Ragi Mudde with Drumstick Sambar', grain: 'Ragi_Finger_Millet', cat: 'Main_Course', amylose: 0.32, rs3: 9.2, gi: 42, gl: 11, botanicals: ['Fenugreek', 'Moringa'], price: 160, cal: 240 },
    { name: 'Hyderabadi Dum Biryani (Traditional Dum Handi)', grain: 'Basmati_Aged_Rice', cat: 'Rice_Biryani', amylose: 0.18, rs3: 3.5, gi: 72, gl: 55, botanicals: ['Cinnamon', 'Clove'], price: 340, cal: 850, carbs: 125, netCarbs: 118, prot: 42, fat: 34 },
    { name: 'Karela Methi Stir-Fry with Cold-Pressed Mustard Oil', grain: 'None', cat: 'Ayur_Therapeutic', amylose: 0.15, rs3: 12.0, gi: 25, gl: 4, botanicals: ['Karela', 'Fenugreek'], price: 170, cal: 180 },
    { name: 'Fermented Jowar Dosa with Flaxseed Podi', grain: 'Jowar_Sorghum', cat: 'Breakfast', amylose: 0.30, rs3: 8.1, gi: 48, gl: 14, botanicals: ['Flaxseed', 'Asafoetida'], price: 140, cal: 210 },
    { name: 'Steamed Sona Masoori Idli with Tomato Rasam', grain: 'Sona_Masoori_White_Rice', cat: 'Breakfast', amylose: 0.25, rs3: 6.5, gi: 50, gl: 15, botanicals: ['Moringa', 'Black_Pepper'], price: 120, cal: 190 },
    { name: 'Foxtail Millet Upma with Roasted Almonds', grain: 'Foxtail_Millet', cat: 'Breakfast', amylose: 0.34, rs3: 10.5, gi: 38, gl: 9, botanicals: ['Curry_Leaves', 'Ginger'], price: 150, cal: 220 },
    { name: 'Palak Paneer with Methi Thepla (Whole Wheat)', grain: 'Whole_Wheat_Atta', cat: 'Main_Course', amylose: 0.24, rs3: 5.5, gi: 46, gl: 13, botanicals: ['Fenugreek', 'Garlic'], price: 260, cal: 420 },
    { name: 'Dal Tadka with Brown Basmati Jeera Rice', grain: 'Basmati_Aged_Rice', cat: 'Main_Course', amylose: 0.27, rs3: 7.2, gi: 54, gl: 17, botanicals: ['Cumin', 'Turmeric'], price: 210, cal: 360 },
    { name: 'Jowar Millet Pulao with Spiced Raita', grain: 'Jowar_Sorghum', cat: 'Millet_Specialty', amylose: 0.31, rs3: 9.8, gi: 40, gl: 10, botanicals: ['Cardamom', 'Cinnamon'], price: 190, cal: 270 },
  ];

  const allowedGrains = ['Foxtail_Millet', 'Brown_Rice', 'Ragi_Finger_Millet', 'Jowar_Sorghum', 'Whole_Wheat_Atta', 'Lentil_Dal', 'Basmati_Aged_Rice', 'Besan_Gram_Flour', 'Sona_Masoori_White_Rice', 'None'];
  const baseDishes = ['Khichdi Bowl', 'Spiced Pulao', 'Curry Platter', 'Handi Stew', 'Porridge Bowl', 'Stir Fry Special', 'Roti Meal Box', 'Soup Broth'];
  const categoriesList = ['Main_Course', 'Millet_Specialty', 'Ayur_Therapeutic', 'Rice_Biryani', 'Breakfast'];
  const botanicalSets = [
    ['Gymnema_Sylvestre', 'Fenugreek'],
    ['Cinnamon', 'Curcumin'],
    ['Karela', 'Jamun_Seed'],
    ['Ashwagandha', 'Brahmi'],
    ['Moringa', 'Black_Pepper'],
    ['Curcumin', 'Ginger']
  ];

  for (let i = 10; i < 82; i++) {
    const gr = allowedGrains[i % allowedGrains.length];
    const dish = baseDishes[i % baseDishes.length];
    const bSet = botanicalSets[i % botanicalSets.length];
    const cat = categoriesList[i % categoriesList.length];
    const amy = Number((0.25 + (i % 15) * 0.01).toFixed(2));
    const rs = Number((6.0 + (i % 12) * 0.5).toFixed(1));
    const gi = 38 + (i % 20);
    const gl = Math.round((gi * 25) / 100);

    foodItemSeeds.push({
      name: `${gr.replace(/_/g, ' ')} ${dish} #${i + 1}`,
      grain: gr,
      cat,
      amylose: amy,
      rs3: rs,
      gi,
      gl,
      botanicals: bSet,
      price: 150 + (i % 15) * 15,
      cal: 220 + (i % 20) * 15
    });
  }

  const foodItems = await FoodItem.insertMany(foodItemSeeds.map((f, idx) => ({
    restaurant: restaurants[idx % restaurants.length]._id,
    name: f.name,
    slug: f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: `Biophysically optimized meal prepared with ${f.grain.replace(/_/g, ' ')}, amylose ratio of ${f.amylose}, and botanical infusions (${f.botanicals.join(', ')}).`,
    category: f.cat,
    dietaryType: idx % 5 === 0 ? 'Non-Veg' : 'Veg',
    price: f.price,
    grainType: f.grain,
    amyloseRatio: f.amylose,
    resistantStarchPercent: f.rs3,
    glycemicIndex: f.gi,
    glycemicLoad: f.gl,
    botanicalInfusions: f.botanicals,
    servingWeightGrams: 300,
    calories: f.cal,
    carbohydrates_g: f.carbs || Math.round(f.cal * 0.55 / 4),
    netCarbohydrates_g: f.netCarbs || Math.round(f.cal * 0.45 / 4),
    protein_g: f.prot || Math.round(f.cal * 0.20 / 4),
    fat_g: f.fat || Math.round(f.cal * 0.25 / 9),
    fiber_g: Number((f.rs3 * 0.8).toFixed(1)),
    sodium_mg: 380,
    potassium_mg: 520,
    modificationsAvailable: [
      { code: 'SUB_FOXTAIL_MILLET', label: 'Substitute Foxtail Millet' },
      { code: 'LOW_SODIUM_KSALT', label: 'Low Sodium K-Salt' },
      { code: 'EXTRA_FIBER_VEG_BULK', label: 'Extra Soluble Fiber Garnish' },
      { code: 'NO_REFINED_SUGAR_STEVIA', label: 'Zero Refined Sugar / Stevia' }
    ],
    isAvailable: true,
    isVitalsGuardCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
  })));
  console.log(`Created ${foodItems.length} Biophysically Annotated Food Items.`);

  // ==========================================
  // 12. FAMILY GROUPS (10 Multi-Generational Groups)
  // ==========================================
  console.log('\n[13/25] Seeding 10 Multi-Generational Joint Family Groups...');
  const familyNames = [
    'The Rao Joint Family', 'The Sharma Parivar', 'The Patel Kutumbam',
    'The Iyer Heritage Family', 'The Mukherjee Household', 'The Gupta Metabolic Clan',
    'The Verma Active Parivar', 'The Nair Family Group', 'The Khan Joint Family', 'The Joshi Heritage Household'
  ];

  const familyGroupDocs = [];
  for (let i = 0; i < 10; i++) {
    const head = users[i * 5 % users.length];
    const member1 = users[(i * 5 + 1) % users.length];
    const member2 = users[(i * 5 + 2) % users.length];

    familyGroupDocs.push({
      name: familyNames[i],
      headUser: head._id,
      status: 'Active',
      members: [
        {
          user: head._id,
          nickname: `${head.firstName} (Head)`,
          relation: 'Self',
          age: 56 + (i % 15),
          clinicalConditions: ['Type_2_Diabetes', 'Hypertension'],
          metabolicTargets: { maxPostprandialGlucose: 135, maxSodiumPerMeal_mg: 450, maxCarbsPerMeal_g: 40, minProteinPerMeal_g: 22, isPotassiumRestricted: false },
          defaultPortionWeightFraction: 0.40
        },
        {
          user: member1._id,
          nickname: `${member1.firstName} (Spouse)`,
          relation: 'Spouse',
          age: 52 + (i % 12),
          clinicalConditions: ['Hypothyroidism'],
          metabolicTargets: { maxPostprandialGlucose: 140, maxSodiumPerMeal_mg: 500, maxCarbsPerMeal_g: 45, minProteinPerMeal_g: 20, isPotassiumRestricted: false },
          defaultPortionWeightFraction: 0.35
        },
        {
          user: member2._id,
          nickname: `${member2.firstName} (Child)`,
          relation: 'Son',
          age: 24 + (i % 8),
          clinicalConditions: ['None'],
          metabolicTargets: { maxPostprandialGlucose: 155, maxSodiumPerMeal_mg: 700, maxCarbsPerMeal_g: 65, minProteinPerMeal_g: 28, isPotassiumRestricted: false },
          defaultPortionWeightFraction: 0.25
        }
      ]
    });
  }

  const familyGroups = await FamilyGroup.insertMany(familyGroupDocs);
  console.log(`Created ${familyGroups.length} Multi-Generational Family Groups.`);

  // ==========================================
  // 13. FOOD ORDERS (85 Food Orders Across Complete Lifecycle)
  // ==========================================
  console.log('\n[14/25] Seeding 85 Food Orders with Cyber-Physical Hardware Hashes...');
  const orderStatuses = ['Placed', 'Kitchen_Confirmed', 'Cooking', 'Out_For_Delivery', 'Delivered', 'Delivered', 'Delivered', 'Cancelled'];
  const foodOrderDocs = [];

  for (let i = 0; i < 85; i++) {
    const user = users[i % users.length];
    const rest = restaurants[i % restaurants.length];
    const item1 = foodItems[i % foodItems.length];
    const item2 = foodItems[(i + 3) % foodItems.length];
    const st = orderStatuses[i % orderStatuses.length];
    const isVitalsGuard = i % 3 !== 0;
    const orderMode = isVitalsGuard ? 'VITALS_GUARD' : 'CHEAT_MODE_OVERRIDE';
    const subtotal = item1.price + (i % 2 === 0 ? item2.price : 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + 40 + tax;

    foodOrderDocs.push({
      orderNumber: `ORD-${Date.now().toString().slice(-6)}-${String(1000 + i).slice(-3)}`,
      user: user._id,
      restaurant: rest._id,
      orderStatus: st,
      orderMode,
      items: [
        {
          foodItem: item1._id,
          name: item1.name,
          price: item1.price,
          quantity: 1,
          appliedModifications: [{ code: 'LOW_SODIUM_KSALT', label: 'Low Sodium K-Salt', priceDelta: 0 }],
          itemTotal: item1.price
        },
        ...(i % 2 === 0 ? [{
          foodItem: item2._id,
          name: item2.name,
          price: item2.price,
          quantity: 1,
          appliedModifications: [],
          itemTotal: item2.price
        }] : [])
      ],
      subtotal,
      deliveryFee: 40,
      tax,
      totalAmount: total,
      userVitalsAtOrderTime: {
        fastingGlucose: 95,
        currentCGMGlucose: 108,
        cgmTrendArrow: 'FLAT',
        systolicBP: 122,
        diastolicBP: 78,
        heartRate: 72,
        eGFR: 95,
        activeMedications: isVitalsGuard ? [] : ['Metformin 500mg']
      },
      inSilicoPreOrderForecast: {
        simulatedPeakGlucose: isVitalsGuard ? 126 : 185,
        timeToPeakMin: 40,
        projectedAUC: isVitalsGuard ? 12000 : 18500,
        simulatedSystolicPeak: 128,
        simulatedDiastolicPeak: 82,
        glycemicExcursionCategory: isVitalsGuard ? 'SAFE_STABLE' : 'DANGEROUS_SPIKE',
        simulationTrajectory: [
          { timeMin: 0, plasmaGlucose: 95, interstitialGlucose: 92, systolicBP: 120 },
          { timeMin: 30, plasmaGlucose: isVitalsGuard ? 126 : 185, interstitialGlucose: 122, systolicBP: 124 },
          { timeMin: 60, plasmaGlucose: 110, interstitialGlucose: 108, systolicBP: 122 },
          { timeMin: 120, plasmaGlucose: 96, interstitialGlucose: 95, systolicBP: 120 }
        ]
      },
      mitigationPlan: {
        requiredAmbulationMinutes: isVitalsGuard ? 10 : 25,
        targetStepsToBurnExcursion: isVitalsGuard ? 1000 : 2500,
        recommendedWalkStartTimeMin: 25,
        preBiteSequencing: [
          { stepNumber: 1, phase: 'Fiber_Salad_First', instructions: 'Eat salad first', durationMin: 5 },
          { stepNumber: 2, phase: 'Protein_Fat_Second', instructions: 'Eat protein and fats', durationMin: 10 },
          { stepNumber: 3, phase: 'Starch_Carb_Last', instructions: 'Eat complex carbs last', durationMin: 15 }
        ],
        vinegarPreloadRecommended: !isVitalsGuard,
        insulinSplitBolusAdvice: !isVitalsGuard ? 'Split bolus 50% upfront, 50% at 60 mins' : ''
      },
      paymentStatus: st === 'Cancelled' ? 'Refunded' : 'Paid',
      paymentMethod: ['UPI', 'Card', 'HealthWallet'][i % 3],
      deliveryAddress: {
        houseNumber: user.address?.houseNumber || 'House 1',
        street: user.address?.street || 'Road 1',
        area: user.address?.city || 'Hitec City',
        city: user.address?.city || 'Hyderabad',
        state: user.address?.state || 'Telangana',
        pincode: user.address?.pincode || '500081'
      }
    });
  }

  const foodOrders = await FoodOrder.insertMany(foodOrderDocs);
  console.log(`Created ${foodOrders.length} Food Orders with Cyber-Physical Verification.`);

  // ==========================================
  // 14. IOT TELEMETRY (600 Downsampled 1-Minute Buckets)
  // ==========================================
  console.log('\n[15/25] Seeding 600 Downsampled 1-Minute IoT Wearable Telemetry Buckets...');
  const iotDocs = [];
  const baseTime = Date.now() - (600 * 60000);
  for (let i = 0; i < 600; i++) {
    const user = users[i % 20];
    const bucketStart = new Date(baseTime + (i * 60000));
    const bucketEnd = new Date(baseTime + ((i + 1) * 60000));
    const hr = 72 + Math.round(15 * Math.sin(i / 20));
    const sbp = Math.round(118 + 10 * Math.sin(i / 30));
    const dbp = Math.round(76 + 5 * Math.sin(i / 30));
    const gluc = 98 + Math.round(25 * Math.sin(i / 40));

    iotDocs.push({
      user: user._id,
      deviceId: 'biosync-smartwatch-01',
      bucketStartTime: bucketStart,
      bucketEndTime: bucketEnd,
      sampleCount: 60,
      heartRate: { min: hr - 3, max: hr + 4, mean: hr },
      spo2: { min: 97, max: 99, mean: 98 },
      bloodPressure: { systolicMean: sbp, diastolicMean: dbp },
      glucose: {
        start: gluc - 1,
        end: gluc + 1,
        min: gluc - 2,
        max: gluc + 2,
        mean: gluc,
        rateOfChangePerMinute: 0.2
      },
      skinTemperature: { mean: 36.6 },
      stepCount: hr > 80 ? 95 : 10,
      signalQualityIndex: 98
    });
  }

  const iotBuckets = await IoTTelemetry.insertMany(iotDocs);
  console.log(`Created ${iotBuckets.length} IoT Telemetry Buckets.`);

  // ==========================================
  // 15. ABDM CARE CONTEXTS (75 M1/M2/M3 Care Contexts)
  // ==========================================
  console.log('\n[16/25] Seeding 75 ABDM Care Contexts with FHIR R4 Bundles...');
  const careContextTypes = ['DIAGNOSTIC_REPORT', 'METABOLIC_TWIN_VITALS', 'IN_SILICO_MEAL_PLAN'];
  const abdmDocs = [];

  for (let i = 0; i < 75; i++) {
    const user = users[i % users.length];
    const sample = samples[i % samples.length];
    const order = foodOrders[i % foodOrders.length];
    const cType = careContextTypes[i % careContextTypes.length];
    const ref = `CC-IN3610001899-${cType.substring(0, 4)}-${(20260000 + i)}`;

    abdmDocs.push({
      userId: user._id,
      patientAbhaAddress: user.abha?.abhaAddress || 'patient@abdm',
      patientAbhaNumber: user.abha?.abhaNumber || '91-1234-5678-9012',
      careContextReference: ref,
      careContextType: cType,
      displayName: cType === 'DIAGNOSTIC_REPORT' 
        ? `Diagnostic Laboratory Assay: Barcode ${sample.barcode}`
        : cType === 'METABOLIC_TWIN_VITALS'
        ? `Longitudinal Hemodynamic & Glycemic Twin Record`
        : `In-Silico Biophysical Meal Modification Plan (Order #${order._id.toString().substring(18)})`,
      sampleId: cType === 'DIAGNOSTIC_REPORT' ? sample._id : null,
      orderId: cType === 'IN_SILICO_MEAL_PLAN' ? order._id : null,
      isLinked: true,
      linkToken: `TOKEN-AES256-${crypto.randomBytes(16).toString('hex')}`,
      status: 'LINKED',
      hipId: 'IN3610001899',
      fhirBundleId: `FHIR-R4-BUNDLE-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
      lastSyncTimestamp: new Date(),
      metadata: { fhirVersion: '4.0.1', profile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord' }
    });
  }

  const careContexts = await AbdmCareContext.insertMany(abdmDocs);
  console.log(`Created ${careContexts.length} ABDM Care Contexts.`);

  // ==========================================
  // 16. VERNACULAR FOOD LOGS (85 Multimodal Logs)
  // ==========================================
  console.log('\n[17/25] Seeding 85 Vernacular Voice & Visual Meal Logs...');
  const foodLogsData = [
    { name: 'Methi Thepla with Curd', text: 'Maine do methi thepla aur ek katori curd khaya tha breakfast me', lang: 'Hindi', carb: 42, prot: 14, fat: 12, spike: 28 },
    { name: 'Ragi Idli with Sambar', text: 'Nenu rendu ragi idli mariyu sambar thinnanu tiffin lo', lang: 'Telugu', carb: 38, prot: 10, fat: 4, spike: 22 },
    { name: 'Dosai with Kaara Chutney', text: 'Naan kaalail rendu dosai kaara chutney saapten', lang: 'Tamil', carb: 45, prot: 8, fat: 8, spike: 32 },
    { name: 'Jowar Bhakri with Dal', text: 'Mi don jowar bhakri ani dal khalli dupari', lang: 'Marathi', carb: 44, prot: 12, fat: 6, spike: 24 },
    { name: 'Foxtail Millet Pulao Bowl', text: 'Ate a large bowl of foxtail millet pulao with cucumber raita', lang: 'English', carb: 36, prot: 11, fat: 7, spike: 18 },
  ];

  const foodLogDocs = [];
  for (let i = 0; i < 85; i++) {
    const user = users[i % users.length];
    const template = foodLogsData[i % foodLogsData.length];

    foodLogDocs.push({
      user: user._id,
      imageUrl: 'https://images.biosync.ai/foodlogs/sample_meal.jpg',
      recognizedItemName: template.name,
      mealType: 'Lunch',
      source: 'Home_Cooked',
      nutrients: {
        calories: template.carb * 4 + template.prot * 4 + template.fat * 9,
        carbohydrates: template.carb,
        netCarbohydrates: template.carb - 6,
        proteins: template.prot,
        fats: template.fat,
        fiber: 6,
        sodium: 420,
        potassium: 550
      },
      glycemicIndex: 45,
      glycemicLoad: 12,
      servingWeightGrams: 280,
      consumedQuantity: 1,
      servingUnit: 'portion',
      servingSize: '1 standard bowl',
      isConfirmed: true,
      predictedImpact: {
        glucoseSpike: template.spike,
        peakGlucose: 105 + template.spike,
        timeToPeakGlucoseMin: 40,
        bpSpikeSystolic: 4,
        peakSystolicBP: 124,
        vitalSurgeCurve: [
          { minute: 0, glucose: 105, systolicBP: 120, insulinAction: 10 },
          { minute: 30, glucose: 105 + template.spike, systolicBP: 124, insulinAction: 45 },
          { minute: 60, glucose: 112, systolicBP: 121, insulinAction: 30 },
          { minute: 120, glucose: 104, systolicBP: 120, insulinAction: 12 }
        ],
        aiWarningMessage: template.spike > 30 ? 'Moderate glycemic excursion detected. Recommended 15-minute post-meal walk.' : 'Safe stable glucose excursion.'
      },
      aiConfidenceScore: 0.94,
      createdAt: new Date(Date.now() - (85 - i) * 6 * 3600 * 1000)
    });
  }

  const foodLogs = await FoodLog.insertMany(foodLogDocs);
  console.log(`Created ${foodLogs.length} Vernacular Food Logs.`);

  // ==========================================
  // 17. CHAT MESSAGES (120 AI Clinical Conversations)
  // ==========================================
  console.log('\n[18/25] Seeding 120 Clinical AI Health Chat Logs...');
  const chatDocs = [];
  for (let i = 0; i < 120; i++) {
    const user = users[i % users.length];
    const isUser = i % 2 === 0;

    chatDocs.push({
      user: user._id,
      role: isUser ? 'user' : 'assistant',
      content: isUser 
        ? 'What will my glucose spike look like if I eat two plates of Biryani tonight?'
        : 'Based on your continuous metabolic twin model and insulin resistance score (HOMA-IR: 4.2), consuming two plates of high-GI Biryani will elevate your postprandial glucose to approximately 188 mg/dL (+78 mg/dL spike). We strongly recommend activating Vitals Guard mode to substitute brown rice or foxtail millet, and pairing it with a 20-minute post-meal ambulation walk.',
      biomarkerContext: {
        glucoseFasting: 110,
        systolic: 125,
        diastolic: 82,
        restingHeartRate: 72,
        activeConditions: ['Type_2_Diabetes']
      },
      suggestedActions: isUser ? [] : [
        { title: 'Simulate Meal', actionType: 'NAVIGATE_SCAN', payload: 'FOXMILLET_PULAO' },
        { title: 'Check Vitals Twin', actionType: 'NAVIGATE_VITALS', payload: 'HEMODYNAMIC' }
      ],
      modelUsed: 'gemini-2.5-flash',
      tokensUsed: isUser ? 24 : 115,
      createdAt: new Date(Date.now() - (120 - i) * 4 * 3600 * 1000)
    });
  }

  const chatMessages = await ChatMessage.insertMany(chatDocs);
  console.log(`Created ${chatMessages.length} Clinical Chat Messages.`);

  // ==========================================
  // 18. NOTIFICATIONS (120 In-App & Push Notices)
  // ==========================================
  console.log('\n[19/25] Seeding 120 In-App & Push Notifications...');
  const notifDocs = [];
  const notifTypes = ['Appointments', 'Health', 'Reports', 'AI', 'Payments', 'System'];

  for (let i = 0; i < 120; i++) {
    const user = users[i % users.length];
    const t = notifTypes[i % notifTypes.length];

    notifDocs.push({
      title: t === 'Appointments' ? 'Phlebotomist Dispatched' : t === 'Reports' ? 'Lab Report Ready' : 'Metabolic Health Alert',
      message: t === 'Appointments' 
        ? 'Your phlebotomist is on the way with a cold-chain collection kit.' 
        : t === 'Reports' 
        ? 'Your verified HbA1c and Lipid Profile diagnostic report is ready for download.'
        : 'Your post-meal glucose excursion peaked safely at 122 mg/dL. Great dietary choice!',
      type: t,
      targetAudience: 'Specific',
      targetUserId: user._id,
      isRead: i % 2 === 0,
      createdAt: new Date(Date.now() - (120 - i) * 5 * 3600 * 1000)
    });
  }

  const notifications = await Notification.insertMany(notifDocs);
  console.log(`Created ${notifications.length} Notifications.`);

  // ==========================================
  // 19. SUPPORT TICKETS (40 Customer Issues)
  // ==========================================
  console.log('\n[20/25] Seeding 40 Customer Support Tickets...');
  const ticketDocs = [];
  const ticketStatuses = ['Open', 'In_Progress', 'Resolved', 'Closed'];

  for (let i = 0; i < 40; i++) {
    const user = users[i % users.length];
    const phleb = labAssistants[i % labAssistants.length];
    const st = ticketStatuses[i % ticketStatuses.length];

    ticketDocs.push({
      user: user._id,
      labAssistant: phleb._id,
      ticketType: ['Appointment', 'Payment', 'Food_Analysis', 'Technical_Issue'][i % 4],
      priority: ['Low', 'Medium', 'High', 'Urgent'][i % 4],
      subject: `Inquiry regarding sample collection slot #${1000 + i}`,
      description: 'Patient requested rescheduling of the home blood draw slot from morning to afternoon due to fasting requirements.',
      status: st,
      createdAt: new Date(Date.now() - (40 - i) * 12 * 3600 * 1000)
    });
  }

  const tickets = await Ticket.insertMany(ticketDocs);
  console.log(`Created ${tickets.length} Support Tickets.`);

  // ==========================================
  // 20. TRANSACTIONS (135 Financial Revenue Records)
  // ==========================================
  console.log('\n[21/25] Seeding 135 Financial Transactions...');
  const txnDocs = [];
  for (let i = 0; i < 135; i++) {
    const user = users[i % users.length];
    const appt = appointments[i % appointments.length];
    const isSuccess = i % 10 !== 0;

    txnDocs.push({
      user: user._id,
      appointment: appt._id,
      amount: 499 + (i % 15) * 100,
      currency: 'INR',
      status: isSuccess ? 'Success' : 'Refunded',
      paymentGateway: 'Razorpay_UPI',
      gatewayTransactionId: `pay_${crypto.randomBytes(8).toString('hex')}`,
      revenueType: i % 3 === 0 ? 'Consultation' : 'Lab_Test',
      createdAt: new Date(Date.now() - (135 - i) * 6 * 3600 * 1000)
    });
  }

  const transactions = await Transaction.insertMany(txnDocs);
  console.log(`Created ${transactions.length} Financial Transactions.`);

  // ==========================================
  // 21. AUDIT LOGS (100 Immutable Security Traces)
  // ==========================================
  console.log('\n[22/25] Seeding 100 Enterprise Security Audit Logs...');
  const auditDocs = [];
  for (let i = 0; i < 100; i++) {
    const admin = admins[i % admins.length];
    const sample = samples[i % samples.length];

    auditDocs.push({
      actorModel: 'Admin',
      actorId: admin._id,
      action: ['Viewed', 'Updated', 'Assigned', 'Status_Change'][i % 4],
      targetModel: 'Sample',
      targetId: sample._id,
      details: `Admin ${admin.name} verified chain-of-custody for sample ${sample.barcode}`,
      ipAddress: `192.168.1.${10 + (i % 50)}`,
      createdAt: new Date(Date.now() - (100 - i) * 4 * 3600 * 1000)
    });
  }

  const auditLogs = await AuditLog.insertMany(auditDocs);
  console.log(`Created ${auditLogs.length} Audit Logs.`);

  // ==========================================
  // 22. SYSTEM LOGS (100 Infrastructure Telemetry Traces)
  // ==========================================
  console.log('\n[23/25] Seeding 100 Infrastructure System Health Logs...');
  const systemDocs = [];
  for (let i = 0; i < 100; i++) {
    systemDocs.push({
      level: i % 15 === 0 ? 'WARNING' : 'INFO',
      module: ['ABDM_Gateway', 'IoT_Ingestion', 'KDS_Webhook', 'FastAPI_ODE_Solver', 'Biophysical_Sim'][i % 5],
      message: `Operational telemetry check passed for microservice cluster node ${1 + (i % 4)}`,
      endpointCalled: '/api/v1/hardware/read-optical-oil-sensor',
      method: 'POST',
      executionTimeMs: 14 + (i % 25),
      createdAt: new Date(Date.now() - (100 - i) * 3 * 3600 * 1000)
    });
  }

  const systemLogs = await SystemLog.insertMany(systemDocs);
  console.log(`Created ${systemLogs.length} System Logs.`);

  // ==========================================
  // 23. AI LOGS (100 AI Engine Model Telemetry Traces)
  // ==========================================
  console.log('\n[24/25] Seeding 100 AI Simulation & Neural Model Logs...');
  const aiLogDocs = [];
  for (let i = 0; i < 100; i++) {
    const user = users[i % users.length];

    aiLogDocs.push({
      user: user._id,
      interactionType: ['Food_Scan', 'Trajectory_Prediction', 'Report_Analysis', 'Symptom_Analysis'][i % 4],
      inputDataSummary: '7-compartment ODE Runge-Kutta solver with starch digestion enzyme kinetics',
      aiOutputSummary: 'Glycemic excursion predicted: Safe peak at 128 mg/dL with zero hypoglycemia risk',
      confidenceScore: 0.96,
      status: 'Success',
      userRating: 5,
      createdAt: new Date(Date.now() - (100 - i) * 3 * 3600 * 1000)
    });
  }

  const aiLogs = await AILog.insertMany(aiLogDocs);
  console.log(`Created ${aiLogs.length} AI Logs.`);

  // ==========================================
  // 24. MEMBER APPLICATIONS (16 Phlebotomist & Clinical Staff Applications)
  // ==========================================
  console.log('\n[25a/25] Seeding 16 Phlebotomist & Staff Applications...');
  const memberAppDocs = [];
  const appStatuses = ['Pending', 'Reviewed', 'Accepted', 'Rejected'];

  for (let i = 0; i < 16; i++) {
    memberAppDocs.push({
      name: `Applicant Candidate ${i + 1}`,
      email: `candidate${i + 1}@biosynccareers.in`,
      phone: `91234990${(10 + i).toString()}`,
      experience: `${3 + (i % 6)} years experience in venous puncture and cold-chain diagnostics.`,
      resumePath: `/uploads/resumes/candidate_${i + 1}_resume.pdf`,
      status: appStatuses[i % appStatuses.length]
    });
  }

  const memberApplications = await MemberApplication.insertMany(memberAppDocs);
  console.log(`Created ${memberApplications.length} Member Applications.`);

  // ==========================================
  // 25. USER DRAFTS (25 Saved User Flow Drafts)
  // ==========================================
  console.log('[25b/25] Seeding 25 User Workflow Drafts...');
  const draftTypes = ['appointment_booking', 'health_setup', 'food_scan', 'profile_edit'];
  const userDraftDocs = [];

  for (let i = 0; i < 25; i++) {
    const user = users[i];

    userDraftDocs.push({
      user: user._id,
      draftType: draftTypes[i % draftTypes.length],
      step: 2,
      totalSteps: 4,
      data: {
        selectedTestId: testCatalog[i % testCatalog.length]._id,
        preferredTime: '08:30 AM',
        fastingConfirmed: true
      },
      lastSaved: new Date()
    });
  }

  const userDrafts = await UserDraft.insertMany(userDraftDocs);
  console.log(`Created ${userDrafts.length} User Drafts.`);

  // ==========================================
  // FINAL SEEDING AUDIT SUMMARY
  // ==========================================
  console.log('\n======================================================================');
  console.log('  🎉 MASSIVE DATABASE SEEDING COMPLETED & VERIFIED ACROSS ALL 25 MODELS!');
  console.log('======================================================================');
  console.log(`  1. Roles:                  ${roles.length}`);
  console.log(`  2. Admins:                 ${admins.length}`);
  console.log(`  3. Doctors:                ${doctors.length}`);
  console.log(`  4. Phlebotomists:          ${labAssistants.length}`);
  console.log(`  5. Test Catalog Packages:  ${testCatalog.length}`);
  console.log(`  6. Patients / Users:       ${users.length}`);
  console.log(`  7. Longitudinal Vitals:    ${vitals.length}`);
  console.log(`  8. Appointments:           ${appointments.length}`);
  console.log(`  9. Diagnostic Samples:     ${samples.length}`);
  console.log(` 10. Certified Restaurants:  ${restaurants.length}`);
  console.log(` 11. Biophysical Food Items: ${foodItems.length}`);
  console.log(` 12. Joint Family Groups:    ${familyGroups.length}`);
  console.log(` 13. Food Orders:            ${foodOrders.length}`);
  console.log(` 14. IoT Telemetry Buckets:  ${iotBuckets.length}`);
  console.log(` 15. ABDM Care Contexts:     ${careContexts.length}`);
  console.log(` 16. Vernacular Food Logs:   ${foodLogs.length}`);
  console.log(` 17. Clinical Chat Messages: ${chatMessages.length}`);
  console.log(` 18. Notifications:          ${notifications.length}`);
  console.log(` 19. Support Tickets:        ${tickets.length}`);
  console.log(` 20. Financial Transactions: ${transactions.length}`);
  console.log(` 21. Security Audit Logs:    ${auditLogs.length}`);
  console.log(` 22. System Health Logs:     ${systemLogs.length}`);
  console.log(` 23. AI Telemetry Logs:      ${aiLogs.length}`);
  console.log(` 24. Member Applications:    ${memberApplications.length}`);
  console.log(` 25. User Flow Drafts:       ${userDrafts.length}`);
  console.log('======================================================================\n');

  return {
    roles, admins, doctors, labAssistants, testCatalog, users, vitals,
    appointments, samples, restaurants, foodItems, familyGroups, foodOrders,
    iotBuckets, careContexts, foodLogs, chatMessages, notifications,
    tickets, transactions, auditLogs, systemLogs, aiLogs, memberApplications, userDrafts
  };
}

if (process.argv[1] && process.argv[1].endsWith('seedMassiveDataset.js')) {
  seedMassiveDataset()
    .then(async () => {
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\n❌ FATAL SEEDING ERROR:', err);
      if (mongoose.connection) await mongoose.connection.close();
      process.exit(1);
    });
}

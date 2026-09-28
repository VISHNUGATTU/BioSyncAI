import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import LabAssistant from './models/LabAssistant.js';
import User from './models/User.js';
import Appointment from './models/Appointment.js';
import Sample from './models/Sample.js';
import Transaction from './models/Transaction.js';
import TestCatalog from './models/TestCatalog.js';

dotenv.config();

const seedStaffAndAppointments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for Seeding');

    // 1. Create a dummy User
    let user = await User.findOne({ phoneNumber: '1122334455' });
    if (!user) {
      user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1122334455',
        password: await bcrypt.hash('password123', 10),
        address: '123 Fake Street, Tech City',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
      });
      console.log('Created dummy user');
    }

    // 2. Create a Lab Assistant (for login)
    let labAssistant = await LabAssistant.findOne({ phone: '9876543210' });
    if (!labAssistant) {
      labAssistant = await LabAssistant.create({
        name: 'Demo Assistant',
        phone: '9876543210',
        password: await bcrypt.hash('password123', 10),
        employeeId: 'EMP001',
        status: 'Available',
        vehicleType: 'Two-Wheeler',
        vehicleNumber: 'TS-09-XX-1234',
        shiftTiming: { start: '09:00', end: '17:00' },
      });
      console.log('Created demo Lab Assistant');
    }

    // 3. Create an Appointment assigned to the Lab Assistant
    let appointment = await Appointment.findOne({ labAssistant: labAssistant._id });
    if (!appointment) {
      appointment = await Appointment.create({
        user: user._id,
        labAssistant: labAssistant._id,
        status: 'Assistant_Assigned', // Urgency trigger in dashboard
        scheduledDate: new Date(),
        timeSlot: '09:00 AM - 10:00 AM',
        appointmentType: 'Lab_Collection',
        address: {
          houseNumber: '123',
          street: 'Fake Street',
          city: 'Tech City',
          coordinates: { lat: 17.3850, lng: 78.4867 }
        },
        collectionOTP: '123456',
        trackingLogs: [{ status: 'Assistant_Assigned', timestamp: new Date() }]
      });
      console.log('Created dummy Appointment assigned to Lab Assistant');
      
      // 4. Create dummy Transaction
      await Transaction.create({
        appointment: appointment._id,
        user: user._id,
        amount: 1500,
        type: 'Cash_On_Collection',
        status: 'Pending'
      });
      
      // 5. Create dummy TestCatalog
      let test = await TestCatalog.findOne({ testCode: 'CBC01' });
      if (!test) {
        test = await TestCatalog.create({
          testName: 'Complete Blood Count',
          testCode: 'CBC01',
          description: 'Basic blood test',
          category: 'Pathology',
          price: 500,
          sampleType: 'Blood',
          fastingRequired: false,
          turnAroundTime: 24
        });
      }

      // 6. Create dummy Sample
      await Sample.create({
        user: user._id,
        appointment: appointment._id,
        testCatalog: test._id,
        status: 'Assigned'
      });
    } else {
      console.log('Appointment already exists for this Lab Assistant');
    }

    console.log('Seeding Success!');
    process.exit();
  } catch (error) {
    console.error('Error with Seeding:', error);
    process.exit(1);
  }
};

seedStaffAndAppointments();

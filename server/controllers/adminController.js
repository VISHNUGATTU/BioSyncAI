import mongoose from 'mongoose';
import User from '../models/User.js';
import LabAssistant from '../models/LabAssistant.js';
import Appointment from '../models/Appointment.js';
import SystemLog from '../models/SystemLog.js';
import Ticket from '../models/Ticket.js';
import FoodLog from '../models/FoodLog.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import bcrypt from 'bcryptjs';
import MemberApplication from '../models/MemberApplication.js';
import AILog from '../models/AILog.js';
import Sample from '../models/Sample.js';
import Transaction from '../models/Transaction.js';
import Vitals from '../models/Vitals.js';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js'; 
import Doctor from '../models/Doctor.js';
import AuditLog from '../models/AuditLog.js';

const generateAdminTokenAndCookie = (res, adminId) => {
  const token = jwt.sign({ id: adminId }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
};

export const getDashboardKPIs = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    totalLabAssistants,
    testsCompleted,
    pendingTests,
    revenueData,
    criticalAlerts,
    appointmentsToday
  ] = await Promise.all([
    User.estimatedDocumentCount(), // Faster than countDocuments
    LabAssistant.countDocuments({ status: { $ne: 'Off_Duty' } }),
    Sample.countDocuments({ status: 'Report_Generated' }),
    Sample.countDocuments({ status: { $in: ['Requested', 'Assigned', 'Sample_Collected', 'At_Laboratory', 'Processing'] } }),
    Transaction.aggregate([
      { $match: { status: 'Success' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]),
    Vitals.countDocuments({ criticalAlertTriggered: true }),
    Appointment.countDocuments({ scheduledDate: { $gte: startOfDay,$lte: endOfDay } })
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  res.status(200).json({
    success: true,
    data: { totalUsers, activeLabAssistants: totalLabAssistants, testsCompleted, pendingTests, criticalAlerts, totalRevenue, appointmentsToday }
  });
});

export const getCriticalAlerts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  
  const alerts = await Vitals.find({ criticalAlertTriggered: true })
    .populate('user', 'firstName lastName phoneNumber')
    .sort({ recordedAt: -1 })
    .limit(limit)
    .select('user criticalAlertDetails recordedAt')
    .lean();

  res.status(200).json({ success: true, count: alerts.length, data: alerts });
});

export const getAIMonitoring = asyncHandler(async (req, res) => {
  const aiStats = await AILog.aggregate([
    {
      $group: {
        _id: '$interactionType',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidenceScore' },
        failures: { $sum: {$cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } }
      }
    }
  ]);

  res.status(200).json({ success: true, data: aiStats });
});

export const getSamplePipeline = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;

  const pipeline = await Sample.find()
    .populate('user', 'firstName')
    .populate('labAssistant', 'name')
    .populate('testCatalog', 'testName')
    .sort({ updatedAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .lean();

  const total = await Sample.countDocuments();

  res.status(200).json({ 
    success: true, 
    count: pipeline.length, 
    total,
    pagination: { page, limit },
    data: pipeline 
  });
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const admin = await Admin.findOne({ email }).select('+password').lean();

  if (admin && (await bcrypt.compare(password, admin.password))) {
    const token = generateAdminTokenAndCookie(res, admin._id);
    
    res.status(200).json({
      success: true,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
      token
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    res.status(400);
    throw new Error('Admin already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const admin = await Admin.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'SuperAdmin'
  });

  if (admin) {
    res.status(201).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid admin data');
  }
});

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const [userRegistrations, testTypesDistribution, activeInactiveUsers, appointmentStats] = await Promise.all([
    User.aggregate([
      { $group: { _id: { $dateToString: { format: "\%Y-\%m-\%d", date: "$createdAt" } }, count: { $sum: 1 } } },       {$sort: { _id: 1 } }
    ]),
    Sample.aggregate([
      { $lookup: { from: 'testcatalogs', localField: 'testCatalog', foreignField: '_id', as: 'testDetails' } },
      { $unwind: '$testDetails' },
      { $group: { _id: '$testDetails.testName', count: {$sum: 1 } } }
    ]),
    User.aggregate([
      { $group: { _id: '$accountStatus', count: {$sum: 1 } } }
    ]),
    Appointment.aggregate([
      { $group: { _id: '$status', count: {$sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: { userRegistrations, testTypesDistribution, activeInactiveUsers, appointmentStats }
  });
});

export const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, activeStaff, pendingApps] = await Promise.all([
    User.countDocuments(),
    LabAssistant.countDocuments({ status: { $ne: 'Off_Duty' } }), 
    MemberApplication.countDocuments({ status: 'Pending' })
  ]);

  res.status(200).json({ totalUsers, activeStaff, pendingApps });
});

export const getSystemLogs = asyncHandler(async (req, res) => {
  const { level } = req.query; 
  const query = level ? { level } : {};

  const logs = await SystemLog.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'phoneNumber firstName')
    .lean();

  res.status(200).json({ success: true, count: logs.length, data: logs });
});

export const createLabAssistant = asyncHandler(async (req, res) => {
  const { name, phone, password, employeeId, gender, bloodGroup, vehicleType, vehicleNumber, startShift, endShift, assignedZones } = req.body;

  if (!name || !phone || !password) {
    res.status(400);
    throw new Error('Name, phone, and password are required.');
  }

  const assistantExists = await LabAssistant.exists({ phone });
  if (assistantExists) {
    res.status(400);
    throw new Error('A lab assistant with this phone number already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const labAssistant = await LabAssistant.create({
    name,
    phone,
    password: hashedPassword,
    employeeId,
    gender,
    bloodGroup,
    vehicleType,
    vehicleNumber,
    shiftTiming: { start: startShift, end: endShift },
    assignedZones: assignedZones ? assignedZones.split(',').map(z => z.trim()) : []
  });

  res.status(201).json({ success: true, labAssistant });
});

export const getLabAssistants = asyncHandler(async (req, res) => {
  const labAssistants = await LabAssistant.find({}).select('-password').lean();
  res.status(200).json({ success: true, count: labAssistants.length, labAssistants });
});

export const updateLabAssistant = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.assignedZones && typeof updates.assignedZones === 'string') {
    updates.assignedZones = updates.assignedZones.split(',').map(z => z.trim());
  }

  const labAssistant = await LabAssistant.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password').lean();

  if (!labAssistant) {
    res.status(404);
    throw new Error('Lab assistant not found.');
  }

  res.status(200).json({ success: true, labAssistant });
});

export const deleteLabAssistant = asyncHandler(async (req, res) => {
  const labAssistant = await LabAssistant.findByIdAndDelete(req.params.id);
  if (!labAssistant) {
    res.status(404);
    throw new Error('Lab assistant not found.');
  }
  res.status(200).json({ success: true, message: 'Lab assistant removed.' });
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const tickets = await Ticket.find(query)
    .populate('user', 'firstName phoneNumber')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: tickets.length, data: tickets });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  
  const query = status ? { accountStatus: status } : {};
  
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(parseInt(limit, 10))
    .lean();
    
  const total = await User.countDocuments(query);
    
  res.status(200).json({ 
    success: true, 
    count: users.length,
    total,
    data: users 
  });
});

export const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -otp').lean();
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const [vitals, appointments, samples] = await Promise.all([
    Vitals.find({ user: user._id }).sort({ recordedAt: -1 }).lean(),
    Appointment.find({ user: user._id }).sort({ scheduledDate: -1 }).lean(),
    Sample.find({ user: user._id }).populate('testCatalog', 'testName').sort({ createdAt: -1 }).lean()
  ]);

  res.status(200).json({ success: true, user, vitals, appointments, samples });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { accountStatus, suspensionReason } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (accountStatus) {
    user.accountStatus = accountStatus;
    if (accountStatus === 'Suspended') {
      user.suspensionReason = suspensionReason || 'No reason provided';
    }
  }

  await user.save();
  res.status(200).json({ success: true, message: 'User status updated', user: { id: user._id, accountStatus: user.accountStatus } });
});

export const assignLabAssistantToSample = asyncHandler(async (req, res) => {
  const { labAssistantId } = req.body;
  const sampleId = req.params.id;

  const sample = await Sample.findById(sampleId);
  if (!sample) {
    res.status(404);
    throw new Error('Sample not found');
  }

  const labAssistant = await LabAssistant.findById(labAssistantId).lean();
  if (!labAssistant) {
    res.status(404);
    throw new Error('Lab Assistant not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    sample.labAssistant = labAssistant._id;
    sample.status = 'Assigned';
    await sample.save({ session });

    if (sample.appointment) {
      await Appointment.findByIdAndUpdate(
        sample.appointment, 
        { $set: { status: 'Assistant_Assigned', labAssistant: labAssistant._id } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Lab Assistant assigned to sample and appointment updated.', sample });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(`Failed to assign lab assistant: ${error.message}`);
  }
});

export const getTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;

  const transactions = await Transaction.find({})
    .populate('user', 'firstName lastName email phoneNumber')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .lean();
    
  const total = await Transaction.countDocuments();

  res.status(200).json({ 
    success: true, 
    count: transactions.length, 
    total,
    data: transactions 
  });
});

export const updateAdminProfile = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const admin = await Admin.findById(req.admin._id);

  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

  admin.name = name || admin.name;
  admin.email = email || admin.email;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
  }

  const updatedAdmin = await admin.save();
  res.status(200).json({
    success: true,
    admin: {
      id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      role: updatedAdmin.role
    }
  });
});

export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const revenueByTest = await Transaction.aggregate([
    { $match: { status: 'Success', revenueType: 'Lab_Test' } }, // Using revenueType from Transaction Schema
    { $group: { _id: '$appointment', totalRevenue: {$sum: '$amount' }, count: {$sum: 1 } } }
  ]);

  const refundStats = await Transaction.aggregate([
    { $match: { status: 'Refunded' } },
    { $group: { _id: null, totalRefunded: {$sum: '$amount' }, count: {$sum: 1 } } }
  ]);

  const pendingPayments = await Transaction.countDocuments({ status: 'Pending' });

  res.status(200).json({
    success: true,
    data: {
      revenueByTest,
      refundStats: refundStats.length > 0 ? refundStats[0] : { totalRefunded: 0, count: 0 },
      pendingPayments
    }
  });
});

export const getAllReports = asyncHandler(async (req, res) => {
  const reports = await Sample.find({ status: { $in: ['Report_Generated', 'Processing'] } })
    .populate('user', 'firstName lastName')
    .populate('testCatalog', 'testName')
    .sort({ updatedAt: -1 })
    .lean();
  res.status(200).json({ success: true, count: reports.length, data: reports });
});

export const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, count: doctors.length, data: doctors });
});

export const getAllAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find()
    .populate('user', 'firstName lastName')
    .sort({ scheduledDate: -1 })
    .lean();
  res.status(200).json({ success: true, count: appointments.length, data: appointments });
});

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await Admin.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);
  const roleDefinitions = {
    'SuperAdmin': 'Full System Access',
    'Data_Analyst': 'Read-only Analytics, Finances',
    'Support_Staff': 'Tickets, Users, Appointments'
  };
  const data = roles.map(r => ({
    name: r._id,
    access: roleDefinitions[r._id] || 'Limited Access',
    users: r.count
  }));
  res.status(200).json({ success: true, data });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.status(200).json({ success: true, count: logs.length, data: logs });
});
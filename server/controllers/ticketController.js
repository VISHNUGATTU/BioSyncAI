import Ticket from '../models/Ticket.js';
import asyncHandler from '../middlewares/asyncHandler.js';

export const createTicket = asyncHandler(async (req, res) => {
  const { subject, description, priority, category } = req.body;

  const ticket = await Ticket.create({
    user: req.user._id,
    subject,
    description,
    priority: priority || 'Medium',
    ticketType: category || 'Support',
    status: 'Open'
  });

  res.status(201).json({ success: true, data: ticket });
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const tickets = await Ticket.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
    
  res.status(200).json({ success: true, count: tickets.length, data: tickets });
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;

  const tickets = await Ticket.find({})
    .populate('user', 'firstName lastName phoneNumber')
    .sort({ status: -1, priority: 1, createdAt: -1 }) // Sort opens and highs first
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
    
  res.status(200).json({ success: true, count: tickets.length, data: tickets });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, adminResponse } = req.body;

  const updateOperation = { $set: {} };
  if (status) updateOperation.$set.status = status;
  
  if (adminResponse) {
    // CRITICAL: Atomic array update prevents race conditions
    updateOperation.$push = {
      resolutionNotes: `[Admin Reply - ${new Date().toISOString()}]: ${adminResponse}\n`
    };
  }

  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id, 
    updateOperation, 
    { new: true, runValidators: true }
  ).lean();

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  res.status(200).json({ success: true, data: ticket });
});
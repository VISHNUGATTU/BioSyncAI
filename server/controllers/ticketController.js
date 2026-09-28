import Ticket from '../models/Ticket.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Create new support/complaint ticket
// @route   POST /api/tickets
// @access  Private (User)
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, description, priority, category, ticketType, attachments } = req.body;

  if (!subject || !description) {
    res.status(400);
    throw new Error('Subject and description are required.');
  }

  const type = ticketType || category || 'Support';

  const ticket = await Ticket.create({
    user: req.user._id,
    subject,
    description,
    priority: priority || 'Medium',
    ticketType: type,
    status: 'Open',
    attachments: attachments || [],
    messages: [{
      senderId: req.user._id,
      senderRole: 'User',
      senderName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'User',
      message: description,
      createdAt: new Date()
    }]
  });

  res.status(201).json({ success: true, data: ticket });
});

// @desc    Get user's personal tickets
// @route   GET /api/tickets/my
// @access  Private (User)
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

// @desc    User or Staff/Admin reply to ticket thread
// @route   POST /api/tickets/:id/reply
// @access  Private (General: User or Admin)
export const replyToTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const ticketId = req.params.id;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('Message content is required.');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const isUser = Boolean(req.user);
  const senderId = isUser ? req.user._id : (req.admin ? req.admin._id : req.labAssistant?._id);
  const senderRole = isUser ? 'User' : (req.admin ? 'Admin' : 'LabAssistant');
  const senderName = isUser 
    ? (`${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'User')
    : (req.admin?.name || req.labAssistant?.name || 'Support Staff');

  ticket.messages.push({
    senderId,
    senderRole,
    senderName,
    message: message.trim(),
    createdAt: new Date()
  });

  // If user replies to a resolved ticket, reopen it
  if (isUser && ticket.status === 'Resolved') {
    ticket.status = 'Reopened';
  }

  await ticket.save();

  res.status(200).json({ success: true, message: 'Reply sent successfully', data: ticket });
});

// @desc    Get all tickets for Admin
// @route   GET /api/tickets/all
// @access  Private (Admin)
export const getAllTickets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const { status, priority, category } = req.query;

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.ticketType = category;

  const tickets = await Ticket.find(query)
    .populate('user', 'firstName lastName phoneNumber')
    .sort({ status: -1, priority: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
    
  res.status(200).json({ success: true, count: tickets.length, data: tickets });
});

// @desc    Update ticket status, assign admin, or add resolution note
// @route   PUT /api/tickets/:id/status
// @access  Private (Admin)
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, adminResponse, assignedAdmin } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (status) {
    ticket.status = status;
    if (status === 'Resolved' || status === 'Closed') {
      ticket.resolvedAt = new Date();
    }
  }

  if (assignedAdmin) {
    ticket.assignedAdmin = assignedAdmin;
  }

  if (adminResponse && adminResponse.trim()) {
    const adminName = req.admin?.name || 'Support Administrator';
    
    // Add to resolutionNotes array
    ticket.resolutionNotes.push({
      note: adminResponse.trim(),
      addedBy: adminName,
      createdAt: new Date()
    });

    // Also add to public messages thread so user can see it
    ticket.messages.push({
      senderId: req.admin?._id,
      senderRole: 'Admin',
      senderName: adminName,
      message: adminResponse.trim(),
      createdAt: new Date()
    });
  }

  await ticket.save();

  res.status(200).json({ success: true, message: 'Ticket updated successfully', data: ticket });
});
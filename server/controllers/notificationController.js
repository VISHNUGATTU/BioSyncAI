import Notification from '../models/Notification.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Send a notification
// @route   POST /api/notifications
// @access  Private/Admin
export const sendNotification = asyncHandler(async (req, res) => {
  const { title, message, type, targetAudience, targetUserId } = req.body;

  const notification = await Notification.create({
    title,
    message,
    type: type || 'System_Alert',
    targetAudience: targetAudience || 'All',
    targetUserId
  });

  // Future expansion: Trigger FCM push notification here asynchronously
  
  res.status(201).json({ success: true, data: notification });
});

// @desc    Get user's unread notifications
// @route   GET /api/notifications
// @access  Private (User/LabAssistant)
export const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user._id : req.labAssistant._id;
  
  // Pagination to prevent memory exhaustion if a user has hundreds of unread alerts
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30; 
  const startIndex = (page - 1) * limit;
  
  const notifications = await Notification.find({
    $or: [
      { targetAudience: 'All' },
      { targetAudience: req.user ? 'Users' : 'LabAssistants' },
      { targetUserId: userId }
    ],
    isRead: false
  })
  .sort({ createdAt: -1 })
  .skip(startIndex)
  .limit(limit)
  .lean(); // Faster execution without heavy Mongoose object wrappers

  res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { $set: { isRead: true } }, // Use atomic $set operator
    { new: true, runValidators: true }
  ).lean();

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json({ success: true, data: notification });
});
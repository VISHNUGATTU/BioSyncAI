import Notification from '../models/Notification.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Send a notification
// @route   POST /api/notifications
// @access  Private/Admin
export const sendNotification = asyncHandler(async (req, res) => {
  const { title, message, type, targetAudience, targetUserId, metadata } = req.body;

  const notification = await Notification.create({
    title,
    message,
    type: type || 'System',
    targetAudience: targetAudience || 'Specific',
    targetUserId,
    metadata: metadata || {}
  });

  res.status(201).json({ success: true, data: notification });
});

// @desc    Get user's notifications (all or unread only, with unreadCount)
// @route   GET /api/notifications
// @access  Private (User/LabAssistant)
export const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user._id : req.labAssistant._id;
  const userAudience = req.user ? 'Users' : 'LabAssistants';
  const { unreadOnly, page = 1, limit = 30 } = req.query;
  
  const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  
  const baseQuery = {
    $or: [
      { targetAudience: 'All' },
      { targetAudience: userAudience },
      { targetUserId: userId }
    ]
  };

  if (unreadOnly === 'true') {
    baseQuery.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(parseInt(limit, 10))
      .lean(),
    Notification.countDocuments(baseQuery),
    Notification.countDocuments({
      $or: [
        { targetAudience: 'All' },
        { targetAudience: userAudience },
        { targetUserId: userId }
      ],
      isRead: false
    })
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    data: notifications
  });
});

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { $set: { isRead: true } },
    { new: true, runValidators: true }
  ).lean();

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json({ success: true, data: notification });
});

// @desc    Mark all user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user._id : req.labAssistant._id;
  const userAudience = req.user ? 'Users' : 'LabAssistants';

  await Notification.updateMany(
    {
      $or: [
        { targetAudience: 'All' },
        { targetAudience: userAudience },
        { targetUserId: userId }
      ],
      isRead: false
    },
    { $set: { isRead: true } }
  );

  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});
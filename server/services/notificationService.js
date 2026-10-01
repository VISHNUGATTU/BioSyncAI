import Notification from '../models/Notification.js';
import User from '../models/User.js';
import LabAssistant from '../models/LabAssistant.js';
import { sendPushNotification } from '../configs/firebase.js';

/**
 * Core notification dispatch function.
 * Creates an in-app Notification record in MongoDB and attempts push notification delivery via FCM.
 */
export const createNotification = async ({
  targetUserId,
  targetAudience = 'Specific',
  title,
  message,
  type = 'Appointments',
  metadata = {},
}) => {
  try {
    const notif = await Notification.create({
      title,
      message,
      type,
      targetAudience,
      targetUserId,
      metadata,
      isRead: false,
    });

    // Attempt push notification if target user has registered an Expo/FCM push token
    if (targetUserId) {
      // Check User model first
      let targetDoc = await User.findById(targetUserId).select('+fcmToken +pushToken').lean();
      let pushToken = targetDoc?.pushToken || targetDoc?.fcmToken;

      // If not in User, check LabAssistant model
      if (!pushToken) {
        targetDoc = await LabAssistant.findById(targetUserId).select('+fcmToken +pushToken').lean();
        pushToken = targetDoc?.pushToken || targetDoc?.fcmToken;
      }

      if (pushToken) {
        sendPushNotification(pushToken, title, message, {
          type,
          notificationId: notif._id.toString(),
          ...metadata,
        }).catch((err) => {
          console.warn('[NotificationService] Push delivery warning:', err.message);
        });
      }
    }

    return notif;
  } catch (err) {
    console.error('[NotificationService] Failed to create notification:', err.message);
    return null;
  }
};

/**
 * 1. Appointment Booked / Scheduled
 */
export const notifyAppointmentBooked = async (appointment) => {
  if (!appointment?.user) return null;
  const dateFormatted = appointment.scheduledDate
    ? new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Scheduled Date';

  return createNotification({
    targetUserId: appointment.user,
    targetAudience: 'Users',
    title: 'Home Visit Confirmed',
    message: `Your diagnostic collection appointment (#${appointment._id.toString().slice(-6).toUpperCase()}) is confirmed for ${dateFormatted} (${appointment.timeSlot || 'Morning'}).`,
    type: 'Appointments',
    metadata: {
      appointmentId: appointment._id.toString(),
      screen: 'AppointmentsList',
    },
  });
};

/**
 * 2. Phlebotomist Assigned
 */
export const notifyStaffAssigned = async (appointment, labAssistant) => {
  if (!appointment) return null;
  const dateFormatted = appointment.scheduledDate
    ? new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Scheduled Date';

  const staffName = labAssistant?.name || 'Assigned Phlebotomist';

  const promises = [];

  // Notify Patient
  if (appointment.user) {
    promises.push(
      createNotification({
        targetUserId: appointment.user,
        targetAudience: 'Users',
        title: 'Phlebotomist Assigned',
        message: `${staffName} has been assigned for your home visit on ${dateFormatted} (${appointment.timeSlot || 'Morning'}).`,
        type: 'Appointments',
        metadata: {
          appointmentId: appointment._id.toString(),
          staffId: labAssistant?._id ? labAssistant._id.toString() : undefined,
          screen: 'Home',
        },
      })
    );
  } else {
    promises.push(Promise.resolve(null));
  }

  // Notify Phlebotomist
  if (labAssistant?._id) {
    promises.push(
      createNotification({
        targetUserId: labAssistant._id,
        targetAudience: 'LabAssistants',
        title: 'New Collection Task Assigned',
        message: `You have been assigned home visit #${appointment._id.toString().slice(-6).toUpperCase()} for ${dateFormatted} (${appointment.timeSlot || 'Morning'}).`,
        type: 'Appointments',
        metadata: {
          appointmentId: appointment._id.toString(),
          screen: 'Visits',
        },
      })
    );
  } else {
    promises.push(Promise.resolve(null));
  }

  const [userNotif, staffNotif] = await Promise.all(promises);
  return { userNotif, staffNotif };
};

/**
 * 3. Phlebotomist En Route
 */
export const notifyPhlebotomistEnRoute = async (appointment, labAssistant) => {
  if (!appointment?.user) return null;
  const staffName = labAssistant?.name || 'Your phlebotomist';

  return createNotification({
    targetUserId: appointment.user,
    targetAudience: 'Users',
    title: 'Phlebotomist En Route',
    message: `${staffName} is heading to your address. Please have your Collection OTP ready on your screen.`,
    type: 'Dispatch',
    metadata: {
      appointmentId: appointment._id.toString(),
      screen: 'Home',
    },
  });
};

/**
 * 4. Phlebotomist Arrived At Doorstep
 */
export const notifyPhlebotomistArrived = async (appointment, labAssistant) => {
  if (!appointment?.user) return null;
  const staffName = labAssistant?.name || 'Your phlebotomist';
  const otp = appointment.collectionOTP ? ` (OTP: ${appointment.collectionOTP})` : '';

  return createNotification({
    targetUserId: appointment.user,
    targetAudience: 'Users',
    title: 'Phlebotomist At Doorstep',
    message: `${staffName} has arrived at your address. Please provide your Collection OTP${otp} to initiate sample draw.`,
    type: 'Appointments',
    metadata: {
      appointmentId: appointment._id.toString(),
      screen: 'Home',
    },
  });
};

/**
 * 5. Sample Collected & Sealed (4°C Cold Chain)
 */
export const notifySampleCollected = async (appointment, barcode) => {
  if (!appointment?.user) return null;
  const bcStr = barcode ? `Barcode #${barcode}` : 'Specimens';

  return createNotification({
    targetUserId: appointment.user,
    targetAudience: 'Users',
    title: 'Sample Collected & Sealed',
    message: `${bcStr} successfully drawn and sealed in 4°C temperature-controlled container for transport.`,
    type: 'Health',
    metadata: {
      appointmentId: appointment._id.toString(),
      barcode: barcode || undefined,
      screen: 'Home',
    },
  });
};

/**
 * 6. Sample Transferred / Arrived at Laboratory
 */
export const notifySampleAtLab = async (appointment, barcode) => {
  if (!appointment?.user) return null;

  return createNotification({
    targetUserId: appointment.user,
    targetAudience: 'Users',
    title: 'Specimen Arrived at Laboratory',
    message: `Your diagnostic sample (${barcode || 'recent collection'}) has safely reached our accredited pathology laboratory and entered processing.`,
    type: 'Reports',
    metadata: {
      appointmentId: appointment._id.toString(),
      screen: 'Home',
    },
  });
};

/**
 * 7. Report Ready & Certified
 */
export const notifyReportReady = async (appointment, sample, verifierName) => {
  const targetUserId = appointment?.user || sample?.user;
  if (!targetUserId) return null;

  return createNotification({
    targetUserId,
    targetAudience: 'Users',
    title: 'Diagnostic Report Ready',
    message: `Your verified diagnostic lab report has been certified by ${verifierName || 'Medical Officer'}. Tap to review your results and personalized biomarkers.`,
    type: 'Report_Ready',
    metadata: {
      appointmentId: appointment?._id ? appointment._id.toString() : undefined,
      sampleId: sample?._id ? sample._id.toString() : undefined,
      screen: 'AppointmentsList',
    },
  });
};

/**
 * 8. Appointment Rescheduled
 */
export const notifyAppointmentRescheduled = async (appointment, newDate, newSlot) => {
  if (!appointment) return null;

  const promises = [];

  // Notify Patient
  if (appointment.user) {
    promises.push(
      createNotification({
        targetUserId: appointment.user,
        targetAudience: 'Users',
        title: 'Appointment Rescheduled',
        message: `Your diagnostic home visit #${appointment._id.toString().slice(-6).toUpperCase()} has been rescheduled to ${newDate} (${newSlot}).`,
        type: 'Appointments',
        metadata: {
          appointmentId: appointment._id.toString(),
          screen: 'AppointmentsList',
        },
      })
    );
  } else {
    promises.push(Promise.resolve(null));
  }

  // Notify Staff if assigned
  if (appointment.labAssistant) {
    promises.push(
      createNotification({
        targetUserId: appointment.labAssistant,
        targetAudience: 'LabAssistants',
        title: 'Assigned Visit Rescheduled',
        message: `Home visit #${appointment._id.toString().slice(-6).toUpperCase()} has been rescheduled to ${newDate} (${newSlot}).`,
        type: 'Appointments',
        metadata: {
          appointmentId: appointment._id.toString(),
          screen: 'Visits',
        },
      })
    );
  } else {
    promises.push(Promise.resolve(null));
  }

  const [userNotif, staffNotif] = await Promise.all(promises);
  return { userNotif, staffNotif };
};

/**
 * 9. Appointment Cancelled
 */
export const notifyAppointmentCancelled = async (appointment, strikeCount, accountStatus) => {
  if (!appointment) return null;

  const promises = [];

  // Notify Patient
  if (appointment.user) {
    promises.push(
      createNotification({
        targetUserId: appointment.user,
        targetAudience: 'Users',
        title: 'Appointment Cancelled',
        message: `Your appointment #${appointment._id.toString().slice(-6).toUpperCase()} has been cancelled. Strikes: ${strikeCount}/2. Status: ${accountStatus}.`,
        type: 'Appointments',
        metadata: {
          appointmentId: appointment._id.toString(),
          screen: 'AppointmentsList',
        },
      })
    );
  } else {
    promises.push(Promise.resolve(null));
  }

  // Notify Staff if assigned
  if (appointment.labAssistant) {
    promises.push(
      createNotification({
        targetUserId: appointment.labAssistant,
        targetAudience: 'LabAssistants',
        title: 'Assigned Visit Cancelled',
        message: `Assigned collection #${appointment._id.toString().slice(-6).toUpperCase()} has been cancelled by the user.`,
        type: 'Appointments',
        metadata: {
          appointmentId: appointment._id.toString(),
          screen: 'Visits',
        },
      })
    );
  } else {
    promises.push(Promise.resolve(null));
  }

  const [userNotif, staffNotif] = await Promise.all(promises);
  return { userNotif, staffNotif };
};

export const notifyCollectionException = async (appointmentOrObj, reason, notes, exceptionType) => {
  let appointment = appointmentOrObj;
  let r = reason;
  let n = notes;
  let e = exceptionType;

  // Flexible handling: check if called as an object
  if (appointmentOrObj && appointmentOrObj.appointment) {
    appointment = appointmentOrObj.appointment;
    r = appointmentOrObj.reason;
    n = appointmentOrObj.notes;
    e = appointmentOrObj.exceptionType;
  }

  if (!appointment?.user) return null;

  const apptId = appointment._id ? appointment._id.toString() : '';
  const reasonText = r || 'Operational exception encountered';
  const notesText = n ? ` (${n})` : '';

  return createNotification({
    targetUserId: appointment.user,
    targetAudience: 'Users',
    title: 'Home Collection Exception',
    message: `Your home collection #${apptId.slice(-6).toUpperCase()} was flagged: ${reasonText}.${notesText} Please tap to reschedule your appointment.`,
    type: 'Appointments',
    metadata: {
      appointmentId: apptId,
      exceptionType: e || 'Other',
      screen: 'AppointmentsList',
    },
  });
};

/**
 * 12. Automated 30-Day Health Baseline Recalibration Due
 */
export const notifyRecalibrationDue = async (userId, daysElapsed = 30) => {
  if (!userId) return null;

  return createNotification({
    targetUserId: userId,
    targetAudience: 'Users',
    title: '30-Day Health Baseline Recalibration Due',
    message: `It has been ${daysElapsed} days since your last clinical blood draw. Recalibrate your biometric baseline to maintain digital twin precision.`,
    type: 'Health',
    metadata: {
      action: 'RECALIBRATE_BASELINE',
      screen: 'BookAppointment',
      daysElapsed,
    },
  });
};

export default {
  createNotification,
  notifyAppointmentBooked,
  notifyStaffAssigned,
  notifyPhlebotomistEnRoute,
  notifyPhlebotomistArrived,
  notifySampleCollected,
  notifySampleAtLab,
  notifyReportReady,
  notifyAppointmentRescheduled,
  notifyAppointmentCancelled,
  notifyCollectionException,
  notifyRecalibrationDue,
};

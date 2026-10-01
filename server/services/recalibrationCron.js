import cron from 'node-cron';
import User from '../models/User.js';
import Sample from '../models/Sample.js';
import Appointment from '../models/Appointment.js';
import { notifyRecalibrationDue } from './notificationService.js';

/**
 * Scan all active users and identify those whose biometric blood baseline is >= 30 days old.
 * Updates their profile state (needsRecalibration: true) and emits automated re-test push notification.
 */
export const runBaselineCalibrationCheck = async () => {
  console.log('[RecalibrationCron] Starting automated 30-day health baseline calibration check...');
  const stats = {
    usersChecked: 0,
    recalibrationFlagged: 0,
    notificationsDispatched: 0,
    alreadyFlagged: 0,
    errors: 0,
  };

  try {
    const activeUsers = await User.find({ accountStatus: 'Active' });
    stats.usersChecked = activeUsers.length;

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const user of activeUsers) {
      try {
        let latestDate = user.lastBloodDrawDate || user.lastCalibrationDate || null;

        // If no explicit user record, find latest completed sample or appointment
        if (!latestDate) {
          const latestSample = await Sample.findOne({
            user: user._id,
            status: { $in: ['Sample_Collected', 'At_Laboratory', 'Processing', 'Report_Generated', 'Completed'] },
          })
            .sort({ collectionTime: -1, createdAt: -1 })
            .select('collectionTime createdAt')
            .lean();

          if (latestSample) {
            latestDate = latestSample.collectionTime || latestSample.createdAt;
          } else {
            const latestAppt = await Appointment.findOne({
              user: user._id,
              status: { $in: ['Completed', 'Report_Generated', 'Delivered'] },
            })
              .sort({ scheduledDate: -1, updatedAt: -1 })
              .select('scheduledDate updatedAt')
              .lean();

            if (latestAppt) {
              latestDate = latestAppt.scheduledDate || latestAppt.updatedAt;
            }
          }
        }

        if (!latestDate) {
          // User has never had a baseline blood draw yet
          continue;
        }

        const elapsedMs = now - new Date(latestDate).getTime();
        const daysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

        if (daysElapsed >= 30) {
          if (!user.needsRecalibration) {
            user.needsRecalibration = true;
            user.lastBloodDrawDate = latestDate;
            await user.save();

            // Dispatch in-app notification + native OS push notification
            await notifyRecalibrationDue(user._id, daysElapsed);

            stats.recalibrationFlagged++;
            stats.notificationsDispatched++;
            console.log(
              `[RecalibrationCron] User "${user.firstName || 'Patient'} ${user.lastName || ''}" (${user.phoneNumber}) needs recalibration (${daysElapsed}d elapsed). Notification emitted.`
            );
          } else {
            stats.alreadyFlagged++;
          }
        } else if (user.needsRecalibration) {
          // If recent draw happened, clear flag
          user.needsRecalibration = false;
          user.lastBloodDrawDate = latestDate;
          await user.save();
        }
      } catch (userErr) {
        stats.errors++;
        console.warn(`[RecalibrationCron] Error checking user ${user._id}:`, userErr.message);
      }
    }

    console.log(
      `[RecalibrationCron] Baseline calibration complete: Checked ${stats.usersChecked} users, Flagged ${stats.recalibrationFlagged} new, Dispatched ${stats.notificationsDispatched} notifications.`
    );
    return stats;
  } catch (err) {
    console.error('[RecalibrationCron] Fatal error executing calibration cron:', err.message);
    throw err;
  }
};

/**
 * Initialize nightly scheduled cron job
 * Runs at 02:00 AM every night
 */
export const initRecalibrationCron = () => {
  // Cron schedule: 02:00 AM every day
  const scheduleStr = process.env.RECALIBRATION_CRON_SCHEDULE || '0 2 * * *';

  cron.schedule(scheduleStr, async () => {
    console.log('[RecalibrationCron] Nightly trigger fired at', new Date().toISOString());
    try {
      await runBaselineCalibrationCheck();
    } catch (e) {
      console.error('[RecalibrationCron] Nightly run failed:', e.message);
    }
  });

  console.log(`[RecalibrationCron] Automated baseline calibration scheduled (${scheduleStr})`);
};

export default {
  runBaselineCalibrationCheck,
  initRecalibrationCron,
};

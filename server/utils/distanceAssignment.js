import LabAssistant from '../models/LabAssistant.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Sample from '../models/Sample.js';

/**
 * Calculates the great-circle distance between two geographical points using the Haversine formula.
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers rounded to 2 decimal places (or Infinity if coords invalid)
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lat1 === null || lon1 === undefined || lon1 === null ||
      lat2 === undefined || lat2 === null || lon2 === undefined || lon2 === null) {
    return Infinity;
  }

  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return Infinity;
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
};

/**
 * Finds the nearest Lab Assistant based on coordinates.
 * Shortest distance = first choice for assignment.
 * @param {{ lat: number, lng: number }} userCoords Coordinates of patient/sample location
 * @param {object} [options] Optional filters (e.g. status)
 */
export const findNearestLabAssistant = async (userCoords, options = {}) => {
  if (!userCoords || userCoords.lat == null || userCoords.lng == null) {
    // If no coordinates provided, pick the first available assistant
    const fallback = await LabAssistant.findOne({ status: { $in: ['Available', 'On_Route'] } }).lean()
      || await LabAssistant.findOne().lean();
    return { nearestAssistant: fallback, distanceKm: 0, rankedAssistants: fallback ? [{ assistant: fallback, distanceKm: 0 }] : [] };
  }

  // 1. Prefer Available or active assistants
  let assistants = await LabAssistant.find({
    status: { $in: ['Available', 'On_Route'] },
    'currentLocation.lat': { $exists: true, $ne: null },
    'currentLocation.lng': { $exists: true, $ne: null }
  }).lean();

  // If no available assistants found with location, check any assistant with location
  if (!assistants || assistants.length === 0) {
    assistants = await LabAssistant.find({
      'currentLocation.lat': { $exists: true, $ne: null },
      'currentLocation.lng': { $exists: true, $ne: null }
    }).lean();
  }

  // If still none, fallback to any assistant in database
  if (!assistants || assistants.length === 0) {
    const fallback = await LabAssistant.findOne().lean();
    return { nearestAssistant: fallback, distanceKm: 0, rankedAssistants: fallback ? [{ assistant: fallback, distanceKm: 0 }] : [] };
  }

  // 2. Compute distance to each assistant
  const rankedAssistants = assistants.map(assistant => {
    const dist = calculateDistanceKm(
      userCoords.lat,
      userCoords.lng,
      assistant.currentLocation.lat,
      assistant.currentLocation.lng
    );
    return {
      assistant,
      distanceKm: dist
    };
  });

  // 3. Sort ascending: shortest distance first
  rankedAssistants.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    nearestAssistant: rankedAssistants[0].assistant,
    distanceKm: rankedAssistants[0].distanceKm,
    rankedAssistants
  };
};

/**
 * Finds the nearest Doctor / Pathologist based on coordinates.
 * Shortest distance = first choice for diagnostic oversight.
 * @param {{ lat: number, lng: number }} targetCoords Coordinates of patient or collection location
 * @param {object} [options] Optional filters
 */
export const findNearestDoctor = async (targetCoords, options = {}) => {
  if (!targetCoords || targetCoords.lat == null || targetCoords.lng == null) {
    const fallback = await Doctor.findOne({ status: 'Active' }).lean() || await Doctor.findOne().lean();
    return { nearestDoctor: fallback, distanceKm: 0, rankedDoctors: fallback ? [{ doctor: fallback, distanceKm: 0 }] : [] };
  }

  // 1. Fetch active doctors with coordinates
  let doctors = await Doctor.find({
    status: 'Active',
    'currentLocation.lat': { $exists: true, $ne: null },
    'currentLocation.lng': { $exists: true, $ne: null }
  }).lean();

  if (!doctors || doctors.length === 0) {
    doctors = await Doctor.find({
      'currentLocation.lat': { $exists: true, $ne: null },
      'currentLocation.lng': { $exists: true, $ne: null }
    }).lean();
  }

  if (!doctors || doctors.length === 0) {
    const fallback = await Doctor.findOne().lean();
    return { nearestDoctor: fallback, distanceKm: 0, rankedDoctors: fallback ? [{ doctor: fallback, distanceKm: 0 }] : [] };
  }

  // 2. Compute distance to each doctor's hub
  const rankedDoctors = doctors.map(doctor => {
    const dist = calculateDistanceKm(
      targetCoords.lat,
      targetCoords.lng,
      doctor.currentLocation.lat,
      doctor.currentLocation.lng
    );
    return {
      doctor,
      distanceKm: dist
    };
  });

  // 3. Sort ascending: shortest distance first
  rankedDoctors.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    nearestDoctor: rankedDoctors[0].doctor,
    distanceKm: rankedDoctors[0].distanceKm,
    rankedDoctors
  };
};

/**
 * Automatically assigns the nearest Lab Assistant and nearest Doctor to an appointment.
 * @param {string|mongoose.Types.ObjectId} appointmentId
 * @returns {Promise<object>} Result containing updated appointment, sample, and distances
 */
export const autoAssignNearestStaff = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId).populate('user');
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Get user coordinates (from appointment address or user profile)
  const coords = appointment.address?.coordinates?.lat != null && appointment.address?.coordinates?.lng != null
    ? appointment.address.coordinates
    : appointment.user?.address?.coordinates;

  const [nearestLAData, nearestDocData] = await Promise.all([
    findNearestLabAssistant(coords),
    findNearestDoctor(coords)
  ]);

  const nearestLA = nearestLAData.nearestAssistant;
  const laDist = nearestLAData.distanceKm;
  const nearestDoc = nearestDocData.nearestDoctor;
  const docDist = nearestDocData.distanceKm;

  if (nearestLA) {
    appointment.labAssistant = nearestLA._id;
    if (appointment.status === 'Booked') {
      appointment.status = 'Assistant_Assigned';
    }
  }

  if (nearestDoc) {
    appointment.doctor = nearestDoc._id;
  }

  const logNote = `Distance-based assignment: Assigned nearest Lab Assistant "${nearestLA?.name || 'Staff'}" (${laDist !== Infinity ? laDist + ' km' : 'central'}) and nearest Doctor "${nearestDoc?.name || 'Doctor'}" (${docDist !== Infinity ? docDist + ' km' : 'hub'}).`;

  appointment.trackingLogs.push({
    status: appointment.status,
    timestamp: new Date(),
    notes: logNote
  });

  await appointment.save();

  // Also update corresponding Sample if already created
  let sample = await Sample.findOne({ appointment: appointment._id });
  if (sample) {
    if (nearestLA) {
      sample.labAssistant = nearestLA._id;
      if (sample.status === 'Requested') {
        sample.status = 'Assigned';
      }
    }
    if (nearestDoc) {
      sample.doctor = nearestDoc._id;
    }
    await sample.save();
  }

  return {
    success: true,
    appointment,
    sample,
    assignedLabAssistant: nearestLA,
    labAssistantDistanceKm: laDist,
    assignedDoctor: nearestDoc,
    doctorDistanceKm: docDist,
    logNote
  };
};

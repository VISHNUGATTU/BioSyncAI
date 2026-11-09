import {
  generateAbhaRegistrationOtp,
  verifyOtpAndCreateAbha,
  linkAbhaToUserAccount,
  discoverPatientCareContexts,
  initiateCareContextLink,
  confirmCareContextLink,
  transferCareContextFhirBundle,
  initiateHiuConsentRequest,
  ingestExternalFhirEhrAndCalibrate
} from '../services/abdmService.js';
import User from '../models/User.js';
import AbdmCareContext from '../models/AbdmCareContext.js';

/**
 * Controller: Generate OTP for ABHA Onboarding (M1)
 */
export async function handleGenerateOtp(req, res) {
  try {
    const { identifier, type } = req.body;
    const result = await generateAbhaRegistrationOtp(identifier, type);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Verify OTP & Create ABHA Number / Address (M1)
 */
export async function handleVerifyOtp(req, res) {
  try {
    const { txnId, otp, preferredAbhaAddress } = req.body;
    const result = await verifyOtpAndCreateAbha(txnId, otp, preferredAbhaAddress);

    // If authenticated user is present, link automatically
    if (req.user?._id) {
      await linkAbhaToUserAccount(req.user._id, result);
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Link ABHA identity to user profile (M1)
 */
export async function handleLinkAbha(req, res) {
  try {
    const userId = req.user?._id || req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required to link ABHA.' });
    }
    const updatedUser = await linkAbhaToUserAccount(userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'ABHA identity linked successfully.',
      abha: updatedUser.abha
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Get ABHA Identity Profile for User (M1)
 */
export async function handleGetAbhaProfile(req, res) {
  try {
    const userId = req.user?._id || req.query.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const careContextsCount = await AbdmCareContext.countDocuments({ userId: user._id, isLinked: true });

    return res.status(200).json({
      success: true,
      abha: user.abha || { status: 'NOT_LINKED' },
      linkedCareContextsCount: careContextsCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Discover Care Contexts (M2 - HIP)
 */
export async function handleDiscoverCareContexts(req, res) {
  try {
    const { patientMobile, patientAbhaAddress } = req.body;
    const result = await discoverPatientCareContexts({ 
      patientMobile: patientMobile || req.user?.phoneNumber, 
      patientAbhaAddress: patientAbhaAddress || req.user?.abha?.abhaAddress 
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Initiate Care Context Link (M2 - HIP)
 */
export async function handleInitiateCareContextLink(req, res) {
  try {
    const { patientAbhaAddress, careContextReferences } = req.body;
    const targetAddress = patientAbhaAddress || req.user?.abha?.abhaAddress;
    const result = await initiateCareContextLink(targetAddress, careContextReferences);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Confirm Care Context Link (M2 - HIP)
 */
export async function handleConfirmCareContextLink(req, res) {
  try {
    const { linkTxnId, otp } = req.body;
    const result = await confirmCareContextLink(linkTxnId, otp);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Transfer FHIR R4 Bundle for Care Context (M2 - HIP Data Transfer)
 */
export async function handleTransferFhirBundle(req, res) {
  try {
    const { careContextReference, consentId } = req.body;
    const result = await transferCareContextFhirBundle(careContextReference, consentId || 'CONSENT_DEMO_VERIFIED');
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Initiate HIU Consent Request (M3 - HIU)
 */
export async function handleInitiateConsentRequest(req, res) {
  try {
    const userId = req.user?._id || req.body.userId;
    const { targetAbhaAddress, hiTypes, dateRange, purpose } = req.body;
    const result = await initiateHiuConsentRequest({
      userId,
      targetAbhaAddress,
      hiTypes,
      dateRange,
      purpose
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Controller: Ingest External FHIR EHR and Recalibrate Digital Twin (M3 - HIU Ingestion)
 */
export async function handleIngestExternalFhir(req, res) {
  try {
    const userId = req.user?._id || req.body.userId;
    const { fhirBundle } = req.body;
    const result = await ingestExternalFhirEhrAndCalibrate(userId, fhirBundle);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}


import express from 'express';
import {
  getSampleFhirBundle,
  getUserVitalsFhirBundle,
  getMyHealthPassportFhirBundle,
  getLoincGlossary,
} from '../controllers/fhirController.js';
import { authUser } from '../middlewares/authUser.js';

const fhirRouter = express.Router();

// Supported LOINC Biomarker Dictionary
fhirRouter.get('/loinc-dictionary', getLoincGlossary);

// Direct Sample DiagnosticReport FHIR R4 Bundle
fhirRouter.get('/sample/:sampleId/bundle', getSampleFhirBundle);

// Current User's Full Health Passport FHIR R4 Bundle
fhirRouter.get('/my-bundle', authUser, getMyHealthPassportFhirBundle);

// Specific Patient Vitals FHIR R4 Bundle
fhirRouter.get('/user/:userId/vitals-bundle', authUser, getUserVitalsFhirBundle);

export default fhirRouter;

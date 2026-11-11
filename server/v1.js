// v1.js: FROZEN. Do not change the shape of anything in this file.
const express = require('express');
const router = express.Router();
const { deprecated } = require('./deprecate');

// Announcement: v1 sunset date (e.g. November 20, 2026)
const old = deprecated({ sunset: '2026-11-20', successor: '/v2/api/patients' });

const patientRoutes = require('./routes/patients');
const patientLocationRoutes = require('./routes/patientsLocation');
const patientMedicineRoutes = require('./routes/patientsMedicine');
const patientReservationRoutes = require('./routes/patientsReservationPost');
const patientsReservationPatchRoutes = require('./routes/patientsReservationPatch');

// All v1 endpoints carry the RFC deprecation headers
router.use('/api/patients', old);

router.use('/api/patients', patientRoutes);
router.use('/api/patients', patientLocationRoutes);
router.use('/api/patients', patientMedicineRoutes);
router.use('/api/patients', patientReservationRoutes);
router.use('/api/patients', patientsReservationPatchRoutes);

module.exports = router;

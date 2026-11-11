// v2.js: the new shape. Same data, different response.
const express = require('express');
const router = express.Router();
const db = require('./db');

// One place that turns a stored patient into the v2 response shape.
const toV2 = (p) => ({
    patient_id: p.patient_id,
    name: p.name,
    phone: p.phone_number, // Renamed from "phone_number" to "phone"
});

// GET /api/patients with wrapped envelope { data, count }
router.get('/api/patients', async (req, res) => {
    try {
        const matchStatus = req.query.match_status;
        const match_statuses = ['approved', 'pending'];

        if (!matchStatus || !match_statuses.includes(matchStatus.toLowerCase())) {
            return res.status(400).json({ error: "Invalid request parameters or missing required fields in the request body" });
        }

        let patientQuery = 'SELECT patient_id, name, phone_number FROM patients_patient';
        let patientQueryValues = [];

        if (matchStatus) {
            const matchRows = await db.query(
                'SELECT donor_id, recipient_id FROM matching_match WHERE match_status = $1',
                [matchStatus.toUpperCase()]
            );
            const patientIds = [
                ...new Set(
                    matchRows.rows.flatMap(({ donor_id: donorId, recipient_id: recipientId }) => [
                        donorId,
                        recipientId,
                    ])
                ),
            ];

            if (patientIds.length === 0) {
                return res.status(404).json({ message: "There are currently no patients with the requested match status" });
            }

            patientQuery += ' WHERE patient_id = ANY($1::int[])';
            patientQueryValues = [patientIds];
        }

        const patientRows = await db.query(patientQuery, patientQueryValues);
        const transformed = patientRows.rows.map(toV2);

        // Wrapped in { data, count }
        res.json({
            data: transformed,
            count: transformed.length,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// Sub-resources (/location, /medicine, /reservation) continue working under v2
const patientLocationRoutes = require('./routes/patientsLocation');
const patientMedicineRoutes = require('./routes/patientsMedicine');
const patientReservationRoutes = require('./routes/patientsReservationPost');
const patientsReservationPatchRoutes = require('./routes/patientsReservationPatch');

router.use('/api/patients', patientLocationRoutes);
router.use('/api/patients', patientMedicineRoutes);
router.use('/api/patients', patientReservationRoutes);
router.use('/api/patients', patientsReservationPatchRoutes);

module.exports = router;

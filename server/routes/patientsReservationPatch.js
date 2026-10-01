const express = require('express');
const router = express.Router();
const db = require('../db');

const RESERVATION_STATUSES = new Set([
    'Pending',
    'Reserved',
    'Cancelled',
    'PENDING',
    'RESERVED',
    'CANCELLED'
]);

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateUpdateReservationBody(body) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return 'Request body must be a JSON object';
    }

    const requiredFields = [
        'reservation_code',
        'reservation_status',
    ];
    const missingField = requiredFields.find((field) => !(field in body));
    if (missingField) {
        return `${missingField} is required`;
    }

    if (!isNonEmptyString(body.reservation_code)) {
        return 'reservation_code must be a non-empty string';
    }
    
    if (!isNonEmptyString(body.reservation_status) || !RESERVATION_STATUSES.has(body.reservation_status)) {
        return 'reservation_status must be one of Pending, Reserved, or Cancelled';
    }

    return null;
}

router.patch('/:patient_id/reservation', async (req, res) => {
    const patientId = Number(req.params.patient_id);
    const validationError = validateUpdateReservationBody(req.body);

    if (!Number.isInteger(patientId) || patientId <= 0) {
        return res.status(400).json({ error: 'patient_id must be a positive integer' });
    }
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const patientRows = await db.query(
            'SELECT patient_id FROM patients_patient WHERE patient_id = $1',
            [patientId]
        );

        if (patientRows.rows.length === 0) {
            return res.status(404).json({
                error: 'Resource not found',
                message: `The patient with patient_id ${patientId} was not found`,
            });
        }

        const updateRows = await db.query(
            `UPDATE patients_reservation
             SET reservation_status = $1
             WHERE patient_id = $2 AND reservation_code = $3
             RETURNING reservation_code, reservation_status`,
            [
                req.body.reservation_status,
                patientId,
                req.body.reservation_code.trim(),
            ]
        );

        if (updateRows.rows.length === 0) {
            return res.status(404).json({
                error: 'Resource not found',
                message: `Reservation with code ${req.body.reservation_code} for patient ${patientId} was not found`,
            });
        }

        return res.status(200).json(updateRows.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            error: "Internal Server Error",
            message: "An unexpected error occurred while processing the request. Please try again later."
        });
    }
});

module.exports = router;

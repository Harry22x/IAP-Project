const express = require('express');
const router = express.Router();
const db = require('../db');

const RESERVATION_STATUSES = new Set([
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
]);

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isValidPickupLocation(value) {
    return Array.isArray(value) && value.length > 0 && value.every((pickup) => (
        pickup !== null &&
        typeof pickup === 'object' &&
        !Array.isArray(pickup) &&
        isNonEmptyString(pickup.name) &&
        isNonEmptyString(pickup.location) &&
        typeof pickup.longitude === 'number' &&
        Number.isFinite(pickup.longitude) &&
        typeof pickup.latitude === 'number' &&
        Number.isFinite(pickup.latitude)
    ));
}

function validateReservationBody(body) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return 'Request body must be a JSON object';
    }

    const requiredFields = [
        'reservation_code',
        'reservation_status',
        'reservation_date',
        'pickup_window',
        'pickup_location',
    ];
    const missingField = requiredFields.find((field) => !(field in body));
    if (missingField) {
        return `${missingField} is required`;
    }

    if (!isNonEmptyString(body.reservation_code)) {
        return 'reservation_code must be a non-empty string';
    }
    if (body.reservation_code.length > 20) {
        return 'reservation_code must not exceed 20 characters';
    }
    if (!isNonEmptyString(body.reservation_status) || !RESERVATION_STATUSES.has(body.reservation_status)) {
        return 'reservation_status must be one of PENDING, CONFIRMED, COMPLETED, or CANCELLED';
    }
    if (!isNonEmptyString(body.reservation_date) || Number.isNaN(Date.parse(body.reservation_date))) {
        return 'reservation_date must be a valid date-time string';
    }
    if (!isNonEmptyString(body.pickup_window)) {
        return 'pickup_window must be a non-empty string';
    }
    if (body.pickup_window.length > 100) {
        return 'pickup_window must not exceed 100 characters';
    }
    if (!isValidPickupLocation(body.pickup_location)) {
        return 'pickup_location must be a non-empty array of objects with non-empty name and location strings and numeric longitude and latitude';
    }

    return null;
}

router.post('/:patient_id/reservation', async (req, res) => {
    const patientId = Number(req.params.patient_id);
    const validationError = validateReservationBody(req.body);

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

        const reservationRows = await db.query(
            `INSERT INTO patients_reservation
                (patient_id, reservation_code, reservation_status, reservation_date, pickup_window, pickup_location)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb)
             RETURNING patient_id, reservation_code, reservation_status, reservation_date, pickup_window, pickup_location`,
            [
                patientId,
                req.body.reservation_code.trim(),
                req.body.reservation_status,
                req.body.reservation_date,
                req.body.pickup_window.trim(),
                JSON.stringify(req.body.pickup_location),
            ]
        );

        return res.status(201).json(reservationRows.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error",
                                    message: "An unexpected error occurred while processing the request. Please try again later."});
    }
});

module.exports = router;

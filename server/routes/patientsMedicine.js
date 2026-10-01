const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:patient_id/medicine', async (req, res) => {
	try {
		const { patient_id: patientId } = req.params;

        if(!Number(patientId)){
                    return res.status(400).json({error:"Invalid request parameters or missing required fields in the request body"})
                }
		const patientRows = await db.query(
			'SELECT patient_id, name FROM patients_patient WHERE patient_id = $1',
			[patientId]
		);

		if (patientRows.rows.length === 0) {
			return res.status(404).json({
				error: 'Resource not found',
				message: `The patient with patient_id ${patientId} was not found`,
			});
		}

		const prescriptionRows = await db.query(
			'SELECT medicine_name, dosage FROM medical_records_prescription WHERE patient_id = $1',
			[patientId]
		);

		res.json({
			patient_id: patientRows.rows[0].patient_id,
			name: patientRows.rows[0].name,
			prescribed_medicine: prescriptionRows.rows,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal Server Error',
                               message: "unexpected error occurred while processing the request. Please try again later." 
         });
	}
});

module.exports = router;

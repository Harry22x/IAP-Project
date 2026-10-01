const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/:patient_id/location', async (req, res) => {
	try {
		const { patient_id: patientId } = req.params;
        
        
        if(!Number(patientId)){
                    return res.status(400).json({error:"Invalid request parameters or missing required fields in the request body"})
                }


		const patientRows = await db.query(
			'SELECT hospital_id FROM patients_patient WHERE patient_id = $1',
			[patientId]
		);

        
		if (patientRows.rows.length === 0) {
			return res.status(404).json({ error: 'Resource not found',
                                          message: `The patient with patient_id ${patientId} was not found`  
             });
		}

       

		const hospitalRows = await db.query(
			'SELECT hospital_id,name,location,latitude,longitude FROM hospitals_hospital WHERE hospital_id = $1',
			[patientRows.rows[0].hospital_id]
		);

		if (hospitalRows.rows.length === 0) {
			return res.status(404).json({ error: 'Hospital not found' });
		}

		res.json(hospitalRows.rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to fetch hospital location' });
	}
});

module.exports = router;
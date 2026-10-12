const express = require('express');
const router = express.Router();
const db = require('../db');


// GET all patients
router.get('/', async(req,res) => {
try{
    const matchStatus = req.query.match_status;
    let patientQuery = 'SELECT patient_id,name,phone_number  FROM patients_patient';
    let patientQueryValues = [];

    let match_statuses = ['approved', 'pending'];

    if(!match_statuses.includes(matchStatus.toLowerCase())){
         res.status(400).json({error:"Invalid request parameters or missing required fields in the request body"})
    }

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
            return res.status(404).json({message:"There are currently no patients with the requested match status"});
        }

        patientQuery += ' WHERE patient_id = ANY($1::int[])';
        patientQueryValues = [patientIds];
    }

    const patientRows = await db.query(patientQuery, patientQueryValues);
    res.json(patientRows.rows);
}catch(err){
    console.error(err);
    res.status(500).json({error: 'Failed to fetch patients'});
}
});

module.exports = router;
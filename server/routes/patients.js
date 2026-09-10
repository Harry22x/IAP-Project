const express = require('express');
const router = express.Router();
const db = require('../db');


// GET all patients
router.get('/', async(req,res) => {
try{
    const rows = (await db.query('SELECT * FROM patients_patient  ')) || [];
    res.json(rows.rows);
}catch(err){
    console.error(err);
    res.status(500).json({error: 'Failed to fetch patients'});
}
});

module.exports = router;
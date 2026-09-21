const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req,res) =>{
    res.send('API is running');
});

const patientRoutes = require('./routes/patients');
const patientLocationRoutes = require('./routes/patientsLocation');
const patientMedicineRoutes = require('./routes/patientsMedicine');
const patientReservationRoutes = require('./routes/patientsReservationPost');
app.use('/api/patients', patientRoutes);
app.use('/api/patients', patientLocationRoutes);
app.use('/api/patients', patientMedicineRoutes);
app.use('/api/patients', patientReservationRoutes);

app.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`);
});
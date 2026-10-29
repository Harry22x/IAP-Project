const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const VALID_KEYS = (process.env.API_KEYS || '').split(',').filter(Boolean);

function requireApiKey(req, res, next){
    const key = req.get('X-API-Key');
    if(!key || !VALID_KEYS.includes(key)){
        return res.status(401).json({message:'Missing or invalid API key'})
    }
    req.apiKey = key;
    next();
}


app.use(cors());
app.use(express.json());
// auth
app.use(requireApiKey);

// app.get('/', (req, res) => {
//     res.send('API is running');
// })

// const studentRoutes = require('./routes/students');
// app.use('/api/students', studentRoutes);

// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// })

// rate limiting
app.use(rateLimit({
    windowMs: 60 *1000,
    max: 80
}))

app.get('/', (req,res) =>{
    res.send('API is running');
});

const patientRoutes = require('./routes/patients');
const patientLocationRoutes = require('./routes/patientsLocation');
const patientMedicineRoutes = require('./routes/patientsMedicine');
const patientReservationRoutes = require('./routes/patientsReservationPost');
const patientsReservationPatchRoutes= require('./routes/patientsReservationPatch');
app.use('/api/patients', patientRoutes);
app.use('/api/patients', patientLocationRoutes);
app.use('/api/patients', patientMedicineRoutes);
app.use('/api/patients', patientReservationRoutes);
app.use('/api/patients', patientsReservationPatchRoutes);

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));
}

module.exports = app;

// rate limiting
const hits = new Map(); // key -> { count, resetAt }

function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const id = req.apiKey || req.ip;
    const now = Date.now();
    let entry = hits.get(id);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(id, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ message: 'Too many requests', retryAfter });
    }
    next();
  };
};

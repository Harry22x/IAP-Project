const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { monitor, statsHandler } = require('./monitoring');

const app = express();
const PORT = process.env.PORT || 5000;
const VALID_KEYS = (process.env.API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);

// Rate limiter
const hits = new Map(); // id -> { count, resetAt }
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
}

function requireApiKey(req, res, next) {
    const key = req.get('X-API-Key');
    if (!key || !VALID_KEYS.includes(key)) {
        return res.status(401).json({ message: 'Missing or invalid API key' });
    }
    req.apiKey = key;
    next();
}

app.use(cors());
app.use(express.json());

// 1. MONITOR FIRST: so rejected requests (401, 429) are logged too
app.use(monitor);

// 2. AUTH: require valid API key
app.use(requireApiKey);

// 3. RATE LIMITING
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 100
}));

// 4. STATS ENDPOINT (Protected by API key)
app.get('/stats', statsHandler);

app.get('/', (req, res) => {
    res.send('API is running');
});

// 5. VERSIONED ROUTING
const v1 = require('./v1');
const v2 = require('./v2');

app.use('/v2', v2);  // The new version (wrapped { data, count }, phone)
app.use('/v1', v1);  // The old version (carrying Deprecation headers)
app.use('/', v1);    // Old URLs with no version (/api/patients) keep working!

// Partner integration route (from Week 11)
app.use('/', require('./routes/upcoming'));

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));
}

module.exports = app;

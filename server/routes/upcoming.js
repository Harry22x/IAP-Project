const express = require('express');
const router = express.Router();
const { fetchWithRetry } = require('../resilientFetch');
const { versions } = require('../partner');

const PARTNER_URL = process.env.PARTNER_URL || 'http://localhost:3000';
const PARTNER_KEY = process.env.PARTNER_KEY;

let lastGood = null; // { data, asOf }, kept in memory

router.get('/upcoming', async (req, res) => {
    try {
        const ver = versions[process.env.PARTNER_VERSION || 'v1'];
        if (!ver) {
            throw new Error(`Unsupported PARTNER_VERSION: ${process.env.PARTNER_VERSION}`);
        }

        const r = await fetchWithRetry(
            `${PARTNER_URL}${ver.path}?status=active`,
            { headers: { 'X-API-Key': PARTNER_KEY } },
            { timeoutMs: 1500, retries: 2, delayMs: 200 }
        );

        if (!r.ok) throw new Error(`partner returned ${r.status}`);
        const rawJson = await r.json();
        const data = ver.parse(rawJson);
        lastGood = { data, asOf: new Date().toISOString() };
        return res.json({ data, stale: false, asOf: lastGood.asOf });
    } catch (err) {
        const reason = err.name === 'TimeoutError'
            ? 'timeout' : (err.cause?.code || err.message);
        console.error('partner call failed:', reason);
        if (lastGood) {
            return res.json({ data: lastGood.data, stale: true, asOf: lastGood.asOf });
        }
        return res.status(502).json({ message: 'Partner data unavailable' });
    }
});

module.exports = router;

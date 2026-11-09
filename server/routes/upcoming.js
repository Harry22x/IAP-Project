const express = require('express');
const router = express.Router();
const {fetchWithRetry} = require('../resilientFetch');
const PARTNER_URL = process.env.PARTNER_URL;
const PARTNER_KEY = process.env.PARTNER_KEY;

let lastGood = null; // { data, asOf }, kept in memory
 
router.get('/upcoming', async (req, res) => {
  try {
    const r = await fetchWithRetry(
      `${PARTNER_URL}/tasks?status=active`,
      { headers: { 'X-API-Key': PARTNER_KEY } },
      { timeoutMs: 1500, retries: 2, delayMs: 200 }
    );
    if (!r.ok) throw new Error(`partner returned ${r.status}`);
    const tasks = await r.json();
    const data = tasks.map(t => ({ title: t.title, dueDate: t.dueDate }));
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
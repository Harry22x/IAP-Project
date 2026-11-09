require('dotenv').config();
const PARTNER_URL = process.env.PARTNER_URL;
const PARTNER_KEY = process.env.PARTNER_KEY;
const {fetchWithRetry} = require('./resilientFetch');

// timeout
async function fetchPartnerData(url = `${PARTNER_URL}/tasks?status=active`) {
    try {
        const r = await fetch(url, {
            headers: { 'X-API-Key': PARTNER_KEY },
            signal: AbortSignal.timeout(400),
        });   

    if (!r.ok) {
        throw new Error(`Partner API returned HTTP ${r.status}`);
    }

    return await r.json();

    }catch (err) {
        const reason = err.name === 'TimeoutError'
            ? 'timeout' : (err.cause?.code || err.message);
        console.error('partner call failed:', reason);

        throw err;
    }
}
module.exports = {fetchPartnerData};

// retry logic 
const r = await fetchWithRetry(
  `${PARTNER_URL}/tasks?status=active`,
  { headers: { 'X-API-Key': PARTNER_KEY } },
  { timeoutMs: 400, retries: 2, delayMs: 200 }
);
if (!r.ok) throw new Error(`partner returned ${r.status}`);
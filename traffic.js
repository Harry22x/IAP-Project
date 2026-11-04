// traffic.js: sends a mix of requests to your API, to give you data.
// Run: API=http://localhost:5000 KEY=<your-key> node traffic.js
// Adapt the paths in `mix` to your own API.

const API = process.env.API || 'http://localhost:5000';
const KEY = process.env.KEY || 'week12-test-key-organ2026';
const N = Number(process.env.N || 60);

const mix = [
    { method: 'GET', path: '/api/patients?match_status=approved', key: true },
    { method: 'GET', path: '/api/patients?match_status=approved', key: true },
    { method: 'GET', path: '/api/patients/3/location', key: true },
    { method: 'GET', path: '/api/patients/3/medicine', key: true },
    { method: 'GET', path: '/api/patients/9999/location', key: true }, // no such patient id
    { method: 'GET', path: '/api/patients/9999/medicine', key: true }, // no such patient id
    { method: 'GET', path: '/api/patients?match_status=approved', key: false }, // no key at all (401)
    { method: 'GET', path: '/api/not-a-route', key: true }, // no such path (404)
];

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
    console.log(`Sending ${N} requests to ${API}...`);
    const counts = {};
    for (let i = 0; i < N; i++) {
        const r = mix[Math.floor(Math.random() * mix.length)];
        try {
            const res = await fetch(API + r.path, {
                method: r.method,
                headers: r.key ? { 'X-API-Key': KEY } : {},
            });
            counts[res.status] = (counts[res.status] || 0) + 1;
        } catch (err) {
            counts.failed = (counts.failed || 0) + 1;
        }
        await pause(50);
    }
    console.log('Status codes received:', counts);
})();

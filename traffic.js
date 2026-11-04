// traffic.js: sends a mix of requests to your API, to give you data.
// Run: API=http://localhost:5000 KEY=<your-key> node traffic.js
// Adapt the paths in `mix` to your own API.

const API = process.env.API || 'http://localhost:5000';
const KEY = process.env.KEY || 'week12-test-key-organ2026';
const N = Number(process.env.N || 75);

function getReservationPayload(code = `PL-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`) {
    return {
        reservation_code: code,
        reservation_status: 'PENDING',
        reservation_date: new Date().toISOString(),
        pickup_window: 'Today, 4:00 PM - 6:00 PM',
        pickup_location: [
            {
                name: 'Westlands Medpoint',
                location: 'Westlands',
                longitude: 36.8219,
                latitude: -1.2921,
            },
        ],
    };
}

const mix = [
    { method: 'GET', path: '/api/patients?match_status=approved', key: true },
    { method: 'GET', path: '/api/patients/3/location', key: true },
    { method: 'GET', path: '/api/patients/3/medicine', key: true },
    { method: 'GET', path: '/api/patients/9999/location', key: true }, // 404 missing id
    { method: 'GET', path: '/api/patients/9999/medicine', key: true }, // 404 missing id
    { method: 'GET', path: '/api/patients?match_status=approved', key: false }, // 401 no key
    { method: 'GET', path: '/api/not-a-route', key: true }, // 404 no such path
    { method: 'POST', path: '/api/patients/3/reservation', key: true, getBody: () => getReservationPayload() }, // 201 created
    { method: 'POST', path: '/api/patients/9999/reservation', key: true, getBody: () => getReservationPayload() }, // 404 missing patient
    { method: 'POST', path: '/api/patients/3/reservation', key: true, getBody: () => ({ invalid_body: true }) }, // 400 bad schema
];

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
    console.log(`Sending ${N} requests to ${API}...`);
    const counts = {};
    for (let i = 0; i < N; i++) {
        const r = mix[Math.floor(Math.random() * mix.length)];
        const body = r.getBody ? r.getBody() : undefined;
        try {
            const res = await fetch(API + r.path, {
                method: r.method,
                headers: {
                    ...(r.key ? { 'X-API-Key': KEY } : {}),
                    ...(body ? { 'Content-Type': 'application/json' } : {}),
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            counts[res.status] = (counts[res.status] || 0) + 1;
        } catch (err) {
            counts.failed = (counts.failed || 0) + 1;
        }
        await pause(50);
    }
    console.log('Status codes received:', counts);
})();

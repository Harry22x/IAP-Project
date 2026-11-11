process.env.API_KEYS = 'test-key,week12-test-key-organ2026';
const request = require('supertest');
const app = require('../index');
const db = require('../db');
const KEY = { 'X-API-Key': 'week12-test-key-organ2026' };

afterAll(async () => {
    await db.end();
});

describe('v1 is frozen', () => {
    test('GET /v1/api/patients keeps its original shape', async () => {
        const res = await request(app)
            .get('/v1/api/patients?match_status=approved')
            .set(KEY);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(Object.keys(res.body[0]).sort()).toEqual(['name', 'patient_id', 'phone_number']);
    });

    test('old unversioned /api/patients still answers the same way', async () => {
        const a = await request(app).get('/api/patients?match_status=approved').set(KEY);
        const b = await request(app).get('/v1/api/patients?match_status=approved').set(KEY);
        expect(a.status).toBe(200);
        expect(a.body).toEqual(b.body);
    });

    test('v1 error shape is unchanged for missing patient', async () => {
        const res = await request(app).get('/v1/api/patients/9999/location').set(KEY);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });
});

describe('v2 has the new shape', () => {
    test('list is wrapped in { data, count }, with "phone" instead of "phone_number"', async () => {
        const res = await request(app)
            .get('/v2/api/patients?match_status=approved')
            .set(KEY);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('count');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.count).toBe(res.body.data.length);
        expect(Object.keys(res.body.data[0]).sort()).toEqual(['name', 'patient_id', 'phone']);
    });
});

describe('deprecation headers', () => {
    test('v1 and the old unversioned URLs announce the sunset', async () => {
        for (const path of ['/v1/api/patients?match_status=approved', '/api/patients?match_status=approved']) {
            const res = await request(app).get(path).set(KEY);
            expect(res.headers.deprecation).toBe('true');
            expect(res.headers.sunset).toBe('Fri, 20 Nov 2026 00:00:00 GMT');
            expect(res.headers.link).toContain('rel="successor-version"');
        }
    });

    test('v2 does not carry deprecation headers', async () => {
        const res = await request(app)
            .get('/v2/api/patients?match_status=approved')
            .set(KEY);
        expect(res.headers.deprecation).toBeUndefined();
        expect(res.headers.sunset).toBeUndefined();
    });
});

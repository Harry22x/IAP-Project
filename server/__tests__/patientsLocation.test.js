const app = require('../index')
const request = require('supertest')
const db = require('../db')

afterAll(async () => {
    await db.end();
});

describe('GET/patients/{id}/location', () => {
    it('returns 200 for a successfull fetch with the patient location', async()=> {
        const res = await request(app).get('/api/patients/3/location');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('hospital_id');
        expect(res.body).toHaveProperty('location');
        expect(res.body).toHaveProperty('latitude');
        expect(res.body).toHaveProperty('longitude');

    })

    it('returns 400 for an invalid patient id format', async() => {
        const res = await request(app).get('/api/patients/three/location');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    })

    it('returns 404 for a patient id that does not exist', async() => {
        const res = await request(app).get('/api/patients/99999/location');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    })


})

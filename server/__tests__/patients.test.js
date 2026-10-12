
const app = require('../index')
const request = require('supertest')
const db = require('../db')

afterAll(async () => {
    await db.end();
});

describe('GET/patients?match_status' , () => {
    it('returns 200 for a successfull fetch', async() => {
        const res = await request(app).get('/api/patients?match_status=APPROVED');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('patient_id');
        expect(res.body[0]).toHaveProperty('name');
        expect(res.body[0]).toHaveProperty('phone_number');
    }),


 it('returns 400 for an invalid match_status', async() => {
        const res = await request(app).get('/api/patients?match_status=90233');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

}
);



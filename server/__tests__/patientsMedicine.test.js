const app = require('../index')
const request = require('supertest')
const db = require('../db')

afterAll(async () => {
    await db.end();
});


describe('GET/patients/{patient_id}/medicine', () => {
    it('returns 200 for a successfull fetch with the correct response body', async() => {
        const res = await request(app).get('/api/patients/3/medicine');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('patient_id');
        expect(res.body.prescribed_medicine[0]).toHaveProperty('medicine_name');
        expect(res.body.prescribed_medicine[0]).toHaveProperty('dosage');
    });

    it('returns 404 for a patient_id that does not exist', async()=> {
        const res = await request(app).get('/api/patients/99999/location');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    })

}
)
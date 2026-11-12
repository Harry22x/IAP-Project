const app = require('../index')
const request = require('supertest')
const db = require('../db')


afterAll(async () => {
    await db.end();
});

const apiKey = process.env.API_KEYS ? process.env.API_KEYS.split(',')[0].trim() : '';


describe('PATCH/patients/{patient_id}/reservation', ()=>{
    it('returns 200 status for a patch request with the correct request body', async()=>{
        const payload = {
            "reservation_code": "PL-9511",
            "reservation_status":'Delivered',
        }

        const res = await request(app).patch('/api/patients/3/reservation').set('x-api-key', apiKey).send(payload);
        
        expect(res.status).toBe(200);
        
    })
})
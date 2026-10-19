
const app = require('../index')
const request = require('supertest')
const db = require('../db')



afterAll(async () => {
    await db.end();
});


describe('POST/patients/{patient_id}/reservation', () => {
    let createdReservationCode = null;

  afterEach(async () => {
    if (createdReservationCode) {
    
        await db.query('DELETE FROM patients_reservation WHERE reservation_code = $1',[createdReservationCode])

      createdReservationCode = null; 
    }
  });
    it('Returns status 201 for a correct post', async () => {
        const payload = {
  "reservation_code": "PL-9521",
  "reservation_status": "PENDING",
  "reservation_date": "2024-06-15T10:30:00Z",
  "pickup_window": "Today, 4:00 PM - 6:00 PM",
  "pickup_location": [
    {
      "name": "Westlands Medpoint",
      "location": "Westlands",
      "longitude": 36.8219,
      "latitude": -1.2921
    }
  ]
}

    const res = await request(app).post('/api/patients/3/reservation').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('reservation_code')


    createdReservationCode = res.body.reservation_code;

    })

    it('returns 400 for a request with invalid or missing parameters in the request body', async() => {
        const payload = {
            "reservationCode" : "PL-5999"
        }

        const res = await request(app).post('/api/patients/3/reservation').send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error')
    })

    it('returns 404 for a patient_id that does not exist', async() => {
        const payload ={
  "reservation_code": "PL-9543",
  "reservation_status": "PENDING",
  "reservation_date": "2024-06-15T10:30:00Z",
  "pickup_window": "Today, 4:00 PM - 6:00 PM",
  "pickup_location": [
    {
      "name": "Westlands Medpoint",
      "location": "Westlands",
      "longitude": 36.8219,
      "latitude": -1.2921
    }
  ]
}

        const res = await request(app).post('/api/patients/999/reservation').send(payload);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error')
    })

})
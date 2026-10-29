<h1>API Quickstart </h1>

# Overview
This API will be used by the PharmaLink application (Team 3) to connect our patients with their pharmacies. The API will allow PharmaLink to know which patients have had their surgeries approved, togrther with their details such as the medication that they will require as well as the location that the surgery took place so that they can use it to find the nearest pharmacy with that has the required medication. The API wil also allow the pharmacies to create a reservation that notifies the patient when their medicine will be available for pickup.

# Auth instructions


# /patients
example: <br>
GET/patients?match_status=APPROVED --> 200 {[
    {
        "patient_id": 3,
        "name": "John Smith",
        "phone_number": "+254712345678"
    },
    {
        "patient_id": 4,
        "name": "Jane Smith",
        "phone_number": "+254712345678"
    }
]}

# /patients/{patient_id}/location:

GET/patients/3/location --> 200 {
    "hospital_id": 1,
    "name": "St. Jude Hospital",
    "location": "City Center",
    "latitude": -1.2921,
    "longitude": 36.8219
}

# /patients/{patient_id}/medicine :

GET/patients/3/medicine --> 200 {
    "patient_id": 3,
    "name": "John Smith",
    "prescribed_medicine": [
        {
            "medicine_name": "Amoxocillin",
            "dosage": "500mg"
        }
    ]
}

# /patients/{patient_id}/reservation:

POST /patients/3/reservation with body { <br>
  "reservation_code": "PL-9509",<br>
  "reservation_status": "PENDING",<br>
  "reservation_date": "2024-06-15T10:30:00Z",<br>
  "pickup_window": "Today, 4:00 PM - 6:00 PM",<br>
  "pickup_location": [ <br>
    { <br>
      "name": "Westlands Medpoint",<br>
      "location": "Westlands",<br>
      "longitude": 36.8219,<br>
      "latitude": -1.2921<br>
    }
  ]
}

--> 201 with the created object

PATCH /patients/3/reservation with body { <br>
  "reservation_code": "PL-9509", <br>
  "reservation_status": "Reserved"
}

--> 200 with edited object

# Error format reference

For a patient that does not exist:

GET /patients/99999/location --> 404 {
  "error": "Resource not found",
  "message": "The patient with patien_id 99999 was not found"
}


invalid request body

POST /patients/3/reservation with body { <br>
    "reservationCode" : "PL-5120
} --> 400 {
  "error": "Invalid request parameters or missing required fields in the request body"
}

# QuickStart command

curl -H "Authorization: Bearer <token>"  https://iap-projects.onrender.com/api/patients?match_status=APPROVED
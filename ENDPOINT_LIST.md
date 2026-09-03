TEAM 2 ENDPOINT LIST

| Method | Path | Purpose | Maps to Need |
| --- | --- | --- | --- |
| GET | /patients?match_status=approved| Return approved patient data | Pharmalink needs to get patient records(name,contact information) in order to identify the patients that have undergone surgery and need medicine, create a user on their application and obtain the appropriate patient contact information for communicating medicine availability and pickup details|
|GET| /patients/{patients_id}/location |Retrieve hospital location  | Pharmalink need the hospital's location to identify pharmacies near the patient that have the required medicine in stock and provide relevant pickup information|
|GET | /patients/{patients_id}/medicine | Return prescribed medication records | Pharmalink needs to get a patient's prescribed medication in order to provide the information to pharmacies for stocking|
|POST| /patients/{patient_id}/reservation | Create a medicine reservation| Pharmalink needs to inform the patient that the medicine is available and waiting for payment |
|PATCH | /patient/{patient_id}/reservation| Update an existing reservation|Pharmalink needs to edit a reservation to confirm if payment is received and that the medicine is ready for pick-up |



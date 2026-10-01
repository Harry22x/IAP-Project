1. Removed the match_status field from the /patients endpoint response since the value is already provided as a query parameter therefore it adds unecessary logic to have to retrieve it from another table.

2. Removed the patient_id field form the request body of the /patients/{patient_id}/reservvation POST endpoint as the path parameter already has the value. 
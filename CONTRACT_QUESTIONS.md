# Contract questions for Team 1 (Jua Kali)

1. They do not provide error response codes for any of their endpoints which means we won't know whats happening when our requests don't return anything.

2. They are providing a /bookings enpoint that retrieves all of the bookings in their system which our system does not need to know. We should only know if a particular arisan is free before making the booking

3. We dont understand the request body for the POST /bookings endpoint. It only takes in the service title, price and date so we can't create a booking with a specific artisan using their user_id.


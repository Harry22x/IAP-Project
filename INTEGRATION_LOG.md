Integration Log

# | What broke(Symptom) | Root Cause | Fix | Whose code, and who fixed it |
| --- | --- | --- | --- | --- |
| 1 | Artisans did not have their biodata fields | Partner did not include biodata in artisan profiles | Provider implemented biodata to user profiles in the database and returned it in the response | Partner, fixed by partner
| 2 | The endpoints were inaccessible | Provider’s system was not deployed | Provider deployed their system on render | Provider, fixed by provider
| 3 | Artisan biodata fields were returning null values | Partner did not push their updated database to github | Partner pushed their updated database with the field values to github | Provider, fixed by provider
| 4 | The API keys were invalid | Provider had sent us incomplete API keys | Provider sent us the valid APi keys | Provider, fixed by provider

| 5 | Upstream v2 deprecation notice received | Upstream partner transitioned tasks endpoint to v2 with wrapped `{ data, count }` envelope and renamed fields (`dueDate` -> `due`) | Implemented `partner.js` adapter supporting both v1 and v2, toggleable via `PARTNER_VERSION` env var. Nothing broke in production because the provider gave advance notice with sunset timeline | Upstream provider notice, adapted by consumer (us) |

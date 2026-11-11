# Deprecation Notice: Patients API v1

**To:** Team 3 (PharmaLink)  
**From:** Team 2 (Organ Donation System)  
**Date:** November 12, 2026  

---

## Summary
Version 1 (`v1`) of `GET /api/patients` is deprecated. **Version 2 (`v2`) is live now.**  
Version 1 will remain supported and operational until **November 20, 2026 (Sunset Date)**. Please migrate your integration to `v2` before then.

---

## What Is Changing
- **Wrapped Response:** The top-level bare list `[ ... ]` is now wrapped inside an envelope object: `{ "data": [ ... ], "count": N }`.
- **Field Renaming:** The field `phone_number` is renamed to `phone`.
- **Nothing Else Changes:** 
  - `patient_id` and `name` remain unchanged.
  - The query parameter `?match_status=approved` works identically.
  - Your existing `X-API-Key` remains valid and unchanged.
  - Sub-resource endpoints (`/location`, `/medicine`, `/reservation`) remain fully functional.

---

## Why
Wrapping the response list inside an envelope object allows us to introduce pagination metadata (`page`, `pageSize`, `totalPages`) and search filters in the near future without forcing another breaking change on your application. Standardizing `phone_number` to `phone` removes redundant suffixes across our microservice contracts.

---

## Before and After

### v1 (Current - Supported until Sunset Date)
**Endpoint:** `GET /api/patients?match_status=approved` (or `GET /v1/api/patients?match_status=approved`)
```json
[
  {
    "patient_id": 3,
    "name": "Blue orange",
    "phone_number": "+254712345678"
  }
]
```

### v2 (Live Now - Recommended)
**Endpoint:** `GET /v2/api/patients?match_status=approved`
```json
{
  "data": [
    {
      "patient_id": 3,
      "name": "Blue orange",
      "phone": "+254712345678"
    }
  ],
  "count": 1
}
```

---

## How to Migrate
1. **Update the URL:** Call `/v2/api/patients` instead of `/api/patients`. (Your same `X-API-Key` and `?match_status=approved` query parameter work as before).
2. **Access the Array:** Read the patient list from `response.data.data` (or `body.data`) instead of directly from the root body.
3. **Update the Phone Property:** Read `patient.phone` where your code previously read `patient.phone_number`.
4. **Notify Us:** Once you have updated your client, let us know so we can confirm your traffic transitioning to `/v2` in our `/stats` logs!

---

## Timeline
- **Today (Nov 12, 2026):** `v2` is live. `v1` and unversioned `/api/patients` continue working normally and now include `Deprecation: true`, `Sunset`, and `Link` response headers.
- **November 20, 2026:** `v1` sunset date. (Will be kept running through Demo Day to safeguard partner presentations).

---

## Questions & Support
Feel free to reach out to us at any time if you run into any issues during migration. We will reply promptly.


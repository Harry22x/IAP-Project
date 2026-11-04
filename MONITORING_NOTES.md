# Monitoring Notes — Week 12

## Part A: Logging Rules & Predictions

### 1. What We Log vs. What We Never Log

| Log This | Never Log This |
| :--- | :--- |
| ISO 8601 Timestamp | API keys or bearer tokens (even partial plaintext) |
| HTTP Method and Path (`req.path` only) | Passwords or credentials |
| HTTP Status Code | Full request or response bodies |
| Response time in milliseconds (high-resolution timer) | Query strings (which may expose personal names, filters, or tokens) |
| Caller label (`key-xxxxxx` SHA-256 fingerprint, or `none`) | Anything sensitive or private a caller would be upset to see |

---

### 2. Predictions Before Collecting Data

#### Prediction 1: Slowest Endpoint
- **Prediction:** `GET /api/patients?match_status=approved` and `POST /api/patients/:patient_id/reservation`
- **Why:** `GET /api/patients` executes a join across `matching_match` and `patients_patient` with SQL array unnesting (`patient_id = ANY($1::int[])`). The initial connection and multi-record query incur heavier database overhead than single-row lookups.

#### Prediction 2: Most Errors
- **Prediction:** `GET /api/patients/:patient_id/location` and `GET /api/patients/:patient_id/medicine`
- **Why:** Callers frequently probe non-existent or unmapped patient IDs (e.g. `9999`), generating `404 Not Found` client errors. Additionally, unauthorized requests without keys yield `401`.

---

## Part E: Actual Data & Observations

### 1. Predicted vs. Actual Numbers

From our `/stats` reading across 250 processed requests:

```json
{
  "startedAt": "2026-11-04T13:29:40.443Z",
  "uptimeSeconds": 96,
  "total": 250,
  "clientErrors": 151,
  "serverErrors": 0,
  "errorRatePercent": 0,
  "avgMs": 1.7,
  "routes": {
    "GET /api/patients/": {
      "count": 25,
      "clientErrors": 0,
      "serverErrors": 0,
      "avgMs": 4.9,
      "maxMs": 77.7
    },
    "GET /api/patients/:patient_id/location": {
      "count": 78,
      "clientErrors": 21,
      "serverErrors": 0,
      "avgMs": 2.6,
      "maxMs": 43.3
    },
    "GET /api/patients/:patient_id/medicine": {
      "count": 29,
      "clientErrors": 12,
      "serverErrors": 0,
      "avgMs": 2.3,
      "maxMs": 26.9
    },
    "GET (no route)": {
      "count": 118,
      "clientErrors": 118,
      "serverErrors": 0,
      "avgMs": 0.2,
      "maxMs": 1.8
    }
  }
}
```

- **Slowest endpoint on average:** `GET /api/patients/` at **4.9 ms average** (with a peak worst-case of **77.7 ms** on the cold-start connection). This matched our prediction: multi-record matching across tables took longer than single-patient queries.
- **Endpoint with the worst-case spike:** `GET /api/patients/` had a max of **77.7 ms**, followed by `GET /api/patients/:patient_id/location` with **43.3 ms**.
- **Most client errors (4xx):** 
  - `(no route)` produced **118 client errors** (consisting of 104 `429 Too Many Requests` rate-limit blocks, 7 `401 Unauthorized` key rejections, and 7 `404 Not Found` calls to invalid paths).
  - Among valid routes, `GET /api/patients/:patient_id/location` had **21 client errors** (all 404s from non-existent IDs).
- **Server errors (5xx):** **0 errors (0.0% error rate)**. The server remained healthy under burst load.

---

### 2. Real Traffic Pattern Observed

> **Pattern:** `GET /api/patients/:patient_id/location` was called 78 times. It averaged **2.6 ms**, but its worst-case call took **43.3 ms**. Out of the 78 calls, **21 calls (26.9%) returned 404 Not Found**.

---

### 3. Hypothesis: Why It Happens & What to Check Next

- **Why it happens:** 
  1. The 404 errors occur because external partners or automated scripts send synthetic patient IDs (such as `9999`) to test boundary behavior.
  2. The 43.3 ms spike occurs on the very first query to the PostgreSQL pool when opening the TCP connection and TLS handshake before connection pooling stabilizes subsequent requests down to ~1–2 ms.
- **What to check next:**
  - Check whether our database connection pool (`pg.Pool`) has pre-warmed idle connections on startup.
  - Inspect partner request logs to confirm whether 404s are probing or bugs in partner client logic.

---

### 4. Production Alert Proposal

- **Metric:** `errorRatePercent` (5xx Server Errors / Total Requests)
- **Threshold:** `errorRatePercent > 2%` sustained for 3 minutes, OR `serverErrors >= 5` in 1 minute.
- **Action When Triggered:**
  1. PagerDuty / Ops notification dispatched to the on-call engineer.
  2. While the human investigates, the application should automatically switch to our **Week 11 Fallback mode**: serve cached/saved partner records or graceful degradation instead of failing abruptly for patients and coordinators.

---

### 5. Sample Log Output

```json
{"time":"2026-11-04T13:29:58.701Z","method":"GET","path":"/api/patients","status":200,"ms":77.7,"caller":"key-0d5ecb"}
{"time":"2026-11-04T13:29:58.765Z","method":"GET","path":"/api/patients/9999/location","status":404,"ms":1.6,"caller":"key-0d5ecb"}
{"time":"2026-11-04T13:29:59.889Z","method":"GET","path":"/api/patients","status":401,"ms":0.3,"caller":"none"}
{"time":"2026-11-04T13:30:17.419Z","method":"GET","path":"/api/patients/9999/location","status":404,"ms":43.3,"caller":"key-2b4e2c"}
{"time":"2026-11-04T13:30:42.503Z","method":"GET","path":"/api/patients/3/location","status":429,"ms":0.1,"caller":"key-0d5ecb"}
```
*(Proving keys are hashed to `key-xxxxxx`, invalid/missing keys show as `none`, and 0 API keys appear in plaintext).*

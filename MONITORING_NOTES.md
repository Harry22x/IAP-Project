

# Monitoring Notes — Week 12

## Part A: Logging Rules & Predictions

### 1. What We Log vs. What We Never Log

| Log This | Never Log This |
| :--- | :--- |
| ISO 8601 Timestamp | API keys or bearer tokens (even partial plaintext) |
| HTTP Method and Path (`req.path` only, no query string) | Passwords or credentials |
| HTTP Status Code | Full request or response bodies |
| Response time in milliseconds (high-resolution `process.hrtime.bigint()`) | Query strings (which can carry personal names, filters, or tokens) |
| Caller label (`key-xxxxxx` SHA-256 fingerprint, or `none`) | Anything sensitive or private a caller would be upset to see |

> **Note on API Keys:** Any keys used during local testing are throwaway development keys. Real production keys are never committed to version control, never written into documentation, and never printed in plaintext into logs.

---

### 2. Predictions Before Collecting Data

#### Prediction 1: Slowest Endpoint
- **Prediction:** `POST /api/patients/:patient_id/reservation` and `GET /api/patients?match_status=approved`
- **Why:** 
  1. `POST /reservation` must perform rigorous schema validation across multiple fields, execute two sequential database queries (a `SELECT` patient validation check followed by an `INSERT INTO patients_reservation` with JSONB parsing), and wait for PostgreSQL write-commit durability.
  2. `GET /patients` performs multi-record matching across tables using SQL array lookups (`patient_id = ANY($1::int[])`), incurring more processing than simple primary key lookups.

#### Prediction 2: Most Errors
- **Prediction:** `POST /api/patients/:patient_id/reservation` and `GET /api/patients/:patient_id/medicine`
- **Why:** 
  1. `POST /reservation` has strict validation rules (non-empty strings, length limits, valid enum statuses, valid ISO date-times, structured pickup location objects). Any malformed request returns `400 Bad Request`.
  2. Sub-resource endpoints (`/location`, `/medicine`) frequently receive non-existent patient IDs (`9999`) from clients and automated tests, returning `404 Not Found`.

---

## Part E: Actual Data & Observations
*(To be completed after running traffic in Part D)*

### 1. Predicted vs. Actual Numbers

We tested our complete suite of endpoints—including `POST /reservation`—sending 115 requests across our client and partner keys:

```json
{
  "startedAt": "2026-11-04T19:07:57.064Z",
  "uptimeSeconds": 58,
  "total": 115,
  "clientErrors": 61,
  "serverErrors": 0,
  "errorRatePercent": 0,
  "avgMs": 4.7,
  "routes": {
    "POST /api/patients/:patient_id/reservation": {
      "count": 30,
      "clientErrors": 20,
      "serverErrors": 0,
      "avgMs": 4.2,
      "maxMs": 27.1
    },
    "GET /api/patients/:patient_id/location": {
      "count": 32,
      "clientErrors": 12,
      "serverErrors": 0,
      "avgMs": 4.8,
      "maxMs": 101.6
    },
    "GET /api/patients/": {
      "count": 16,
      "clientErrors": 0,
      "serverErrors": 0,
      "avgMs": 2.4,
      "maxMs": 5.6
    },
    "GET /api/patients/:patient_id/medicine": {
      "count": 14,
      "clientErrors": 6,
      "serverErrors": 0,
      "avgMs": 14.1,
      "maxMs": 173.3
    },
    "GET (no route)": {
      "count": 23,
      "clientErrors": 23,
      "serverErrors": 0,
      "avgMs": 0.9,
      "maxMs": 5.9
    }
  }
}
```

---

### 2. Error Analysis: Comparing Error Rates vs. Raw Counts

Our earlier burst testing produced 104 intentional `429 Too Many Requests` responses, which artificially dominated the error statistics. Evaluating the error picture under normal representative traffic reveals a different reality:

| Endpoint | Total Requests | Client Errors (4xx) | Error Rate (%) | Primary Causes |
| :--- | :---: | :---: | :---: | :--- |
| `POST .../reservation` | 30 | 20 | **66.7%** | Schema validation failures (`400`) and missing patient IDs (`404`) |
| `GET .../medicine` | 14 | 6 | **42.9%** | Non-existent patient IDs (`404`) |
| `GET .../location` | 32 | 12 | **37.5%** | Non-existent patient IDs (`404`) |
| `GET /api/patients/` | 16 | 0 | **0.0%** | Valid query parameter (`200`) |
| `(no route)` | 23 | 23 | **100.0%** | Missing/invalid API keys (`401`) and non-existent URLs (`404`) |

- **Key Takeaway:** If looking only at raw counts, `location` had more error occurrences (12) than `medicine` (6). However, comparing **error rates** shows that `medicine` actually failed at a significantly higher rate (**42.9% vs. 37.5%**).
- `POST .../reservation` proved to be the most error-prone endpoint (**66.7% error rate**) because its multi-field validator strictly enforces formats, rejecting malformed bodies before reaching the database.

---

### 3. Latency Analysis & Worst-Case Spikes Hypothesis

- **Steady-State Performance:** Across all endpoints, steady-state response times were exceptionally fast, averaging between **2.4 ms and 4.8 ms**.
- **Worst-Case Latency Spikes:**
  - `GET /api/patients/:patient_id/location` experienced a **101.6 ms** peak.
  - `GET /api/patients/:patient_id/medicine` experienced a **173.3 ms** peak.
- **Log Investigation & Hypothesis:**
  Examining the timestamped log lines reveals the exact cause:
  1. **Line 7 (101.6 ms):** This was the **very first request that queried PostgreSQL after startup**. The requests before it were rejected by the authentication middleware without touching the database. The 101.6 ms latency was the cost of the initial TCP handshake, socket establishment, and database pool connection. The very next query dropped immediately to **1.5 ms**.
  2. **Line 79 (173.3 ms):** Between line 78 (`19:08:16`) and line 79 (`19:08:40`), the server sat completely idle for **24 seconds**. Line 79 was the **first request from a new client/TCP session** (`caller: key-2b4e2c`). Waking up the idle connection pool socket and completing the new TLS/TCP negotiation created the 173.3 ms spike. The subsequent request on line 80 dropped immediately back to **1.4 ms**.

---

### 4. Production Alert Proposal with Time Windows

- **The Limitation of `/stats`:** The `/stats` endpoint maintains cumulative counters since server startup. A cumulative error rate cannot detect a sudden outage if obscured by hours of healthy historical traffic.
- **Alert Rule:** An external monitoring tool (such as Prometheus, CloudWatch, or a health poller) must scrape `/stats` every 30 seconds and calculate the delta over a **rolling 3-minute window**:
  $$\text{Window Error Rate} = \frac{\text{serverErrors}(t) - \text{serverErrors}(t - 3\text{m})}{\text{total}(t) - \text{total}(t - 3\text{m})} \times 100\%$$
- **Threshold:** Alert fires if **Window Error Rate > 2%** over 3 consecutive minutes, or if **$\Delta$serverErrors $\ge$ 5** within any 1-minute window.
- **Automated Mitigation:** While an on-call engineer is paged, the API automatically triggers graceful degradation (serving cached partner records from Week 11 fallback resilience) rather than returning 500 errors to hospitals and pharmacies.

---

### 5. Sample Log Output

```json
{"time":"2026-11-04T19:08:12.076Z","method":"GET","path":"/api/patients","status":401,"ms":1.5,"caller":"none"}
{"time":"2026-11-04T19:08:12.239Z","method":"GET","path":"/api/patients/3/location","status":200,"ms":101.6,"caller":"key-0d5ecb"}
{"time":"2026-11-04T19:08:13.102Z","method":"POST","path":"/api/patients/3/reservation","status":201,"ms":5.4,"caller":"key-0d5ecb"}
{"time":"2026-11-04T19:08:13.160Z","method":"POST","path":"/api/patients/3/reservation","status":400,"ms":0.8,"caller":"key-0d5ecb"}
{"time":"2026-11-04T19:08:40.540Z","method":"GET","path":"/api/patients/9999/medicine","status":404,"ms":173.3,"caller":"key-2b4e2c"}
```
*(Confirms key hashing, rejected request logging, path cleanliness without query strings, and zero plaintext credentials).*

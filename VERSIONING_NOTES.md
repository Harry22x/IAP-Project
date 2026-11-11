# Versioning Notes — Week 13

## Part A: The Breaking Change & Prediction

### 1. The Change (in one sentence)
In `GET /api/patients`, the top-level bare array `[...]` is wrapped in an envelope object `{ "data": [...], "count": N }`, and the field `phone_number` is renamed to `phone`.

### 2. Why It Is Worth a Break
1. **Envelope Architecture for Extensibility:** Wrapping lists in `{ data, count }` provides room to add pagination metadata (`page`, `pageSize`, `totalPages`), caching tags, or query filters later without needing another breaking change.
2. **Consistent Field Naming:** Renaming `phone_number` to `phone` standardizes contact field naming across our microservice contracts and removes redundant snake_case suffixes.

### 3. Prediction: What Will Fail in Team 3's (PharmaLink) Code
- **The Array Crash:** PharmaLink's client code (e.g., in their patient list view or pharmacy order creator) currently treats the HTTP response body as an iterable array (such as `response.data.map(...)` or `for (const patient of res.body)`). When calling v2 without migrating, their code will crash with:
  ```text
  TypeError: response.data.map is not a function
  ```
- **The Undefined Property:** Any component rendering `patient.phone_number` to display contact information for medicine pickup notifications will evaluate to `undefined` instead of the phone string.

---

## Part E: Receiving Upstream Breaking Change (Team 1)

When our upstream provider (Team 1: KaziBuddy) announced their deprecation notice for `/tasks` transitioning to `/v2/tasks` with wrapped envelopes and renamed `due` dates, we insulated our codebase by implementing the **Adapter Pattern** in `server/partner.js`.

### 1. Centralized Version Parsing (`server/partner.js`)
Instead of having response parsing scattered across route handlers, `partner.js` serves as the single source of truth for upstream contract shapes:
- `versions.v1.parse`: Extracts `title` and `dueDate` from a raw array.
- `versions.v2.parse`: Validates that `body.data` is an array (failing loudly with an informative error if malformed) and maps `t.due` to internal `dueDate`.

### 2. Zero-Downtime Environment Switch
In `server/routes/upcoming.js`, the active version is controlled dynamically via `process.env.PARTNER_VERSION || 'v1'`. Migrating to v2—or instantly rolling back if an issue emerges—requires only toggling one environment variable without altering business logic.

---

## Part F: Reflection on Versioning

### 1. Who Still Uses v1?
From our live `/stats` monitoring endpoint:
```json
{
  "routes": {
    "GET /v1/api/patients/": { "count": 1, "avgMs": 101.9 },
    "GET /v2/api/patients": { "count": 1, "avgMs": 62.2 },
    "GET /api/patients/": { "count": 2, "avgMs": 59.5 }
  }
}
```
Looking at `/stats`, the unversioned route `GET /api/patients/` still accounts for 50% of patient traffic, with partner caller fingerprints hitting the legacy route. We **cannot** switch off v1 today because doing so would immediately take down PharmaLink's application. We must keep v1 alive through the sunset date and until the caller counts on `GET /api/patients` and `GET /v1/api/patients` drop to zero.

### 2. Reflection (Perspective-Taking & Lessons Learned)
Receiving a breaking change notice on short notice is initially jarring. When our upstream partner announced their transition, my first reaction was concern that our fallback logic would silently mask a failure, presenting cached data while our live integration sat broken. Having a clear deprecation notice made a dramatic difference: because it included exact before-and-after JSON payloads, I immediately knew which field changed without having to guess or probe their live endpoints blindly.

Looking back at our own notice sent to PharmaLink, I realized that while our schema diff was crystal clear, we initially took for granted how easily frontend components crash when an expected array becomes an object. If I could rewrite our notice, I would provide a one-line migration code snippet (`const patients = res.data.data || res.data;`) that they could copy-paste directly to handle both versions during the rollout window.

As an API owner moving forward, the single most critical practice I will carry is maintaining backward-compatible unversioned alias routes (`app.use('/', v1)`) accompanied by standard RFC `Deprecation` and `Sunset` HTTP headers. Announcing a deprecation both out-of-band via markdown and in-band over HTTP headers ensures no consumer is ever caught off guard.

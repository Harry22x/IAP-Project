# System Architecture & Cross-Team API Integration Guide

## 1. Executive Summary & Team Roles

This project is part of the **Internet Application Programming (IAP)** multi-tier microservice simulation. The ecosystem consists of three cooperating teams exchanging healthcare and service data over HTTP REST APIs:

```
┌─────────────────────────┐          HTTP (REST)          ┌──────────────────────────────────────┐          HTTP (REST)          ┌─────────────────────────┐
│  Team 1: Jua Kali       │ ────────────────────────────> │  Team 2: Organ Donation System       │ ────────────────────────────> │  Team 3: PharmaLink     │
│  (Upstream Producer)    │   GET /api/artisans           │  (Our System - Consumer & Producer)  │   GET /patients?match_status  │  (Downstream Consumer)  │
│  Node + Express + SQLite│                               │  React + Django + Node + PostgreSQL  │   GET /patients/:id/medicine  │  Pharmacies & Medicine  │
└─────────────────────────┘                               └──────────────────────────────────────┘                               └─────────────────────────┘
```

| Role | Project Folder | Technology Stack | Primary Port | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Producer (Team 1)** | [Team 1/-Team-1--Kazibuddy-app](file:///c:/Users/IAN%20NJOGU/OneDrive/Desktop/IAP-Project/Team%201/-Team-1--Kazibuddy-app) | Node.js, Express, SQLite (`better-sqlite3`) | `3000` | Manages artisans; exposes artisan profiles with health parameters (`blood_type`, `rhesus_factor`). |
| **Consumer & Core (Team 2 - Us)** | [backend/](file:///c:/Users/IAN%20NJOGU/OneDrive/Desktop/IAP-Project/backend), [server/](file:///c:/Users/IAN%20NJOGU/OneDrive/Desktop/IAP-Project/server), [frontend/](file:///c:/Users/IAN%20NJOGU/OneDrive/Desktop/IAP-Project/frontend) | React (Vite), Django REST Framework, Node/Express, PostgreSQL | `5173` (UI)<br>`8000` (Django)<br>`5000` (Node) | Runs recipient waiting lists, executes matching algorithms against both internal hospital donors and Jua Kali artisans, and exposes approved patient data to PharmaLink. |
| **Downstream Partner (Team 3)** | External (PharmaLink) | External Application | Remote | Consumes approved patient surgery records, hospital geolocations, and prescription lists to reserve medicines for pickup. |

---

## 2. Architectural Overview

```mermaid
flowchart TB
    subgraph Frontend ["Frontend Tier (Port 5173)"]
        UI["React + Vite UI<br/>(TCMatches.jsx, LogIn.jsx)"]
    end

    subgraph Team2_Backend ["Team 2: Core Organ Donation System"]
        subgraph DjangoAPI ["Django REST API (Port 8000)"]
            Auth["JWT Auth (/auth/token/, /auth/me/)"]
            MatchingService["OrganMatchingService<br/>(services.py)"]
            DjangoClient["artisan_client.py<br/>(HTTPX Client)"]
        end

        subgraph NodeAPI ["Node / Express API (Port 5000)"]
            NodeMatches["artisanMatches.js"]
            NodeClient["artisanApi.js<br/>(Fetch Client)"]
            PharmaRoutes["PharmaLink Endpoints<br/>(/api/patients, /location, /medicine)"]
        end

        PSQL[("PostgreSQL Database<br/>(DB: organ)")]
    end

    subgraph Team1_Producer ["Team 1: Upstream Producer (Port 3000)"]
        ExpressProd["Express Server (server.js)"]
        SQLiteDB[("SQLite Database<br/>(juakali.db)")]
    end

    %% Interactions
    UI -->|1. POST /api/v1/matching/run/ (Bearer JWT)| DjangoAPI
    DjangoAPI -->|Read Recipient & Hospital Donors| PSQL
    DjangoClient -->|2. GET /api/artisans| ExpressProd
    ExpressProd -->|SELECT * FROM users WHERE role='artisan'| SQLiteDB

    NodeMatches -->|Alternative Node Pipeline| PSQL
    NodeClient -->|GET /api/artisans| ExpressProd

    DjangoAPI -->|3. Combined Match Results (Hospital + Jua Kali)| UI
```

---

## 3. Database Decoupling: SQLite vs. PostgreSQL

A core concept in Internet Application Programming is **service boundary decoupling**:

* **Team 1's SQLite Database (`juakali.db`):** Stores artisans, customer bookings, and ratings. Team 1 altered their `users` table to add `blood_type` (`A`, `B`, `AB`, `O`) and `rhesus_factor` (`positive`, `negative`).
* **Team 2's PostgreSQL Database (`organ`):** Stores patients, donors, recipients, hospitals, medical records, and surgery reservations using strict relational schemas, foreign keys, and indexes.
* **Why the database difference does not cause conflicts:** The systems **never connect directly to each other's database**. Team 1 serializes its internal SQLite rows into JSON format over HTTP. Team 2 ingests that JSON, normalizes the data in-memory, queries PostgreSQL for recipient records, and computes matches.

---

## 4. End-to-End Data Pipeline: Running the Match

### Step 1: Normalizing Producer Data
Team 1 stores blood data in two separate columns. Team 2 normalizes them into unified blood group strings:

$$\text{Blood Group} = \text{blood\_type} + (\text{rhesus\_factor} == \text{'positive'} \; ? \; \text{'+'} : \text{'-'})$$

* *Example:* `blood_type: "O"`, `rhesus_factor: "negative"` $\longrightarrow$ `"O-"`

### Step 2: ABO and Rh Factor Compatibility Rules
Implemented in both [server/utils/bloodGroup.js](file:///c:/Users/IAN%20NJOGU/OneDrive/Desktop/IAP-Project/server/utils/bloodGroup.js) and [backend/matching/services.py](file:///c:/Users/IAN%20NJOGU/OneDrive/Desktop/IAP-Project/backend/matching/services.py):

| Recipient Blood Group | Compatible Donor Blood Groups | Universal Status |
| :---: | :--- | :--- |
| **O-** | `O-` | Universal donor to all, but can only receive `O-` |
| **O+** | `O+`, `O-` | Can receive from any O donor |
| **A-** | `A-`, `O-` | Can receive from negative A and O |
| **A+** | `A+`, `A-`, `O+`, `O-` | Can receive from any A or O donor |
| **B-** | `B-`, `O-` | Can receive from negative B and O |
| **B+** | `B+`, `B-`, `O+`, `O-` | Can receive from any B or O donor |
| **AB-** | `AB-`, `A-`, `B-`, `O-` | Can receive from all negative types |
| **AB+** | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` | **Universal Recipient** (compatible with all) |

### Step 3: Match Scoring Algorithm
When running matches for a recipient, the system calculates a weighted score out of 100:

1. **Blood Match Score (Max 40 pts):**
   * Exact Match (e.g., $A+ \rightarrow A+$): `40 pts`
   * Compatible Match (e.g., $O- \rightarrow A+$): `25 pts`
2. **Urgency Score (Max 25 pts):**
   * Level 3 (High Urgency): `25 pts`
   * Level 2 (Medium Urgency): `15 pts`
   * Level 1 (Low Urgency): `5 pts`
3. **Waiting Time Score (Max 15 pts):**
   * Waiting $>30$ days: `15 pts`
   * Waiting $>7$ days: `10 pts`
   * Waiting $\le 7$ days: `5 pts`
4. **Clinical Data (Hospital Donors Only, Max 20 pts):**
   * Verified HLA typing and negative crossmatch medical records.

### Step 4: Frontend Presentation
In [frontend/organ-app/src/components/TCMatches.jsx](file:///c:/Users/IAN%20NJOGU/OneDrive/Desktop/IAP-Project/frontend/organ-app/src/components/TCMatches.jsx):
* Hospital matches are labeled with a gray **`Hospital`** badge.
* Team 1 artisan matches are labeled with an amber **`Jua Kali`** badge and marked as **`Producer donor`**, displaying the artisan's name and contact phone number.

---

## 5. System File Directory Map

```
IAP-Project/
├── Team 1/                                   # Upstream Producer (Jua Kali)
│   └── -Team-1--Kazibuddy-app/
│       ├── server/
│       │   ├── server.js                     # Express app on Port 3000 (CORS enabled)
│       │   ├── db.js                         # SQLite connection & schema (juakali.db)
│       │   └── routes/
│       │       └── artisans.js               # GET /api/artisans (returns blood_type & rhesus_factor)
│       └── openapi.yaml                      # Team 1 OpenAPI specification
│
├── backend/                                  # Team 2 Core Django REST Backend (Port 8000)
│   ├── backend/
│   │   ├── settings.py                       # PostgreSQL credentials, JWT auth, app registry
│   │   └── urls.py                           # API routing prefix: /api/v1/
│   ├── accounts/                             # Custom user model & JWT login views
│   ├── hospitals/                            # Hospital model (name, location, lat, long)
│   ├── patients/                             # Patient, Donor, Recipient, Reservation models
│   ├── matching/
│   │   ├── views.py                          # POST /api/v1/matching/run/ endpoint
│   │   ├── services.py                       # Scoring algorithm & donor merging
│   │   └── artisan_client.py                 # Live HTTPX consumer calling Team 1 (:3000)
│   └── seed_test_data.py                     # Test data seed script (creates coordinator@stjude.com)
│
├── server/                                   # Team 2 Node/Express Partner API (Port 5000)
│   ├── index.js                              # Express app on Port 5000
│   ├── db.js                                 # PostgreSQL connection pool (pg)
│   ├── .env                                  # DB credentials & ARTISAN_API_URL=http://localhost:3000
│   ├── services/
│   │   └── artisanApi.js                     # Fetch consumer for Team 1 artisans
│   ├── utils/
│   │   └── bloodGroup.js                     # ABO & Rh blood compatibility matrix
│   └── routes/
│       ├── artisanMatches.js                 # GET /api/matches/artisans?patient_id=X
│       ├── patients.js                       # GET /api/patients?match_status=approved (for PharmaLink)
│       ├── patientsLocation.js               # GET /api/patients/:id/location (for PharmaLink)
│       ├── patientsMedicine.js               # GET /api/patients/:id/medicine (for PharmaLink)
│       └── patientsReservationPost.js        # POST /api/patients/:id/reservation (for PharmaLink)
│
└── frontend/                                 # Team 2 React Client (Port 5173)
    └── organ-app/
        ├── src/
        │   ├── services/api.js               # Axios instance pointing to Django (:8000/api/v1)
        │   └── components/
        │       ├── LogIn.jsx                 # Role-based login (Coordinator, Admin, Doctor)
        │       ├── TCDash.jsx                # Transplant Coordinator Dashboard
        │       └── TCMatches.jsx             # Runs matching algorithm and displays results
```

---

## 6. How to Run the Complete Stack

Open **4 separate terminal windows** to run the services:

### Terminal 1: Team 1 Producer API (Port 3000)
```powershell
cd "c:\Users\IAN NJOGU\OneDrive\Desktop\IAP-Project\Team 1\-Team-1--Kazibuddy-app\server"
node server.js
```

### Terminal 2: Team 2 Django Backend (Port 8000)
```powershell
cd "c:\Users\IAN NJOGU\OneDrive\Desktop\IAP-Project\backend"
.\.venv\Scripts\python.exe manage.py runserver 8000
```

### Terminal 3: Team 2 Node Partner API (Port 5000)
```powershell
cd "c:\Users\IAN NJOGU\OneDrive\Desktop\IAP-Project\server"
node index.js
```

### Terminal 4: Team 2 React Frontend (Port 5173)
```powershell
cd "c:\Users\IAN NJOGU\OneDrive\Desktop\IAP-Project\frontend\organ-app"
npm run dev
```

---

## 7. Verification & Testing Commands

### 1. Test Team 1's Artisan API
```powershell
curl.exe http://localhost:3000/api/artisans
```

### 2. Test Team 2's Node Matching Route
```powershell
curl.exe http://localhost:5000/api/matches/artisans?patient_id=3
```

### 3. Test Team 2's PharmaLink Partner Routes
```powershell
curl.exe "http://localhost:5000/api/patients?match_status=approved"
curl.exe "http://localhost:5000/api/patients/3/location"
curl.exe "http://localhost:5000/api/patients/3/medicine"
```

### 4. Frontend Credentials
Open [http://localhost:5173/](http://localhost:5173/) in your browser:
* **Email:** `coordinator@stjude.com`
* **Password:** `pass123`
* Navigate to **Matching Results** (`/matches`) and click **"Run Match Algorithm"**.

# Smart Classroom & Timetable Scheduler (SmartSched)

A configurable, constraint-based academic timetable scheduler that automatically generates **conflict-free weekly timetables** while coordinating faculty, courses, student sections, classrooms and availability, or clearly reports when no valid timetable exists.

> **Status:** Working prototype (B.Tech Minor Project). Uses a representative synthetic dataset; database persistence and authentication are planned.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Hard Constraints (H1–H8)](#hard-constraints-h1h8)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Scope](#scope)

---

## Features

### Scheduling engine
- Timetable generation modelled as a **Constraint Satisfaction Problem (CSP)**
- **Backtracking search** with a dynamic **MRV (Minimum Remaining Values)** heuristic
- **Independent validator** that re-checks every generated timetable against all eight hard constraints
- **Infeasibility detection**: reports *why* no timetable exists instead of returning an invalid one
- 12–01 slot kept free as the **lunch break**

### Admin dashboard (`/admin`)
- Edit **courses** (sessions per week, required room type)
- Edit **sections** (student count) and **rooms** (type, capacity)
- Per-faculty **availability grids** (checked = unavailable)
- **Configuration change & impact summary** compared to the default dataset
- **Reset to default data** in one click
- One-click **timetable generation** with loading feedback
- **H1–H8 validation dashboard** and weekly timetable for every section

### Teacher view (`/teacher`)
- Select a faculty member and **edit and save their availability**
- Saved availability is used in the next timetable generation
- **Personal weekly timetable** showing only that teacher's classes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS |
| Backend | Node.js, Express.js (REST API) |
| Scheduling | CSP + Backtracking + MRV heuristic, independent H1–H8 validator |
| Database | PostgreSQL (via `pg`), normalised schema with saved timetable runs |
| Data | Seed datasets in `server/data/` (small: 3 sections, large: 5 sections) |
| Version control | Git, GitHub |

---

## Project Structure

```text
smart-classroom-and-timetable-scheduler/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── api/                # fetch calls to the Express API
│   │   ├── context/            # shared dataset state (DatasetContext)
│   │   ├── components/         # tables, availability grid, timetable, validation panel
│   │   ├── pages/              # AdminPage, TeacherPage, RunsPage
│   │   └── utils/              # change-detection (diff) logic
│   └── index.html
├── server/                     # Express API + scheduling engine
│   ├── data/
│   │   ├── seedData.js         # small dataset (3 sections, 57 sessions)
│   │   └── seedDataLarge.js    # large dataset (5 sections, 10 courses)
│   ├── db/
│   │   ├── schema.sql          # PostgreSQL tables
│   │   ├── pool.js             # database connection
│   │   ├── seed.js             # loads a seed dataset into the database
│   │   └── repository.js       # all SQL queries (dataset, availability, runs)
│   ├── src/
│   │   ├── utils.js            # builds CSP session variables
│   │   ├── scheduler.js        # CSP + backtracking + MRV
│   │   ├── validator.js        # independent H1–H8 validation
│   │   └── scorer.js           # S1–S3 soft-constraint scoring (not yet integrated)
│   ├── server.js               # REST API, serves the React build
│   ├── index.js                # command-line runner
│   └── test-infeasible.js      # infeasibility test
├── package.json                # root scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or later
- [PostgreSQL](https://www.postgresql.org/) 14 or later
  - macOS: easiest with [Postgres.app](https://postgresapp.com/), then click **Initialize**

### 1. Clone and install
```bash
git clone https://github.com/suhani-k7/smart-classroom-and-timetable-scheduler.git
cd smart-classroom-and-timetable-scheduler
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Set up the database
```bash
createdb smartsched
cd server
cp .env.example .env        # then edit DATABASE_URL with your username
npm run db:setup            # creates tables and loads the seed data
cd ..
```
To use the larger dataset, set `SEED=large` in `server/.env` and run `npm run db:seed` again.

### 3. Run
```bash
npm start
```
Open **http://localhost:3001**.

| Page | URL |
|---|---|
| Admin dashboard | http://localhost:3001/admin |
| Teacher view | http://localhost:3001/teacher |
| Run history | http://localhost:3001/runs |

### Development mode (hot reload)
```bash
npm run server    # terminal 1 – API on :3001
npm run client    # terminal 2 – React on :5173
```
Open **http://localhost:5173**.

### Useful database commands
| Command (inside `server/`) | What it does |
|---|---|
| `npm run db:schema` | Drops and recreates all tables |
| `npm run db:seed` | Reloads the seed data (keeps saved runs) |
| `npm run db:setup` | Both of the above |

### Run the scheduler from the command line

```bash
cd server
node index.js
```

---

## How It Works

```text
Academic data (faculty, courses, sections, rooms, availability)
        │
        ▼
Generate session variables (one per required weekly session)
        │
        ▼
Build domains (day, slot, room, faculty) satisfying H4–H7
        │
        ▼
Backtracking search with MRV, enforcing H1–H3
        │
        ├──► No valid assignment ──► Report infeasibility (with reason)
        │
        ▼
Feasible timetable
        │
        ▼
Independent validation against H1–H8
        │
        ▼
Section-wise timetables + validation report
```

The scheduler is **feasibility-first**: it guarantees that every hard constraint is satisfied before any quality optimisation. Soft-constraint scoring (S1–S3: consecutive classes, student gaps, room fit) is implemented in `scorer.js` but not yet part of the pipeline.

---

## Hard Constraints (H1–H8)

| ID | Constraint | Enforced at |
|---|---|---|
| H1 | No faculty double-booking | During search |
| H2 | No room double-booking | During search |
| H3 | No section double-booking | During search |
| H4 | Faculty availability | Domain construction |
| H5 | Room availability | Domain construction |
| H6 | Room capacity ≥ section size | Domain construction |
| H7 | Faculty eligible for the course | Domain construction |
| H8 | Required weekly sessions per course | By construction, verified by validator |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dataset` | Current working dataset |
| `GET` | `/api/dataset/default` | Original seed dataset |
| `POST` | `/api/reset` | Reset server state to the seed dataset |
| `POST` | `/api/generate` | Save the submitted dataset to the database, generate + validate, and store the run |
| `GET` | `/api/faculty-list` | Faculty IDs, names and expertise |
| `GET` | `/api/faculty/:id` | One faculty member's record |
| `PUT` | `/api/faculty/:id/availability` | Update one faculty member's availability |
| `POST` | `/api/faculty/:id/personal-timetable` | Generate and return one faculty member's sessions |
| `GET` | `/api/runs` | Recent timetable generation runs (latest first) |
| `GET` | `/api/runs/:id` | One run with its full timetable and validation report |

> All configuration edits and generated runs are stored in **PostgreSQL**, so they survive server restarts. `POST /api/reset` reloads the seed data.

---

## Testing

```bash
npm run test:infeasible
```

Results on the representative dataset (6 faculty, 8 courses, 3 sections, 5 rooms, 5 days × 5 slots):

| Metric | Result |
|---|---|
| Sessions placed | 57 / 57 |
| Hard-constraint violations | 0 |
| Search nodes explored | 57 (no backtracking needed) |
| Infeasible dataset (no faculty eligible for AI) | Correctly reported as infeasible |

---

## Scope

SmartSched is designed as a configurable academic scheduling system that can eventually support institutional datasets. Complete ERP integration, attendance, notifications, multi-campus optimisation and production-scale deployment are currently outside the core scope.

> All data in this repository is synthetic and does not represent real institutional records.
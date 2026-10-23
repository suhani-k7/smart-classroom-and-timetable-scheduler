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
- [Roadmap](#roadmap)
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
| Data | In-memory server state seeded from `server/data/seedData.js` |
| Database | PostgreSQL *(planned)* |
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
│   │   ├── pages/              # AdminPage, TeacherPage
│   │   └── utils/              # change-detection (diff) logic
│   └── index.html
├── server/                     # Express API + scheduling engine
│   ├── data/seedData.js        # representative dataset
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
- npm

### Installation

```bash
git clone https://github.com/suhani-k7/smart-classroom-and-timetable-scheduler.git
cd smart-classroom-and-timetable-scheduler

cd server && npm install
cd ../client && npm install
cd ..
```

### Run (single app)

```bash
npm start
```

This builds the React app and serves everything at **http://localhost:3001**.

| Page | URL |
|---|---|
| Admin dashboard | http://localhost:3001/admin |
| Teacher view | http://localhost:3001/teacher |

### Run in development mode (hot reload)

Use two terminals:

```bash
# Terminal 1 – API server (port 3001)
npm run server

# Terminal 2 – React dev server (port 5173)
npm run client
```

Then open **http://localhost:5173**. API calls are proxied to port 3001.

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
| `POST` | `/api/generate` | Save the submitted dataset and generate + validate a timetable |
| `GET` | `/api/faculty-list` | Faculty IDs, names and expertise |
| `GET` | `/api/faculty/:id` | One faculty member's record |
| `PUT` | `/api/faculty/:id/availability` | Update one faculty member's availability |
| `POST` | `/api/faculty/:id/personal-timetable` | Generate and return one faculty member's sessions |

> State is held **in memory** on the server: edits survive a page refresh but reset when the server restarts.

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
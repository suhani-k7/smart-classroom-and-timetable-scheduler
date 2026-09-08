# Smart Classroom & Timetable Scheduler — Scheduling Engine PoC

A small, standalone **Proof of Concept** for the scheduling engine described in the
project spec. This is deliberately just the algorithmic core — no database, no API,
no UI — so it can be understood, tested, and demoed in isolation for the Second
Defence (10 Sept 2026).

## What this demonstrates

- A small **representative/dummy** academic dataset (6 faculty, 8 courses, 3 sections,
  5 rooms, 5 days × 5 slots) — see `data/seedData.js`
- **CSP formulation**: each required course-section session is a variable; its domain
  is every valid (day, time slot, room, faculty) combination
- **Heuristic search**: backtracking search using an **MRV (Minimum Remaining Values)**
  variable-ordering heuristic
- **Hard constraints H1–H8**: enforced during search AND re-checked afterwards by an
  independent validator (`src/validator.js`)
- **Soft constraints S1–S3**: scored after a feasible timetable is found
  (`src/scorer.js`)
- **Infeasibility handling**: if no valid timetable exists, the system reports that
  clearly instead of returning something invalid (see `test-infeasible.js`)

## How to run

```bash
npm install     # no external dependencies yet, but keeps the workflow standard
npm start       # runs index.js -> generates + validates + scores + prints timetable
node test-infeasible.js   # proves infeasibility is detected and reported
```

## Project structure

```
timetable-poc/
├── data/
│   └── seedData.js       # dummy dataset: faculty, courses, sections, rooms, slots
├── src/
│   ├── utils.js           # builds CSP "variables" from course-section requirements
│   ├── scheduler.js        # THE CORE: CSP + backtracking + MRV heuristic search
│   ├── validator.js        # independent H1-H8 hard-constraint validation pass
│   └── scorer.js           # S1-S3 soft-constraint penalty scoring
├── index.js                 # runs the full pipeline and prints results
├── test-infeasible.js        # proves the "report infeasibility" requirement works
├── package.json
└── README.md
```

## Design notes (for the viva)

- **Feasibility first, quality second.** The scheduler (`scheduler.js`) only cares
  about finding *a* feasible timetable (H1–H8). Soft-constraint scoring (`scorer.js`)
  runs afterwards on that feasible timetable — we do not claim global optimality,
  only that quality is scored and can be improved.
- **Independent validation.** `validator.js` does not trust the scheduler's internal
  bookkeeping — it re-derives all clashes/violations from the final timetable alone.
  This is what justifies the "0 hard-constraint violations" claim in the demo.
- **Why MRV?** Choosing the most-constrained variable first (e.g. the lab session with
  only 2 eligible faculty and 1 valid room) causes the search to fail fast and backtrack
  early when a dataset is genuinely infeasible, instead of wasting time on easy variables.
- **This is a PoC, not the final system.** It has no persistence layer, REST API, or
  UI yet. The next phase wires this same engine (unchanged) behind an Express API
  backed by PostgreSQL, per the agreed architecture.

## Not in scope for this PoC

Per the project's scope decision, this PoC intentionally does **not** include real MAIT
data, ERP integration, authentication, a UI, or deployment. See the project reference
doc for the full list of things explicitly out of scope for the MVP.

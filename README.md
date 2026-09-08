# Smart Classroom & Timetable Scheduler

A configurable, constraint-based academic timetable scheduling system that automatically generates feasible timetables while coordinating **faculty, courses, student sections, classrooms, availability, and scheduling requirements**.

## Features

- Automatic timetable generation
- Constraint Satisfaction Problem (CSP) based scheduling
- Backtracking with **MRV (Minimum Remaining Values)**
- Faculty, room, section, and availability management
- Hard-constraint validation
- Soft-constraint quality scoring
- Infeasibility detection
- Weekly timetable visualization

## Tech Stack

- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Scheduling:** CSP + Backtracking + MRV
- **Version Control:** Git / GitHub

## How It Works

```text
Academic Data
     ↓
Generate Required Sessions
     ↓
Create Candidate Assignments
     ↓
CSP + MRV + Backtracking
     ↓
Feasible Timetable
     ↓
Soft-Constraint Scoring
     ↓
Independent Validation

The scheduler prioritizes feasibility first, ensuring that hard constraints are satisfied before optimizing timetable quality.
```

## Core Constraints

The system handles constraints such as:

- Faculty clashes
- Room clashes
- Section clashes
- Faculty availability
- Room availability
- Room capacity
- Faculty-course eligibility
- Required sessions

## Scope

The project is designed as a configurable academic scheduling system that can eventually support institutional datasets. Complete ERP integration, attendance, notifications, multi-campus optimization, and production-scale deployment are currently outside the core scope.
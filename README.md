Smart Classroom & Timetable Scheduler

A configurable, constraint-based academic timetable scheduling system
that automatically generates feasible and high-quality academic
timetables while coordinating faculty, student sections,
classrooms/labs, course requirements, and resource availability.

Scope: The system is demonstrated using a realistic representative
academic dataset rather than MAIT's complete institutional timetable
or ERP data. The data model is designed so institutional data could be
introduced later.

1. Problem Statement

Academic timetable generation requires multiple resources and rules to
be satisfied simultaneously: faculty, courses, sections, rooms,
capacities, faculty availability, room availability, faculty-course
eligibility, and required weekly sessions. Manual scheduling becomes
difficult as these constraints interact, because changing one assignment
can create conflicts elsewhere.

This project models timetable generation as a Constraint Satisfaction
Problem (CSP) and uses heuristic search to automate feasible
schedule generation.

2. Objectives

Model academic timetable generation as a CSP.

Represent faculty, courses, sections, rooms, availability, mappings,
and time slots as structured data.

Generate timetables satisfying all hard constraints.

Detect and report infeasible instances instead of returning invalid
schedules.

Use heuristic search to reduce unnecessary search and backtracking.

Evaluate feasible schedules using soft constraints.

Provide a clear timetable and validation result through a web
interface.

Keep the system configurable for different academic datasets.

3. Scheduling Model

Variables: Each required course-section session is a variable,
e.g. DBMS-CSE-A-Session-1.

Domain: Each session can be assigned a combination of:

Day × Time Slot × Room × Faculty

Process:

Input Data
   ↓
Generate Course-Section Sessions
   ↓
Candidate Assignments
   ↓
CSP + Backtracking + MRV
   ↓
Feasible Timetable
   ↓
Soft-Constraint Scoring
   ↓
Independent Validation
   ↓
Timetable Output

Feasibility first; quality second. The project does not claim global
optimality unless this is actually demonstrated. The practical goal is
to find a feasible timetable and improve its quality using soft
constraints.

4. Hard Constraints --- H1--H8

Hard constraints must be satisfied.

ID                      Constraint              Rule

H1                      Faculty Clash           A faculty member cannot
teach two classes in
the same slot.

H2                      Room Clash              A room cannot host two
classes simultaneously.

H3                      Section Clash           A student section
cannot have two classes
simultaneously.

H4                      Faculty Availability    Faculty cannot be
assigned outside their
stated availability.

H5                      Room Availability       Rooms cannot be
assigned outside their
stated availability.

H6                      Room Capacity           Assigned room capacity
must be at least the
section size.

H7                      Faculty-Course Mapping  Assigned faculty must
be eligible/suitably
mapped to the course.

5. Soft Constraints --- S1--S3

Soft constraints are preferences used to improve an already feasible
timetable.

ID                      Preference              Goal

S1                      Avoid excessive         Balance faculty
consecutive faculty     schedules.
classes

S2                      Avoid student timetable Prefer compact student
gaps                    schedules.

Soft constraints may be violated when necessary to obtain feasibility.

6. Algorithm

The scheduling engine uses CSP + backtracking + MRV (Minimum Remaining
Values).

MRV selects the most constrained unscheduled variable first. For
example, a session with few eligible faculty members, rooms, or time
slots is considered before a session with many possible assignments.
This helps the search fail earlier on impossible branches and reduces
unnecessary exploration.

The pipeline is:

Load academic data.

Expand course requirements into individual sessions.

Construct candidate domains.

Select the next variable using MRV.

Try candidate assignments.

Check H1--H8.

Backtrack when a branch becomes invalid.

Continue until all sessions are assigned.

Evaluate S1--S3 on a feasible timetable.

Independently validate H1--H8.

Return the timetable and validation/quality results.

If no feasible assignment exists, the system reports infeasibility
instead of returning an invalid timetable.

7. System Architecture

┌──────────────────────────────────────┐
│          React + Tailwind CSS        │
│      Timetable / Configuration UI    │
└──────────────────┬───────────────────┘
                   │ REST API
                   ↓
┌──────────────────────────────────────┐
│        Node.js + Express.js          │
│  API • Validation • Business Logic   │
└───────────────┬───────────────┬──────┘
                │               │
                ↓               ↓
       ┌────────────────┐  ┌─────────────────────┐
       │   PostgreSQL   │  │  Scheduling Engine  │
       │ Persistent Data│  │ CSP + Heuristic     │
       └────────────────┘  │ Search + Scoring     │
                           └──────────┬──────────┘
                                      ↓
                              Independent Validation
                                      ↓
                              Generated Timetable

The scheduling engine remains conceptually separate from the web/API
layer so that it can be tested independently.

8. Technology Stack

Layer             Technology               Purpose

Frontend          React.js                 Interactive web interface
Styling           Tailwind CSS             UI styling
Backend           Node.js                  Server runtime
API               Express.js               REST API/application layer
Database          PostgreSQL               Persistent relational data
Scheduling        CSP + Heuristic Search   Timetable generation
Search            MRV + Backtracking       Variable ordering and search
Version Control   Git / GitHub             Collaboration

9. Data Model

Core entities:

Faculty
Course
Section
Room
FacultyCourseMapping
TimeSlot
Availability
TimetableSession
Constraint / Preference Configuration

A generated TimetableSession contains:

Course + Section + Faculty + Room + Day + Time Slot

PostgreSQL stores the persistent academic/resource data.

10. Representative Dataset

The demonstration uses realistic representative data rather than the
complete MAIT dataset.

A suitable dataset is approximately:

5--8 faculty members

6--10 courses

2--4 sections

4--6 rooms/labs

5 working days

5--8 time slots per day

The data should be sufficiently interconnected to demonstrate actual
constraint interactions.

11. MVP

Data Management

Faculty management

Course management

Section management

Room management

Faculty-course mapping

Faculty availability

Room availability

Working days/time slots

Scheduling

Required sessions per course-section

Automatic timetable generation

CSP-based constraint handling

MRV-guided backtracking

H1--H8 enforcement

S1--S3 evaluation

Infeasibility detection

Validation & Output

Independent validation

Hard-constraint violation count

Soft-constraint score

Weekly timetable display

Clear infeasibility reporting

12. Independent Validation

After generation, the final timetable is independently checked rather
than relying only on the scheduler's internal bookkeeping.

A successful schedule should demonstrate:

H1 Faculty Clash          ✓
H2 Room Clash             ✓
H3 Section Clash          ✓
H4 Faculty Availability   ✓
H5 Room Availability      ✓
H6 Room Capacity          ✓
H7 Faculty Mapping        ✓
H8 Required Sessions      ✓

Hard Constraint Violations: 0

13. Soft-Constraint Scoring

Once a feasible timetable exists, S1--S3 are evaluated. Penalties can
represent undesirable patterns such as excessive consecutive faculty
classes, student timetable gaps, and poor room suitability.

The exact weights should remain configurable rather than being
permanently hardcoded.

14. Infeasibility Handling

The system distinguishes clearly between:

FEASIBLE

and

INFEASIBLE

If constraints make scheduling impossible, the system reports that no
feasible timetable could be generated. It must not silently return a
schedule containing hard-constraint violations.

15. Testing

Important test scenarios include:

Test                                Expected Result

Same faculty, same slot             Faculty clash prevented
Same room, same slot                Room clash prevented
Same section, same slot             Section clash prevented
Faculty unavailable                 Assignment rejected
Room unavailable                    Assignment rejected
Room too small                      Assignment rejected
Faculty not mapped to course        Assignment rejected
Required session count not met      Timetable invalid/incomplete
Impossible constraint combination   Infeasibility reported
Multiple feasible schedules         Soft score distinguishes quality

16. Project Scope

Included

Configurable academic scheduling

Representative academic dataset

Faculty/course/section/room modelling

Availability modelling

Faculty-course eligibility

H1--H8 validation

S1--S3 evaluation

CSP-based scheduling

Heuristic search

PostgreSQL persistence

REST API

React timetable interface

Infeasibility handling

Out of Core Scope

Complete MAIT ERP integration

Complete institutional timetable data

Attendance management

Notifications

Production-scale deployment

Multi-campus optimisation

Advanced analytics

Personalised portals

Guaranteed globally optimal schedules

17. Development Roadmap

Phase 1 --- Constraint & Algorithm Finalisation - Confirm H1--H8
with mentor. - Confirm S1--S3 and weights. - Finalise required-session
representation. - Finalise dataset assumptions.

Phase 2 --- Scheduling Engine - CSP representation. - Candidate
domains. - Hard-constraint checks. - MRV backtracking. - Independent
validator. - Soft-constraint scorer. - Infeasibility tests.

Phase 3 --- Database & Backend - PostgreSQL schema. - Migrations and
seed data. - Express REST APIs. - Connect scheduling engine to
persistent data.

Phase 4 --- Frontend - Configuration interfaces. - Timetable
generation flow. - Weekly timetable view. - Validation and quality
results.

Phase 5 --- Integration & Testing - End-to-end testing. -
Constraint-specific tests. - Infeasibility scenarios. - Final
demonstration dataset.

18. Project Principles

Feasibility First: A hard-constraint violation makes a timetable
invalid.

Configuration Over Hardcoding: Academic data and preferences should
be represented as configurable data wherever practical.

Independent Validation: Generated schedules should be checked
independently.

Explainable Scheduling: The system should make it possible to
understand why assignments are rejected and why a timetable is valid.

Scope Discipline: The core scheduling engine is more important than
peripheral UI features.

19. Final Project Definition

Smart Classroom & Timetable Scheduler is a configurable full-stack
academic scheduling system that uses PostgreSQL-backed academic data
and a Constraint Satisfaction + Heuristic Search engine to generate
feasible timetables while satisfying mandatory faculty, room, section,
availability, capacity, eligibility and session requirements, and then
evaluates feasible schedules using soft constraints for improved
timetable quality.
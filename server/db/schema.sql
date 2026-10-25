-- =========================================================
-- SmartSched database schema
-- =========================================================
DROP TABLE IF EXISTS run_sessions, timetable_runs,
  faculty_unavailability, room_unavailability,
  faculty_course, section_course,
  faculty, courses, sections, rooms, days, slots CASCADE;

-- ---------- Time grid ----------
CREATE TABLE days (
  day       TEXT PRIMARY KEY,           -- 'Mon'
  position  INT  NOT NULL UNIQUE
);

CREATE TABLE slots (
  label     TEXT PRIMARY KEY,           -- '09-10'
  position  INT  NOT NULL UNIQUE,
  is_break  BOOLEAN NOT NULL DEFAULT FALSE   -- lunch = TRUE
);

-- ---------- Core entities ----------
CREATE TABLE faculty (
  id        TEXT PRIMARY KEY,           -- 'F1'
  name      TEXT NOT NULL,
  position  INT  NOT NULL
);

CREATE TABLE courses (
  id                 TEXT PRIMARY KEY,  -- 'DBMS'
  name               TEXT NOT NULL,
  sessions_per_week  INT  NOT NULL CHECK (sessions_per_week BETWEEN 1 AND 10),
  room_type          TEXT NOT NULL CHECK (room_type IN ('classroom','lab')),
  position           INT  NOT NULL
);

CREATE TABLE sections (
  id             TEXT PRIMARY KEY,      -- 'CSE-A'
  student_count  INT  NOT NULL CHECK (student_count > 0),
  position       INT  NOT NULL
);

CREATE TABLE rooms (
  id        TEXT PRIMARY KEY,           -- 'R101'
  type      TEXT NOT NULL CHECK (type IN ('classroom','lab')),
  capacity  INT  NOT NULL CHECK (capacity > 0),
  position  INT  NOT NULL
);

-- ---------- Relationships (many-to-many) ----------
CREATE TABLE faculty_course (           -- who may teach what (H7)
  faculty_id TEXT REFERENCES faculty(id) ON DELETE CASCADE,
  course_id  TEXT REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (faculty_id, course_id)
);

CREATE TABLE section_course (           -- which courses a section takes
  section_id TEXT REFERENCES sections(id) ON DELETE CASCADE,
  course_id  TEXT REFERENCES courses(id)  ON DELETE CASCADE,
  PRIMARY KEY (section_id, course_id)
);

CREATE TABLE faculty_unavailability (   -- H4
  faculty_id TEXT REFERENCES faculty(id) ON DELETE CASCADE,
  day        TEXT REFERENCES days(day),
  slot       TEXT REFERENCES slots(label),
  PRIMARY KEY (faculty_id, day, slot)
);

CREATE TABLE room_unavailability (      -- H5
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  day     TEXT REFERENCES days(day),
  slot    TEXT REFERENCES slots(label),
  PRIMARY KEY (room_id, day, slot)
);

-- ---------- Saved generation runs ----------
CREATE TABLE timetable_runs (
  id                SERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  feasible          BOOLEAN NOT NULL,
  reason            TEXT,                 -- infeasibility reason
  nodes_explored    INT,
  total_violations  INT,
  duration_ms       INT,
  validation        JSONB,                -- full H1–H8 report
  config_snapshot   JSONB NOT NULL        -- the dataset used for this run
);

CREATE TABLE run_sessions (
  run_id      INT  REFERENCES timetable_runs(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  section_id  TEXT NOT NULL,
  course_id   TEXT NOT NULL,
  faculty_id  TEXT NOT NULL,
  room_id     TEXT NOT NULL,
  day         TEXT NOT NULL,
  slot        TEXT NOT NULL,
  PRIMARY KEY (run_id, session_id)
);
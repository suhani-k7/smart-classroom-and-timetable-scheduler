/**
 * server.js
 * ------------------------------------------------------------
 * An Express wrapper around the already-tested scheduling engine.
 * scheduler.js / validator.js / scorer.js are NOT changed at all -
 * this file just exposes them over HTTP, and now also holds a small
 * in-memory "current working dataset" so that a faculty member's
 * availability change actually persists and affects the next
 * timetable generation (rather than just living in one browser tab).
 *
 * NOTE ON PERSISTENCE: this is intentionally an in-memory object, not
 * a database. It resets whenever the server restarts. This is a
 * deliberate scope decision for the prototype (see PoC docs) - Phase 2
 * of the roadmap swaps this object for real PostgreSQL reads/writes
 * without changing any of the routes below.
 * ------------------------------------------------------------
 */

const express = require("express");
const path = require("path");

const seedData = require("./data/seedData");
const { generateTimetable } = require("./src/scheduler");
const { validateTimetable } = require("./src/validator");
// Soft-constraint scoring (S1-S3) is intentionally NOT wired in right now.
// It's fully implemented and tested in src/scorer.js - deferred to future
// scope so the current prototype demo focuses purely on feasibility (H1-H8).
// const { scoreTimetable } = require("./src/scorer");

const app = express();
app.use(express.json());

// ------------------------------------------------------------------
// SERVER-SIDE STATE ("fake database" for the prototype)
// ------------------------------------------------------------------
function freshStateFromSeed() {
  // Deep clone so we never accidentally mutate the original seedData module.
  return {
    DAYS: seedData.DAYS,
    SLOTS: seedData.SLOTS,
    FACULTY: JSON.parse(JSON.stringify(seedData.FACULTY)),
    ROOMS: JSON.parse(JSON.stringify(seedData.ROOMS)),
    COURSES: JSON.parse(JSON.stringify(seedData.COURSES)),
    SECTIONS: JSON.parse(JSON.stringify(seedData.SECTIONS))
  };
}

let serverState = freshStateFromSeed();

function rebuildFacultyCourseMap(courses, faculty) {
  const map = {};
  courses.forEach(c => (map[c.id] = []));
  faculty.forEach(f => {
    f.expertise.forEach(courseId => {
      if (map[courseId]) map[courseId].push(f.id);
    });
  });
  return map;
}

function runEngine(dataset) {
  const data = {
    ...dataset,
    FACULTY_COURSE_MAP: rebuildFacultyCourseMap(dataset.COURSES, dataset.FACULTY)
  };

  const result = generateTimetable(data);
  if (!result.feasible) {
    return { feasible: false, reason: result.reason };
  }

  const validation = validateTimetable(result.timetable, data);

  return {
    feasible: true,
    timetable: result.timetable,
    stats: result.stats,
    validation,
    days: data.DAYS,
    slots: data.SLOTS,
    sections: data.SECTIONS
  };
}

// ------------------------------------------------------------------
// GENERAL / ADMIN ROUTES
// ------------------------------------------------------------------

// Current working dataset (whatever's been edited so far, admin or teacher).
app.get("/api/dataset", (req, res) => {
  res.json(serverState);
});

// Original seed data (never changes) – React uses this as the baseline
app.get("/api/dataset/default", (req, res) => {
  res.json(freshStateFromSeed());
});

// Wipe all edits and go back to the original seed dataset.
app.post("/api/reset", (req, res) => {
  serverState = freshStateFromSeed();
  res.json(serverState);
});

// Admin view: send a full (possibly edited) dataset, save it as the new
// server state, and generate + validate off it immediately.
app.post("/api/generate", (req, res) => {
  try {
    if (req.body && req.body.FACULTY && req.body.COURSES) {
      // Admin submitted a full edited dataset - this becomes the new state.
      serverState = req.body;
    }
    // else: no body (or partial) sent -> just regenerate off current state.
    // This is what the Teacher View uses after saving one faculty's availability.

    res.json(runEngine(serverState));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// TEACHER VIEW ROUTES
// ------------------------------------------------------------------

// Small bits of static config the teacher page needs (days/slots list).
app.get("/api/meta", (req, res) => {
  res.json({ DAYS: serverState.DAYS, SLOTS: serverState.SLOTS });
});

// List of faculty for the "log in as" dropdown - id/name/expertise only.
app.get("/api/faculty-list", (req, res) => {
  res.json(
    serverState.FACULTY.map(f => ({ id: f.id, name: f.name, expertise: f.expertise }))
  );
});

// One faculty member's full record (used to pre-fill their availability grid).
app.get("/api/faculty/:id", (req, res) => {
  const fac = serverState.FACULTY.find(f => f.id === req.params.id);
  if (!fac) return res.status(404).json({ error: "Faculty not found" });
  res.json(fac);
});

// Update ONLY this faculty member's availability. This is the core
// "teacher changes their own availability" action.
app.put("/api/faculty/:id/availability", (req, res) => {
  const fac = serverState.FACULTY.find(f => f.id === req.params.id);
  if (!fac) return res.status(404).json({ error: "Faculty not found" });

  const { unavailable } = req.body;
  if (!Array.isArray(unavailable)) {
    return res.status(400).json({ error: "unavailable must be an array of {day, slot}" });
  }

  fac.unavailable = unavailable;
  res.json(fac);
});

// A faculty member's OWN personal weekly schedule, extracted from a
// full generated timetable (used by the Teacher View results panel).
app.post("/api/faculty/:id/personal-timetable", (req, res) => {
  try {
    const result = runEngine(serverState);
    if (!result.feasible) {
      return res.json(result); // { feasible: false, reason }
    }
    const mySessions = result.timetable.filter(s => s.faculty === req.params.id);
    res.json({ ...result, mySessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// REACT FRONTEND (built files from client/dist)
// ------------------------------------------------------------------
const distPath = path.join(__dirname, "../client/dist");
app.use(express.static(distPath));

// Any non-API URL (e.g. /admin, /teacher) -> send React's index.html,
// and React Router decides which page to show.
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
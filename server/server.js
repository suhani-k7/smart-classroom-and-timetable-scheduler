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
require("dotenv").config();
const repo = require("./db/repository");
const { seedDatabase } = require("./db/seed");

const app = express();
app.use(express.json());

// ------------------------------------------------------------------
// SERVER-SIDE STATE ("fake database" for the prototype)
// ------------------------------------------------------------------

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

// ---------- Helper: run engine, time it, save the run ----------
async function generateAndSave(dataset) {
  const t0 = Date.now();
  const result = runEngine(dataset);
  const duration = Date.now() - t0;
  const { runId, createdAt } = await repo.saveRun(dataset, result, duration);
  return { ...result, runId, createdAt, durationMs: duration };
}

// ---------- GENERAL / ADMIN ----------
app.get("/api/dataset", async (req, res) => {
  try { res.json(await repo.loadDataset()); }
  catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get("/api/dataset/default", (req, res) => {
  // Seed file is still the definition of "default"
  const s = require("./data/seedData");
  res.json(JSON.parse(JSON.stringify({
    DAYS: s.DAYS, SLOTS: s.SLOTS, FACULTY: s.FACULTY,
    ROOMS: s.ROOMS, COURSES: s.COURSES, SECTIONS: s.SECTIONS,
  })));
});

app.post("/api/reset", async (req, res) => {
  try {
    await seedDatabase();
    res.json(await repo.loadDataset());
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post("/api/generate", async (req, res) => {
  try {
    if (req.body && req.body.FACULTY && req.body.COURSES) {
      await repo.saveDataset(req.body);          // persist admin edits
    }
    const dataset = await repo.loadDataset();     // always generate from the DB
    res.json(await generateAndSave(dataset));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ---------- RUN HISTORY ----------
app.get("/api/runs", async (req, res) => {
  try { res.json(await repo.listRuns()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/runs/:id", async (req, res) => {
  try {
    const run = await repo.getRun(Number(req.params.id));
    if (!run) return res.status(404).json({ error: "Run not found" });
    res.json(run);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------- TEACHER ----------
app.get("/api/meta", async (req, res) => {
  const ds = await repo.loadDataset();
  res.json({ DAYS: ds.DAYS, SLOTS: ds.SLOTS });
});

app.get("/api/faculty-list", async (req, res) => {
  const ds = await repo.loadDataset();
  res.json(ds.FACULTY.map(({ id, name, expertise }) => ({ id, name, expertise })));
});

app.get("/api/faculty/:id", async (req, res) => {
  const ds = await repo.loadDataset();
  const fac = ds.FACULTY.find((f) => f.id === req.params.id);
  if (!fac) return res.status(404).json({ error: "Faculty not found" });
  res.json(fac);
});

app.put("/api/faculty/:id/availability", async (req, res) => {
  try {
    const { unavailable } = req.body;
    if (!Array.isArray(unavailable))
      return res.status(400).json({ error: "unavailable must be an array of {day, slot}" });
    const fac = await repo.saveFacultyAvailability(req.params.id, unavailable);
    if (!fac) return res.status(404).json({ error: "Faculty not found" });
    res.json(fac);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post("/api/faculty/:id/personal-timetable", async (req, res) => {
  try {
    const result = runEngine(await repo.loadDataset());
    if (!result.feasible) return res.json(result);
    res.json({ ...result, mySessions: result.timetable.filter((s) => s.faculty === req.params.id) });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
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
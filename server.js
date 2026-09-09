/**
 * server.js
 * ------------------------------------------------------------
 * A THIN Express wrapper around the already-tested scheduling engine.
 * It does NOT change scheduler.js / validator.js / scorer.js at all -
 * it just exposes them over HTTP so a browser UI can call them.
 * ------------------------------------------------------------
 */

const express = require("express");
const path = require("path");

const baseData = require("./data/seedData");
const { generateTimetable } = require("./src/scheduler");
const { validateTimetable } = require("./src/validator");
// Soft-constraint scoring (S1-S3) is intentionally NOT wired in right now.
// It's fully implemented and tested in src/scorer.js - deferred to future
// scope so the current prototype demo focuses purely on feasibility (H1-H8).
// To re-enable: uncomment the import above/below and the two lines marked
// "SOFT SCORING" further down.
// const { scoreTimetable } = require("./src/scorer");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Rebuilds the courseId -> [facultyId,...] map from whatever faculty
// list the browser sends back (so editing "expertise" in the UI works).
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

// GET the default dataset so the frontend has something to show on load.
app.get("/api/dataset", (req, res) => {
  res.json({
    DAYS: baseData.DAYS,
    SLOTS: baseData.SLOTS,
    FACULTY: baseData.FACULTY,
    ROOMS: baseData.ROOMS,
    COURSES: baseData.COURSES,
    SECTIONS: baseData.SECTIONS
  });
});

// POST the (possibly edited) dataset, get back a generated + validated + scored timetable.
app.post("/api/generate", (req, res) => {
  try {
    const { DAYS, SLOTS, FACULTY, ROOMS, COURSES, SECTIONS } = req.body;

    const data = {
      DAYS,
      SLOTS,
      FACULTY,
      ROOMS,
      COURSES,
      SECTIONS,
      FACULTY_COURSE_MAP: rebuildFacultyCourseMap(COURSES, FACULTY)
    };

    const result = generateTimetable(data);

    if (!result.feasible) {
      return res.json({ feasible: false, reason: result.reason });
    }

    const validation = validateTimetable(result.timetable, data);
    // SOFT SCORING (deferred - future scope): const score = scoreTimetable(result.timetable, data);

    res.json({
      feasible: true,
      timetable: result.timetable,
      stats: result.stats,
      validation,
      days: DAYS,
      slots: SLOTS,
      sections: SECTIONS
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
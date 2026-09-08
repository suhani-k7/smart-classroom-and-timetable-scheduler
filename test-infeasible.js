/**
 * test-infeasible.js
 * ------------------------------------------------------------
 * Demonstrates the required behaviour:
 * "If the input dataset is impossible to schedule, the system
 *  should report infeasibility rather than silently producing
 *  an invalid timetable."
 *
 * We deliberately break the dataset (remove ALL eligible faculty
 * for one course) and confirm the engine detects this and reports
 * infeasibility cleanly.
 * ------------------------------------------------------------
 */

const data = require("./data/seedData");
const { generateTimetable } = require("./src/scheduler");

// Deep-ish clone so we don't mutate the real seed data
const broken = JSON.parse(JSON.stringify(data));
broken.FACULTY_COURSE_MAP["AI"] = []; // nobody can teach AI anymore -> impossible

console.log("Running scheduler on a deliberately BROKEN dataset (no faculty eligible for AI)...\n");
const result = generateTimetable(broken);

if (result.feasible) {
  console.log("❌ TEST FAILED: engine should have reported infeasibility but didn't.");
  process.exit(1);
} else {
  console.log("✅ TEST PASSED: engine correctly reported infeasibility.");
  console.log("Reason:", result.reason);
}

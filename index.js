/**
 * index.js
 * ------------------------------------------------------------
 * Runs the full pipeline described in the project spec:
 *   load data -> generate timetable -> validate H1-H8 -> score S1-S3 -> display
 * ------------------------------------------------------------
 */

const data = require("./data/seedData");
const { generateTimetable } = require("./src/scheduler");
const { validateTimetable } = require("./src/validator");
const { scoreTimetable } = require("./src/scorer");

function printSectionTimetable(timetable, sectionId, data) {
  const { DAYS, SLOTS } = data;
  console.log(`\n=== Weekly Timetable: ${sectionId} ===`);

  // header
  const colWidth = 22;
  let header = "Slot".padEnd(10);
  DAYS.forEach(d => (header += d.padEnd(colWidth)));
  console.log(header);

  SLOTS.forEach(slot => {
    let row = slot.padEnd(10);
    DAYS.forEach(day => {
      const session = timetable.find(
        s => s.sectionId === sectionId && s.day === day && s.slot === slot
      );
      const cell = session ? `${session.courseId}/${session.faculty}/${session.room}` : "-";
      row += cell.padEnd(colWidth);
    });
    console.log(row);
  });
}

function main() {
  console.log("Loading dataset: " +
    `${data.FACULTY.length} faculty, ${data.COURSES.length} courses, ` +
    `${data.SECTIONS.length} sections, ${data.ROOMS.length} rooms, ` +
    `${data.DAYS.length} days x ${data.SLOTS.length} slots\n`);

  console.log("Running CSP + heuristic search scheduler...");
  const result = generateTimetable(data);

  if (!result.feasible) {
    console.log("\n❌ INFEASIBLE - no valid timetable could be generated.");
    console.log("Reason:", result.reason);
    process.exit(1);
  }

  console.log(`✅ Feasible timetable found. Search nodes explored: ${result.stats.nodesExplored}`);

  console.log("\nRunning independent H1-H8 validation pass...");
  const validation = validateTimetable(result.timetable, data);

  console.log(`Hard-constraint violations: ${validation.totalViolations}`);
  Object.entries(validation.violations).forEach(([key, arr]) => {
    console.log(`  ${arr.length === 0 ? "✓" : "✗"} ${key}: ${arr.length} violation(s)`);
    arr.forEach(v => console.log(`      - ${v}`));
  });

  console.log("\nCalculating S1-S3 soft-constraint score...");
  const score = scoreTimetable(result.timetable, data);
  console.log(`Total soft-constraint penalty: ${score.totalPenalty} (lower is better)`);
  Object.entries(score.breakdown).forEach(([key, val]) => {
    console.log(`  ${key}: penalty ${val.penalty}`);
    val.details.forEach(d => console.log(`      - ${d}`));
  });

  data.SECTIONS.forEach(section => {
    printSectionTimetable(result.timetable, section.id, data);
  });

  console.log("\n=== SUMMARY ===");
  console.log(`Feasible: ${result.feasible}`);
  console.log(`Hard violations: ${validation.totalViolations}`);
  console.log(`Soft penalty score: ${score.totalPenalty}`);
}

main();

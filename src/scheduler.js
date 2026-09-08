/**
 * scheduler.js
 * ------------------------------------------------------------
 * THE SCHEDULING ENGINE (the core academic part of the project).
 *
 * CSP formulation used here:
 *   VARIABLE  -> one required course-section session
 *                e.g. DBMS-CSE-A-Session-1
 *   DOMAIN    -> every (day, slot, room, faculty) combination that
 *                does not already break H4/H5/H6/H7 in isolation
 *   HARD CONSTRAINTS (H1-H8) -> pruned during search
 *   SEARCH    -> Backtracking search with:
 *                  - MRV (Minimum Remaining Values) variable ordering
 *                  - Forward-checking style consistency test before
 *                    committing to an assignment
 *
 * This file only returns a feasible assignment (or null if none
 * exists). It does NOT do soft-constraint optimisation - that is
 * intentionally left to scorer.js, which scores/improves an
 * already-feasible schedule (S1-S3), matching the project's stated
 * "feasibility first, quality second" philosophy.
 * ------------------------------------------------------------
 */

const { buildSessionVariables, isUnavailable } = require("./utils");

function buildStaticDomain(variable, data) {
  const { DAYS, SLOTS, ROOMS, FACULTY, COURSES, SECTIONS, FACULTY_COURSE_MAP } = data;

  const course = COURSES.find(c => c.id === variable.courseId);
  const section = SECTIONS.find(s => s.id === variable.sectionId);

  // H7: faculty must be eligible for the course
  const eligibleFaculty = FACULTY.filter(f =>
    FACULTY_COURSE_MAP[variable.courseId].includes(f.id)
  );

  // H6 + room type: room must fit capacity and be the right type (lab/classroom)
  const suitableRooms = ROOMS.filter(
    r => r.capacity >= section.studentCount && r.type === course.roomType
  );

  const domain = [];
  DAYS.forEach(day => {
    SLOTS.forEach(slot => {
      suitableRooms.forEach(room => {
        // H5: room availability
        if (isUnavailable(room.unavailable, day, slot)) return;
        eligibleFaculty.forEach(fac => {
          // H4: faculty availability
          if (isUnavailable(fac.unavailable, day, slot)) return;
          domain.push({ day, slot, room: room.id, faculty: fac.id });
        });
      });
    });
  });

  return domain;
}

/**
 * Checks a candidate value against everything ALREADY assigned so far
 * (H1 faculty clash, H2 room clash, H3 section clash).
 */
function isConsistent(variable, value, assignment) {
  for (const otherVarId in assignment) {
    const other = assignment[otherVarId];
    if (other.day !== value.day || other.slot !== value.slot) continue;

    if (other.faculty === value.faculty) return false; // H1
    if (other.room === value.room) return false; // H2
    if (other.sectionId === variable.sectionId) return false; // H3
  }
  return true;
}

/**
 * Recomputes, for a not-yet-assigned variable, how many legal values
 * remain given the CURRENT partial assignment. Used for the MRV heuristic.
 */
function countLegalValues(variable, staticDomains, assignment) {
  const domain = staticDomains[variable.id];
  let count = 0;
  for (const value of domain) {
    if (isConsistent(variable, value, assignment)) count++;
  }
  return count;
}

/**
 * Orders candidate values so that ones which are "friendlier" to soft
 * constraints are tried first (helps get a decent S1-S3 score without
 * running a separate optimisation pass). This does NOT affect feasibility,
 * only the quality of the first feasible solution found.
 */
function orderValues(variable, staticDomain, assignment) {
  return staticDomain
    .filter(v => isConsistent(variable, v, assignment))
    .slice() // copy before sort
    .sort((a, b) => {
      // Prefer slots that keep the section's day more compact (S2 friendly):
      // crude heuristic - prefer earlier slots first.
      return a.slot.localeCompare(b.slot);
    });
}

function backtrack(unassigned, assignment, staticDomains, stats) {
  if (unassigned.length === 0) return assignment;

  stats.nodesExplored++;

  // ---- MRV: pick the variable with the fewest remaining legal values ----
  let bestIdx = 0;
  let bestCount = Infinity;
  for (let i = 0; i < unassigned.length; i++) {
    const c = countLegalValues(unassigned[i], staticDomains, assignment);
    if (c < bestCount) {
      bestCount = c;
      bestIdx = i;
    }
  }

  const variable = unassigned[bestIdx];
  const rest = unassigned.slice(0, bestIdx).concat(unassigned.slice(bestIdx + 1));

  if (bestCount === 0) {
    // Dead end for this variable under the current partial assignment.
    return null;
  }

  const candidates = orderValues(variable, staticDomains[variable.id], assignment);

  for (const value of candidates) {
    assignment[variable.id] = { ...value, sectionId: variable.sectionId, courseId: variable.courseId };
    const result = backtrack(rest, assignment, staticDomains, stats);
    if (result) return result;
    delete assignment[variable.id]; // backtrack
  }

  return null; // no value worked -> failure, triggers backtracking one level up
}

/**
 * Public entry point.
 * Returns { feasible: boolean, timetable: [...] | null, stats }
 */
function generateTimetable(data) {
  const variables = buildSessionVariables(data);

  const staticDomains = {};
  variables.forEach(v => {
    staticDomains[v.id] = buildStaticDomain(v, data);
  });

  // Fail fast & clearly if a variable has literally zero possible values
  // even before search starts (classic "report infeasibility" case).
  const impossible = variables.filter(v => staticDomains[v.id].length === 0);
  if (impossible.length > 0) {
    return {
      feasible: false,
      reason: `No possible (day,slot,room,faculty) combination exists for: ${impossible
        .map(v => v.id)
        .join(", ")}`,
      timetable: null,
      stats: null
    };
  }

  const stats = { nodesExplored: 0 };
  const assignment = backtrack(variables, {}, staticDomains, stats);

  if (!assignment) {
    return {
      feasible: false,
      reason:
        "Search exhausted all possibilities - no feasible timetable exists for this dataset.",
      timetable: null,
      stats
    };
  }

  const timetable = Object.entries(assignment).map(([sessionId, value]) => ({
    sessionId,
    ...value
  }));

  return { feasible: true, reason: null, timetable, stats };
}

module.exports = { generateTimetable };

/**
 * validator.js
 * ------------------------------------------------------------
 * INDEPENDENT VALIDATION PASS.
 *
 * Important design point for your defence: this file does NOT trust
 * the scheduler. It re-checks the final generated timetable from
 * scratch against H1-H8, exactly like a separate examiner would.
 * This is what lets you honestly claim "0 hard-constraint violations"
 * instead of just "the generator didn't complain".
 * ------------------------------------------------------------
 */

function validateTimetable(timetable, data) {
  const { ROOMS, FACULTY, COURSES, SECTIONS, FACULTY_COURSE_MAP } = data;
  const roomById = Object.fromEntries(ROOMS.map(r => [r.id, r]));
  const facultyById = Object.fromEntries(FACULTY.map(f => [f.id, f]));
  const courseById = Object.fromEntries(COURSES.map(c => [c.id, c]));
  const sectionById = Object.fromEntries(SECTIONS.map(s => [s.id, s]));

  const violations = {
    H1_facultyClash: [],
    H2_roomClash: [],
    H3_sectionClash: [],
    H4_facultyAvailability: [],
    H5_roomAvailability: [],
    H6_roomCapacity: [],
    H7_facultyCourseMapping: [],
    H8_requiredSessions: []
  };

  // ---- H1, H2, H3: clash checks (group sessions by day+slot) ----
  const bySlot = {};
  timetable.forEach(s => {
    const key = `${s.day}|${s.slot}`;
    if (!bySlot[key]) bySlot[key] = [];
    bySlot[key].push(s);
  });

  Object.values(bySlot).forEach(group => {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (a.faculty === b.faculty) {
          violations.H1_facultyClash.push(`${a.faculty} double-booked at ${a.day} ${a.slot} (${a.sessionId} vs ${b.sessionId})`);
        }
        if (a.room === b.room) {
          violations.H2_roomClash.push(`${a.room} double-booked at ${a.day} ${a.slot} (${a.sessionId} vs ${b.sessionId})`);
        }
        if (a.sectionId === b.sectionId) {
          violations.H3_sectionClash.push(`${a.sectionId} double-booked at ${a.day} ${a.slot} (${a.sessionId} vs ${b.sessionId})`);
        }
      }
    }
  });

  // ---- H4, H5, H6, H7: per-session checks ----
  timetable.forEach(s => {
    const fac = facultyById[s.faculty];
    const room = roomById[s.room];
    const course = courseById[s.courseId];
    const section = sectionById[s.sectionId];

    if (fac.unavailable.some(u => u.day === s.day && u.slot === s.slot)) {
      violations.H4_facultyAvailability.push(`${fac.id} not available at ${s.day} ${s.slot} (${s.sessionId})`);
    }
    if (room.unavailable.some(u => u.day === s.day && u.slot === s.slot)) {
      violations.H5_roomAvailability.push(`${room.id} not available at ${s.day} ${s.slot} (${s.sessionId})`);
    }
    if (room.capacity < section.studentCount) {
      violations.H6_roomCapacity.push(`${room.id} capacity ${room.capacity} < ${section.id} size ${section.studentCount} (${s.sessionId})`);
    }
    if (!FACULTY_COURSE_MAP[s.courseId].includes(s.faculty)) {
      violations.H7_facultyCourseMapping.push(`${fac.id} not eligible for ${course.id} (${s.sessionId})`);
    }
  });

  // ---- H8: required sessions per course-section ----
  SECTIONS.forEach(section => {
    section.courses.forEach(courseId => {
      const course = courseById[courseId];
      const actual = timetable.filter(
        s => s.sectionId === section.id && s.courseId === courseId
      ).length;
      if (actual !== course.sessionsPerWeek) {
        violations.H8_requiredSessions.push(
          `${courseId} for ${section.id}: expected ${course.sessionsPerWeek}, got ${actual}`
        );
      }
    });
  });

  const totalViolations = Object.values(violations).reduce((sum, arr) => sum + arr.length, 0);

  return { valid: totalViolations === 0, totalViolations, violations };
}

module.exports = { validateTimetable };

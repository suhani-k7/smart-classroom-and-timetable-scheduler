/**
 * utils.js
 * Helper functions shared by the scheduler, validator and scorer.
 */

/**
 * Turns "each course-section needs N sessions/week" into individual
 * CSP variables, e.g. DBMS-CSE-A-Session-1, DBMS-CSE-A-Session-2, ...
 */
function buildSessionVariables(data) {
  const { SECTIONS, COURSES } = data;
  const courseById = Object.fromEntries(COURSES.map(c => [c.id, c]));
  const variables = [];

  SECTIONS.forEach(section => {
    section.courses.forEach(courseId => {
      const course = courseById[courseId];
      for (let i = 1; i <= course.sessionsPerWeek; i++) {
        variables.push({
          id: `${courseId}-${section.id}-S${i}`,
          courseId,
          sectionId: section.id,
          sessionNumber: i
        });
      }
    });
  });

  return variables;
}

function isUnavailable(unavailableList, day, slot) {
  return unavailableList.some(u => u.day === day && u.slot === slot);
}

// Simple 3D schedule tracker: schedule[key][day][slot] = sessionVarId | null
function makeEmptySchedule(ids, days, slots) {
  const schedule = {};
  ids.forEach(id => {
    schedule[id] = {};
    days.forEach(day => {
      schedule[id][day] = {};
      slots.forEach(slot => {
        schedule[id][day][slot] = null;
      });
    });
  });
  return schedule;
}

module.exports = { buildSessionVariables, isUnavailable, makeEmptySchedule };

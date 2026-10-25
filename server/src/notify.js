/**
 * Compares two timetables faculty-by-faculty.
 * Returns { facultyId: { added: [...], removed: [...], moved: [{from, to}] } }
 * only for faculty whose classes changed.
 */
const slim = (s) => ({ courseId: s.courseId, sectionId: s.sectionId, day: s.day, slot: s.slot, room: s.room });
const key = (s) => `${s.courseId}|${s.sectionId}|${s.day}|${s.slot}|${s.room}`;

function diffByFaculty(prevTimetable, nextTimetable) {
  const faculties = new Set([...prevTimetable, ...nextTimetable].map((s) => s.faculty));
  const out = {};

  for (const f of faculties) {
    const prev = prevTimetable.filter((s) => s.faculty === f);
    const next = nextTimetable.filter((s) => s.faculty === f);
    const prevKeys = new Set(prev.map(key));
    const nextKeys = new Set(next.map(key));

    let added = next.filter((s) => !prevKeys.has(key(s)));
    const removed = prev.filter((s) => !nextKeys.has(key(s)));
    const moved = [];

    // Same course + section in both lists = the class was moved, not new
    added = added.filter((a) => {
      const i = removed.findIndex((r) => r.courseId === a.courseId && r.sectionId === a.sectionId);
      if (i >= 0) {
        moved.push({ from: slim(removed[i]), to: slim(a) });
        removed.splice(i, 1);
        return false;
      }
      return true;
    });

    if (added.length || removed.length || moved.length)
      out[f] = { added: added.map(slim), removed: removed.map(slim), moved };
  }
  return out;
}

function summarize(d) {
  const parts = [];
  if (d.added.length) parts.push(`${d.added.length} new class${d.added.length > 1 ? "es" : ""}`);
  if (d.moved.length) parts.push(`${d.moved.length} class${d.moved.length > 1 ? "es" : ""} moved`);
  if (d.removed.length) parts.push(`${d.removed.length} class${d.removed.length > 1 ? "es" : ""} removed`);
  return `Your timetable changed: ${parts.join(", ")}.`;
}

module.exports = { diffByFaculty, summarize };
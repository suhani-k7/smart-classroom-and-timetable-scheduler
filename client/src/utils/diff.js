// Compares the current dataset with the original (baseline) one
// and returns a list of human-readable changes.
const key = (u) => `${u.day} ${u.slot}`;

export function diffDataset(base, cur) {
  const changes = [];
  if (!base || !cur) return changes;

  cur.COURSES.forEach((c, i) => {
    const b = base.COURSES[i];
    if (c.sessionsPerWeek !== b.sessionsPerWeek)
      changes.push({ area: "Course", text: `${c.id}: sessions/week ${b.sessionsPerWeek} → ${c.sessionsPerWeek}`, impact: "H8 required sessions" });
    if (c.roomType !== b.roomType)
      changes.push({ area: "Course", text: `${c.id}: facility ${b.roomType} → ${c.roomType}`, impact: "Room type eligibility" });
  });

  cur.SECTIONS.forEach((s, i) => {
    const b = base.SECTIONS[i];
    if (s.studentCount !== b.studentCount)
      changes.push({ area: "Section", text: `${s.id}: students ${b.studentCount} → ${s.studentCount}`, impact: "H6 room capacity" });
  });

  cur.ROOMS.forEach((r, i) => {
    const b = base.ROOMS[i];
    if (r.type !== b.type)
      changes.push({ area: "Room", text: `${r.id}: type ${b.type} → ${r.type}`, impact: "Room type eligibility" });
    if (r.capacity !== b.capacity)
      changes.push({ area: "Room", text: `${r.id}: capacity ${b.capacity} → ${r.capacity}`, impact: "H6 room capacity" });
  });

  cur.FACULTY.forEach((f, i) => {
    const before = new Set(base.FACULTY[i].unavailable.map(key));
    const after = new Set(f.unavailable.map(key));
    const added = [...after].filter((k) => !before.has(k));
    const removed = [...before].filter((k) => !after.has(k));
    if (added.length)
      changes.push({ area: "Faculty", text: `${f.name}: blocked ${added.join(", ")}`, impact: "H4 faculty availability" });
    if (removed.length)
      changes.push({ area: "Faculty", text: `${f.name}: freed ${removed.join(", ")}`, impact: "H4 faculty availability" });
  });

  return changes;
}
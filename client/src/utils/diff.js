const key = (u) => `${u.day} ${u.slot}`;

export function diffDataset(base, cur) {
  const changes = [];
  if (!base || !cur) return changes;
  const byId = (arr, id) => (arr || []).find((x) => x.id === id);

  (cur.COURSES || []).forEach((c) => {
    const b = byId(base.COURSES, c.id);
    if (!b) return;
    if (Number(c.sessionsPerWeek) !== Number(b.sessionsPerWeek))
      changes.push({
        category: "Academic Courses & Workload", item: `${c.name || c.id} (${c.id})`,
        field: "Sessions / Week", from: b.sessionsPerWeek, to: c.sessionsPerWeek,
        impact: `Required sessions (H8): the solver must place exactly ${c.sessionsPerWeek} weekly session(s) of ${c.id} for every enrolled section.`,
      });
    if (c.roomType !== b.roomType)
      changes.push({
        category: "Academic Courses & Workload", item: `${c.name || c.id} (${c.id})`,
        field: "Required Facility Type", from: b.roomType, to: c.roomType,
        impact: `Room type: sessions of ${c.id} can now only be placed in '${c.roomType}' rooms.`,
      });
  });

  (cur.SECTIONS || []).forEach((s) => {
    const b = byId(base.SECTIONS, s.id);
    if (b && Number(s.studentCount) !== Number(b.studentCount))
      changes.push({
        category: "Student Sections & Cohorts", item: `Section ${s.id}`,
        field: "Student Enrollment", from: b.studentCount, to: s.studentCount,
        impact: `Room capacity (H6): rooms with fewer than ${s.studentCount} seats can no longer be used for ${s.id}.`,
      });
  });

  (cur.ROOMS || []).forEach((r) => {
    const b = byId(base.ROOMS, r.id);
    if (!b) return;
    if (r.type !== b.type)
      changes.push({
        category: "Classrooms & Laboratories", item: `Room ${r.id}`,
        field: "Facility Type", from: b.type, to: r.type,
        impact: `Room type: only courses needing a '${r.type}' can now use ${r.id}.`,
      });
    if (Number(r.capacity) !== Number(b.capacity))
      changes.push({
        category: "Classrooms & Laboratories", item: `Room ${r.id}`,
        field: "Seating Capacity", from: b.capacity, to: r.capacity,
        impact: `Room capacity (H6): sections larger than ${r.capacity} students cannot use ${r.id}.`,
      });
  });

  (cur.FACULTY || []).forEach((f) => {
    const b = byId(base.FACULTY, f.id);
    if (!b) return;
    const before = new Set((b.unavailable || []).map(key));
    const after = new Set((f.unavailable || []).map(key));
    const added = [...after].filter((k) => !before.has(k));
    const removed = [...before].filter((k) => !after.has(k));
    if (added.length || removed.length) {
      const details = [];
      if (added.length) details.push(`Marked UNAVAILABLE: ${added.join(", ")}`);
      if (removed.length) details.push(`Marked AVAILABLE: ${removed.join(", ")}`);
      changes.push({
        category: "Faculty Availability Constraints", item: `${f.id} - ${f.name}`,
        field: "Availability Grid",
        from: `${(b.unavailable || []).length} blocked slot(s)`,
        to: `${(f.unavailable || []).length} blocked slot(s)`,
        details: details.join(" | "),
        impact: `Faculty availability (H4): the solver will never place ${f.name}'s classes in blocked slots, which may shift other sessions too.`,
      });
    }
  });

  return changes;
}
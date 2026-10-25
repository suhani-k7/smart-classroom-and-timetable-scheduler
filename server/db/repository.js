const pool = require("./pool");

// ---------- READ: build the dataset object from the DB ----------
async function loadDataset() {
  const q = (sql) => pool.query(sql).then((r) => r.rows);

  const [days, slots, faculty, fc, fu, courses, sections, sc, rooms, ru] = await Promise.all([
    q("SELECT day FROM days ORDER BY position"),
    q("SELECT label FROM slots ORDER BY position"),
    q("SELECT id, name FROM faculty ORDER BY position"),
    q("SELECT fc.faculty_id, fc.course_id FROM faculty_course fc JOIN courses c ON c.id = fc.course_id ORDER BY c.position"),
    q("SELECT fu.faculty_id, fu.day, fu.slot FROM faculty_unavailability fu JOIN days d ON d.day = fu.day JOIN slots s ON s.label = fu.slot ORDER BY d.position, s.position"),
    q("SELECT id, name, sessions_per_week, room_type FROM courses ORDER BY position"),
    q("SELECT id, student_count FROM sections ORDER BY position"),
    q("SELECT sc.section_id, sc.course_id FROM section_course sc JOIN courses c ON c.id = sc.course_id ORDER BY c.position"),
    q("SELECT id, type, capacity FROM rooms ORDER BY position"),
    q("SELECT room_id, day, slot FROM room_unavailability"),
  ]);

  return {
    DAYS: days.map((d) => d.day),
    SLOTS: slots.map((s) => s.label),
    FACULTY: faculty.map((f) => ({
      id: f.id,
      name: f.name,
      expertise: fc.filter((x) => x.faculty_id === f.id).map((x) => x.course_id),
      unavailable: fu.filter((x) => x.faculty_id === f.id).map(({ day, slot }) => ({ day, slot })),
    })),
    ROOMS: rooms.map((r) => ({
      id: r.id,
      type: r.type,
      capacity: r.capacity,
      unavailable: ru.filter((x) => x.room_id === r.id).map(({ day, slot }) => ({ day, slot })),
    })),
    COURSES: courses.map((c) => ({
      id: c.id, name: c.name, sessionsPerWeek: c.sessions_per_week, roomType: c.room_type,
    })),
    SECTIONS: sections.map((s) => ({
      id: s.id,
      studentCount: s.student_count,
      courses: sc.filter((x) => x.section_id === s.id).map((x) => x.course_id),
    })),
  };
}

// ---------- WRITE: save an edited dataset from the Admin page ----------
async function saveDataset(ds) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    for (const co of ds.COURSES)
      await c.query("UPDATE courses SET sessions_per_week=$2, room_type=$3 WHERE id=$1",
        [co.id, co.sessionsPerWeek, co.roomType]);
    for (const s of ds.SECTIONS)
      await c.query("UPDATE sections SET student_count=$2 WHERE id=$1", [s.id, s.studentCount]);
    for (const r of ds.ROOMS)
      await c.query("UPDATE rooms SET type=$2, capacity=$3 WHERE id=$1", [r.id, r.type, r.capacity]);
    for (const f of ds.FACULTY)
      await replaceFacultyAvailability(c, f.id, f.unavailable);
    await c.query("COMMIT");
  } catch (err) {
    await c.query("ROLLBACK");
    throw err;
  } finally {
    c.release();
  }
}

async function replaceFacultyAvailability(client, facultyId, unavailable) {
  await client.query("DELETE FROM faculty_unavailability WHERE faculty_id=$1", [facultyId]);
  for (const u of unavailable)
    await client.query("INSERT INTO faculty_unavailability VALUES ($1,$2,$3)", [facultyId, u.day, u.slot]);
}

// ---------- Teacher: save one faculty member's availability ----------
async function saveFacultyAvailability(facultyId, unavailable) {
  const c = await pool.connect();
  try {
    const exists = await c.query("SELECT 1 FROM faculty WHERE id=$1", [facultyId]);
    if (exists.rowCount === 0) return null;
    await c.query("BEGIN");
    await replaceFacultyAvailability(c, facultyId, unavailable);
    await c.query("COMMIT");
  } catch (err) {
    await c.query("ROLLBACK");
    throw err;
  } finally {
    c.release();
  }
  const ds = await loadDataset();
  return ds.FACULTY.find((f) => f.id === facultyId);
}

// ---------- Timetable runs ----------
async function saveRun(dataset, result, durationMs) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const { rows } = await c.query(
      `INSERT INTO timetable_runs(feasible, reason, nodes_explored, total_violations, duration_ms, validation, config_snapshot)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
      [result.feasible, result.reason || null, result.stats?.nodesExplored ?? null,
       result.validation?.totalViolations ?? null, durationMs,
       result.validation ? JSON.stringify(result.validation) : null, JSON.stringify(dataset)]);
    const runId = rows[0].id;
    for (const s of result.timetable || [])
      await c.query(
        `INSERT INTO run_sessions VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [runId, s.sessionId, s.sectionId, s.courseId, s.faculty, s.room, s.day, s.slot]);
    await c.query("COMMIT");
    return { runId, createdAt: rows[0].created_at };
  } catch (err) {
    await c.query("ROLLBACK");
    throw err;
  } finally {
    c.release();
  }
}

async function listRuns(limit = 20) {
  const { rows } = await pool.query(
    `SELECT id, created_at, feasible, reason, nodes_explored, total_violations, duration_ms
     FROM timetable_runs ORDER BY id DESC LIMIT $1`, [limit]);
  return rows;
}

async function getRun(id) {
  const run = await pool.query("SELECT * FROM timetable_runs WHERE id=$1", [id]);
  if (run.rowCount === 0) return null;
  const sessions = await pool.query(
    `SELECT session_id AS "sessionId", section_id AS "sectionId", course_id AS "courseId",
            faculty_id AS faculty, room_id AS room, day, slot
     FROM run_sessions WHERE run_id=$1`, [id]);
  return { ...run.rows[0], timetable: sessions.rows };
}

module.exports = {
  loadDataset, saveDataset, saveFacultyAvailability, saveRun, listRuns, getRun,
};
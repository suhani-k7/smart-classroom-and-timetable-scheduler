const pool = require("./pool");
const seedData = require(process.env.SEED === "large" ? "../data/seedDataLarge" : "../data/seedData");

// Inserts the seed dataset. Used by `npm run db:seed` and by POST /api/reset.
async function seedDatabase(client) {
  const c = client || (await pool.connect());
  try {
    await c.query("BEGIN");
    await c.query(`TRUNCATE faculty_unavailability, room_unavailability, faculty_course,
                   section_course, faculty, courses, sections, rooms, days, slots CASCADE`);

    for (const [i, day] of seedData.DAYS.entries())
      await c.query("INSERT INTO days(day, position) VALUES ($1,$2)", [day, i]);

    for (const [i, slot] of seedData.SLOTS.entries())
      await c.query("INSERT INTO slots(label, position, is_break) VALUES ($1,$2,$3)",
        [slot, i, slot === "12-01"]);

    for (const [i, co] of seedData.COURSES.entries())
      await c.query(
        "INSERT INTO courses(id, name, sessions_per_week, room_type, position) VALUES ($1,$2,$3,$4,$5)",
        [co.id, co.name, co.sessionsPerWeek, co.roomType, i]);

    for (const [i, f] of seedData.FACULTY.entries()) {
      await c.query("INSERT INTO faculty(id, name, position) VALUES ($1,$2,$3)", [f.id, f.name, i]);
      for (const courseId of f.expertise)
        await c.query("INSERT INTO faculty_course VALUES ($1,$2)", [f.id, courseId]);
      for (const u of f.unavailable)
        await c.query("INSERT INTO faculty_unavailability VALUES ($1,$2,$3)", [f.id, u.day, u.slot]);
    }

    for (const [i, r] of seedData.ROOMS.entries()) {
      await c.query("INSERT INTO rooms(id, type, capacity, position) VALUES ($1,$2,$3,$4)",
        [r.id, r.type, r.capacity, i]);
      for (const u of r.unavailable)
        await c.query("INSERT INTO room_unavailability VALUES ($1,$2,$3)", [r.id, u.day, u.slot]);
    }

    for (const [i, s] of seedData.SECTIONS.entries()) {
      await c.query("INSERT INTO sections(id, student_count, position) VALUES ($1,$2,$3)",
        [s.id, s.studentCount, i]);
      for (const courseId of s.courses)
        await c.query("INSERT INTO section_course VALUES ($1,$2)", [s.id, courseId]);
    }

    await c.query("COMMIT");
  } catch (err) {
    await c.query("ROLLBACK");
    throw err;
  } finally {
    if (!client) c.release();
  }
}

// Allow running directly: node db/seed.js
if (require.main === module) {
  seedDatabase()
    .then(() => { console.log("✅ Database seeded"); return pool.end(); })
    .catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { seedDatabase };
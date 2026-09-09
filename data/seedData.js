/**
 * seedData.js
 * ------------------------------------------------------------
 * Realistic REPRESENTATIVE / DUMMY academic dataset.
 * This is NOT MAIT's real data - it's a small, made-up dataset
 * designed to be complex enough to force the CSP engine to work
 * (i.e. clashes are possible if the engine isn't correct).
 * ------------------------------------------------------------
 */

// 5 working days
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// 5 time slots per day
const SLOTS = ["09-10", "10-11", "11-12", "12-01", "02-03"];

// ---------------- FACULTY ----------------
// Each faculty has a small "unavailable" list to make H4 meaningful.
const FACULTY = [
  {
    id: "F1",
    name: "Dr. Sharma",
    expertise: ["DBMS", "DBMS_LAB", "OS", "OS_LAB"],
    unavailable: [{ day: "Mon", slot: "09-10" }, { day: "Fri", slot: "02-03" }]
  },
  {
    id: "F2",
    name: "Dr. Verma",
    expertise: ["CN", "AI"],
    unavailable: [{ day: "Wed", slot: "11-12" }]
  },
  {
    id: "F3",
    name: "Dr. Iyer",
    expertise: ["MATHS", "DS"],
    unavailable: [{ day: "Tue", slot: "09-10" }]
  },
  {
    id: "F4",
    name: "Dr. Khan",
    expertise: ["OS", "CN", "OS_LAB"],
    unavailable: [{ day: "Thu", slot: "12-01" }]
  },
  {
    id: "F5",
    name: "Dr. Rao",
    expertise: ["DBMS", "AI", "DBMS_LAB"],
    unavailable: [{ day: "Mon", slot: "02-03" }]
  },
  {
    id: "F6",
    name: "Dr. Singh",
    expertise: ["MATHS", "DS"],
    unavailable: [{ day: "Fri", slot: "09-10" }]
  }
];

// ---------------- ROOMS ----------------
const ROOMS = [
  { id: "R101", type: "classroom", capacity: 70, unavailable: [] },
  { id: "R102", type: "classroom", capacity: 65, unavailable: [] },
  { id: "R103", type: "classroom", capacity: 60, unavailable: [] },
  { id: "LAB1", type: "lab", capacity: 60, unavailable: [] },
  { id: "LAB2", type: "lab", capacity: 55, unavailable: [{ day: "Fri", slot: "02-03" }] }
];

// ---------------- COURSES ----------------
// roomType tells the engine whether this course needs a "lab" room.
const COURSES = [
  { id: "DBMS", name: "Database Management Systems", sessionsPerWeek: 3, roomType: "classroom" },
  { id: "OS", name: "Operating Systems", sessionsPerWeek: 3, roomType: "classroom" },
  { id: "CN", name: "Computer Networks", sessionsPerWeek: 3, roomType: "classroom" },
  { id: "AI", name: "Artificial Intelligence", sessionsPerWeek: 2, roomType: "classroom" },
  { id: "MATHS", name: "Engineering Mathematics", sessionsPerWeek: 3, roomType: "classroom" },
  { id: "DS", name: "Data Structures", sessionsPerWeek: 3, roomType: "classroom" },
  { id: "DBMS_LAB", name: "DBMS Lab", sessionsPerWeek: 1, roomType: "lab" },
  { id: "OS_LAB", name: "OS Lab", sessionsPerWeek: 1, roomType: "lab" }
];

// ---------------- SECTIONS ----------------
// Every section takes the same course list here (kept simple for the PoC;
// this can be made per-section later without changing the engine).
const SECTIONS = [
  { id: "CSE-A", studentCount: 60, courses: COURSES.map(c => c.id) },
  { id: "CSE-B", studentCount: 55, courses: COURSES.map(c => c.id) },
  { id: "CSE-C", studentCount: 58, courses: COURSES.map(c => c.id) }
];

// ---------------- FACULTY-COURSE MAPPING ----------------
// Derived directly from faculty.expertise, but kept as an explicit
// structure because the real schema will have its own mapping table.
function buildFacultyCourseMap() {
  const map = {}; // courseId -> [facultyId,...]
  COURSES.forEach(c => (map[c.id] = []));
  FACULTY.forEach(f => {
    f.expertise.forEach(courseId => {
      if (map[courseId]) map[courseId].push(f.id);
    });
  });
  return map;
}

module.exports = {
  DAYS,
  SLOTS,
  FACULTY,
  ROOMS,
  COURSES,
  SECTIONS,
  FACULTY_COURSE_MAP: buildFacultyCourseMap()
};
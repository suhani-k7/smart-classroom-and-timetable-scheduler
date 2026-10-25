/**
 * seedDataLarge.js
 * ------------------------------------------------------------
 * Scaled academic dataset for SmartSched.
 *
 * Characteristics:
 * - 5 working days (Mon–Fri)
 * - 7 time slots per day (including 12-01 lunch break)
 * - 5 student sections (CSE-A to CSE-E, 55–65 students)
 * - 10 courses (6 theory, 4 labs) totaling 24 sessions/week per section
 * - 10 faculty (F1–F10), each course covered by 2–3 faculty
 * - 11 rooms (8 classrooms R101–R108, 3 labs LAB1–LAB3)
 * ------------------------------------------------------------
 */

// 5 working days
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// 7 time slots per day (12-01 is lunch break)
const SLOTS = ["09-10", "10-11", "11-12", "12-01", "02-03", "03-04", "04-05"];

// ---------------- FACULTY ----------------
// Each faculty has 2–4 blocked slots spread across different days (never 12-01).
const FACULTY = [
  {
    id: "F1",
    name: "Dr. Sharma",
    expertise: ["DBMS", "DBMS_LAB", "OS"],
    unavailable: [
      { day: "Mon", slot: "09-10" },
      { day: "Wed", slot: "02-03" },
      { day: "Fri", slot: "04-05" }
    ]
  },
  {
    id: "F2",
    name: "Dr. Verma",
    expertise: ["CN", "CN_LAB", "AI"],
    unavailable: [
      { day: "Tue", slot: "10-11" },
      { day: "Thu", slot: "03-04" }
    ]
  },
  {
    id: "F3",
    name: "Dr. Iyer",
    expertise: ["MATHS", "DS"],
    unavailable: [
      { day: "Mon", slot: "11-12" },
      { day: "Wed", slot: "04-05" },
      { day: "Fri", slot: "09-10" }
    ]
  },
  {
    id: "F4",
    name: "Dr. Khan",
    expertise: ["OS", "OS_LAB", "CN"],
    unavailable: [
      { day: "Tue", slot: "02-03" },
      { day: "Thu", slot: "10-11" }
    ]
  },
  {
    id: "F5",
    name: "Dr. Rao",
    expertise: ["DBMS", "DBMS_LAB", "AI", "AI_LAB"],
    unavailable: [
      { day: "Mon", slot: "03-04" },
      { day: "Wed", slot: "09-10" },
      { day: "Fri", slot: "02-03" }
    ]
  },
  {
    id: "F6",
    name: "Dr. Singh",
    expertise: ["MATHS", "DS"],
    unavailable: [
      { day: "Tue", slot: "11-12" },
      { day: "Thu", slot: "04-05" }
    ]
  },
  {
    id: "F7",
    name: "Dr. Gupta",
    expertise: ["DBMS", "DS"],
    unavailable: [
      { day: "Mon", slot: "02-03" },
      { day: "Wed", slot: "10-11" },
      { day: "Fri", slot: "11-12" }
    ]
  },
  {
    id: "F8",
    name: "Dr. Patel",
    expertise: ["OS", "OS_LAB"],
    unavailable: [
      { day: "Tue", slot: "09-10" },
      { day: "Thu", slot: "02-03" }
    ]
  },
  {
    id: "F9",
    name: "Dr. Nair",
    expertise: ["CN", "CN_LAB"],
    unavailable: [
      { day: "Mon", slot: "10-11" },
      { day: "Wed", slot: "11-12" },
      { day: "Fri", slot: "03-04" }
    ]
  },
  {
    id: "F10",
    name: "Dr. Chatterjee",
    expertise: ["AI", "AI_LAB"],
    unavailable: [
      { day: "Tue", slot: "04-05" },
      { day: "Thu", slot: "09-10" }
    ]
  }
];

// ---------------- ROOMS ----------------
// 8 classrooms (capacities 60–75) and 3 labs (capacities ≥ 65).
const ROOMS = [
  { id: "R101", type: "classroom", capacity: 75, unavailable: [] },
  { id: "R102", type: "classroom", capacity: 70, unavailable: [] },
  { id: "R103", type: "classroom", capacity: 70, unavailable: [] },
  { id: "R104", type: "classroom", capacity: 68, unavailable: [] },
  { id: "R105", type: "classroom", capacity: 65, unavailable: [] },
  { id: "R106", type: "classroom", capacity: 65, unavailable: [{ day: "Fri", slot: "04-05" }] },
  { id: "R107", type: "classroom", capacity: 65, unavailable: [] },
  { id: "R108", type: "classroom", capacity: 60, unavailable: [] },
  { id: "LAB1", type: "lab", capacity: 70, unavailable: [] },
  { id: "LAB2", type: "lab", capacity: 68, unavailable: [] },
  { id: "LAB3", type: "lab", capacity: 65, unavailable: [{ day: "Mon", slot: "09-10" }] }
];

// ---------------- COURSES ----------------
// 6 theory courses (3–4 sessions/week) + 4 labs (1 session/week).
const COURSES = [
  { id: "DBMS", name: "Database Management Systems", sessionsPerWeek: 4, roomType: "classroom" },
  { id: "OS", name: "Operating Systems", sessionsPerWeek: 4, roomType: "classroom" },
  { id: "CN", name: "Computer Networks", sessionsPerWeek: 3, roomType: "classroom" },
  { id: "AI", name: "Artificial Intelligence", sessionsPerWeek: 3, roomType: "classroom" },
  { id: "MATHS", name: "Engineering Mathematics", sessionsPerWeek: 3, roomType: "classroom" },
  { id: "DS", name: "Data Structures", sessionsPerWeek: 3, roomType: "classroom" },
  { id: "DBMS_LAB", name: "DBMS Lab", sessionsPerWeek: 1, roomType: "lab" },
  { id: "OS_LAB", name: "OS Lab", sessionsPerWeek: 1, roomType: "lab" },
  { id: "CN_LAB", name: "CN Lab", sessionsPerWeek: 1, roomType: "lab" },
  { id: "AI_LAB", name: "AI Lab", sessionsPerWeek: 1, roomType: "lab" }
];

// ---------------- SECTIONS ----------------
// 5 sections (CSE-A to CSE-E) with student counts between 55 and 65.
const SECTIONS = [
  { id: "CSE-A", studentCount: 62, courses: COURSES.map(c => c.id) },
  { id: "CSE-B", studentCount: 58, courses: COURSES.map(c => c.id) },
  { id: "CSE-C", studentCount: 65, courses: COURSES.map(c => c.id) },
  { id: "CSE-D", studentCount: 60, courses: COURSES.map(c => c.id) },
  { id: "CSE-E", studentCount: 55, courses: COURSES.map(c => c.id) }
];

// ---------------- FACULTY-COURSE MAPPING ----------------
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

/*
=== Dataset Statistics ===
- Sessions per section: 24 (Theory: 20 sessions across 6 courses, Labs: 4 sessions across 4 labs)
- Total sessions: 120 (5 sections * 24 sessions/week)
- Average load per faculty: 12.0 sessions/week (120 sessions / 10 faculty)
*/

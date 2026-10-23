/**
 * scorer.js
 * ------------------------------------------------------------
 * SOFT CONSTRAINT SCORING (S1-S3).
 *
 * Runs only on a timetable that has ALREADY passed hard-constraint
 * validation. Lower penalty = better quality. This intentionally does
 * NOT claim global optimality - it is a straightforward, explainable
 * penalty calculation you can defend in the viva.
 * ------------------------------------------------------------
 */

const SLOT_ORDER = ["09-10", "10-11", "11-12", "12-01", "02-03"];

function slotIndex(slot) {
  return SLOT_ORDER.indexOf(slot);
}

/**
 * S1: Avoid too many consecutive faculty classes.
 * Penalty = number of (faculty, day) runs of 3+ back-to-back slots,
 * weighted by how far past 2 the run goes.
 */
function scoreS1(timetable) {
  let penalty = 0;
  const details = [];
  const byFacultyDay = {};

  timetable.forEach(s => {
    const key = `${s.faculty}|${s.day}`;
    if (!byFacultyDay[key]) byFacultyDay[key] = [];
    byFacultyDay[key].push(slotIndex(s.slot));
  });

  Object.entries(byFacultyDay).forEach(([key, slots]) => {
    slots.sort((a, b) => a - b);
    let run = 1;
    for (let i = 1; i < slots.length; i++) {
      if (slots[i] === slots[i - 1] + 1) {
        run++;
      } else {
        if (run > 2) {
          penalty += run - 2;
          details.push(`${key}: run of ${run} consecutive classes`);
        }
        run = 1;
      }
    }
    if (run > 2) {
      penalty += run - 2;
      details.push(`${key}: run of ${run} consecutive classes`);
    }
  });

  return { penalty, details };
}

/**
 * S2: Avoid student (section) timetable gaps.
 * Penalty = number of empty slots between a section's first and last
 * class of the day.
 */
function scoreS2(timetable) {
  let penalty = 0;
  const details = [];
  const bySectionDay = {};

  timetable.forEach(s => {
    const key = `${s.sectionId}|${s.day}`;
    if (!bySectionDay[key]) bySectionDay[key] = [];
    bySectionDay[key].push(slotIndex(s.slot));
  });

  Object.entries(bySectionDay).forEach(([key, slots]) => {
    slots.sort((a, b) => a - b);
    const span = slots[slots.length - 1] - slots[0] + 1;
    const gaps = span - slots.length;
    if (gaps > 0) {
      penalty += gaps;
      details.push(`${key}: ${gaps} free slot(s) between classes`);
    }
  });

  return { penalty, details };
}

/**
 * S3: Prefer appropriate rooms (not just "big enough", but a good fit).
 * Penalty = wasted capacity (room capacity - section size), scaled down.
 * A room that's much bigger than needed is a worse fit.
 */
function scoreS3(timetable, data) {
  const { ROOMS, SECTIONS } = data;
  const roomById = Object.fromEntries(ROOMS.map(r => [r.id, r]));
  const sectionById = Object.fromEntries(SECTIONS.map(s => [s.id, s]));

  let penalty = 0;
  const details = [];

  timetable.forEach(s => {
    const room = roomById[s.room];
    const section = sectionById[s.sectionId];
    const waste = room.capacity - section.studentCount;
    if (waste > 10) {
      const p = Math.floor(waste / 10); // 1 penalty point per 10 wasted seats
      penalty += p;
      details.push(`${s.sessionId}: ${room.id} wastes ${waste} seats for ${section.id}`);
    }
  });

  return { penalty, details };
}

function scoreTimetable(timetable, data) {
  const s1 = scoreS1(timetable);
  const s2 = scoreS2(timetable);
  const s3 = scoreS3(timetable, data);

  return {
    totalPenalty: s1.penalty + s2.penalty + s3.penalty,
    breakdown: {
      S1_consecutiveClasses: s1,
      S2_studentGaps: s2,
      S3_roomFit: s3
    }
  };
}

module.exports = { scoreTimetable };

/**
 * teacher.js
 * ------------------------------------------------------------
 * Prototype Teacher View for previewing a faculty member's schedule,
 * configuring availability constraints (testing hard constraint H4),
 * and observing how the CSP scheduling engine adapts across the system.
 *
 * NOTE: There is no real auth or user isolation in this prototype.
 * Selecting a faculty member loads their public record from the working
 * dataset, and applying availability re-runs the whole-system scheduler.
 * ------------------------------------------------------------
 */

let meta = null;               // { DAYS, SLOTS }
let currentFaculty = null;      // full faculty record for currently selected faculty member
let previousMySessions = null;  // last-seen personal schedule, used for diffing moved sessions
let coursesMap = {};           // courseId -> course object (name, roomType, sessionsPerWeek)

async function init() {
  try {
    // 1) Load the current dataset metadata and courses for rich names/badges
    const datasetRes = await fetch("/api/dataset");
    if (!datasetRes.ok) throw new Error("Failed to load dataset metadata");
    const dataset = await datasetRes.json();

    meta = { DAYS: dataset.DAYS, SLOTS: dataset.SLOTS };
    (dataset.COURSES || []).forEach(c => {
      coursesMap[c.id] = c;
    });

    // 2) Populate the demonstration faculty selector
    const listRes = await fetch("/api/faculty-list");
    if (!listRes.ok) throw new Error("Failed to load faculty list");
    const facultyList = await listRes.json();

    const select = document.getElementById("facultySelect");
    facultyList.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = `${f.id} - ${f.name}`;
      select.appendChild(opt);
    });

    select.addEventListener("change", onFacultyChange);
    document.getElementById("saveAndRegenerateBtn").addEventListener("click", saveAndRegenerate);
  } catch (err) {
    console.error("Initialization error:", err);
  }
}

async function onFacultyChange(e) {
  const facId = e.target.value;
  const resultsSection = document.getElementById("resultsSection");
  const availabilitySection = document.getElementById("availabilitySection");
  const actionFeedback = document.getElementById("actionFeedback");
  if (actionFeedback) actionFeedback.innerHTML = "";

  resultsSection.classList.add("hidden");
  previousMySessions = null;

  if (!facId) {
    availabilitySection.classList.add("hidden");
    currentFaculty = null;
    return;
  }

  try {
    const res = await fetch(`/api/faculty/${facId}`);
    if (!res.ok) throw new Error("Failed to load faculty record");
    currentFaculty = await res.json();

    availabilitySection.classList.remove("hidden");
    document.getElementById("facultyHeading").textContent =
      `${currentFaculty.id} - ${currentFaculty.name}`;

    const expEl = document.getElementById("facultyExpertise");
    if (expEl) {
      expEl.innerHTML = `<span class="text-xs font-semibold text-slate-600 mr-1">Eligible Courses:</span>` +
        currentFaculty.expertise.map(cId => {
          const cName = coursesMap[cId]?.name;
          return `<span class="inline-block text-[11px] bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded border border-slate-200" title="${cName || cId}">${cId}${cName ? ` · ${cName}` : ''}</span>`;
        }).join(" ");
    }

    renderAvailabilityGrid();
    await loadBaselineSchedule(facId);
  } catch (err) {
    console.error("Error loading faculty details:", err);
    if (actionFeedback) {
      actionFeedback.innerHTML = `<span class="text-rose-600 font-medium">Failed to load faculty details: ${err.message}</span>`;
    }
  }
}

function isMarkedUnavailable(day, slot) {
  if (!currentFaculty || !currentFaculty.unavailable) return false;
  return currentFaculty.unavailable.some(u => u.day === day && u.slot === slot);
}

function toggleUnavailable(day, slot, checked) {
  if (!currentFaculty) return;
  const idx = currentFaculty.unavailable.findIndex(u => u.day === day && u.slot === slot);
  if (checked && idx === -1) {
    currentFaculty.unavailable.push({ day, slot });
  } else if (!checked && idx !== -1) {
    currentFaculty.unavailable.splice(idx, 1);
  }
  renderAvailabilityGrid();
}

function renderAvailabilityGrid() {
  const container = document.getElementById("availabilityGrid");
  if (!meta || !meta.DAYS || !meta.SLOTS) return;

  let html = `<table class="text-sm w-full border-collapse min-w-[500px]">
    <thead>
      <tr class="border-b border-slate-200 bg-slate-50 text-slate-700">
        <th class="py-2.5 px-3 text-left font-semibold text-xs w-24">Slot</th>`;
  meta.DAYS.forEach(day => {
    html += `<th class="py-2.5 px-3 text-center font-semibold text-xs">${day}</th>`;
  });
  html += `</tr></thead><tbody class="divide-y divide-slate-100">`;

  meta.SLOTS.forEach(slot => {
    html += `<tr>
      <td class="py-2.5 px-3 font-medium text-xs text-slate-600 whitespace-nowrap bg-slate-50/60 border-r border-slate-100">${slot}</td>`;
    meta.DAYS.forEach(day => {
      const unavailable = isMarkedUnavailable(day, slot);
      const cellBg = unavailable ? "bg-rose-50/70" : "hover:bg-slate-50/80";
      const badgeText = unavailable ? "Unavailable" : "Available";
      const badgeStyle = unavailable
        ? "text-rose-700 bg-rose-100 border border-rose-300 font-semibold"
        : "text-slate-400 bg-slate-50 border border-slate-200";

      html += `<td class="py-2 px-2 text-center transition-colors ${cellBg}">
        <label class="inline-flex flex-col items-center justify-center cursor-pointer p-1 rounded group w-full">
          <input type="checkbox" class="availability-checkbox w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
            ${unavailable ? "checked" : ""}
            aria-label="${day} ${slot}: ${badgeText}"
            onchange="toggleUnavailable('${day}', '${slot}', this.checked)" />
          <span class="text-[10px] mt-1 px-1.5 py-0.5 rounded transition-colors ${badgeStyle}">
            ${badgeText}
          </span>
        </label>
      </td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// Shows the faculty's CURRENT schedule (before any changes are applied)
async function loadBaselineSchedule(facId) {
  try {
    const res = await fetch(`/api/faculty/${facId}/personal-timetable`, { method: "POST" });
    if (!res.ok) throw new Error("Could not load baseline schedule");
    const result = await res.json();
    if (result.feasible) {
      previousMySessions = result.mySessions;
      renderResults(result, false);
    } else {
      renderResults(result, false);
    }
  } catch (err) {
    console.error("Error loading baseline schedule:", err);
  }
}

async function saveAndRegenerate() {
  const btn = document.getElementById("saveAndRegenerateBtn");
  const facultySelect = document.getElementById("facultySelect");
  const feedbackEl = document.getElementById("actionFeedback");

  if (!currentFaculty) return;

  // Prevent accidental repeated submissions while request is in flight
  btn.disabled = true;
  facultySelect.disabled = true;
  document.querySelectorAll(".availability-checkbox").forEach(cb => (cb.disabled = true));

  btn.innerHTML = `
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
    Applying & Regenerating...
  `;
  if (feedbackEl) {
    feedbackEl.innerHTML = `<span class="text-indigo-600 font-medium">Updating availability and running CSP scheduler...</span>`;
  }

  try {
    // 1) Save this faculty member's availability to the server state
    const saveRes = await fetch(`/api/faculty/${currentFaculty.id}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unavailable: currentFaculty.unavailable })
    });
    if (!saveRes.ok) {
      const errData = await saveRes.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to save availability (HTTP ${saveRes.status})`);
    }

    // 2) Regenerate whole timetable off updated server state and pull faculty sessions
    const regenRes = await fetch(`/api/faculty/${currentFaculty.id}/personal-timetable`, {
      method: "POST"
    });
    if (!regenRes.ok) {
      const errData = await regenRes.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to recompute timetable (HTTP ${regenRes.status})`);
    }

    const result = await regenRes.json();
    renderResults(result, true);

    if (!result.feasible) {
      if (feedbackEl) {
        feedbackEl.innerHTML = `<span class="text-rose-600 font-semibold">❌ Infeasible: Unable to satisfy all constraints.</span>`;
      }
    } else {
      const violations = result.validation ? result.validation.totalViolations : 0;
      if (violations === 0) {
        if (feedbackEl) {
          feedbackEl.innerHTML = `<span class="text-emerald-700 font-semibold">✓ Timetable successfully regenerated (0 hard violations).</span>`;
        }
      } else {
        if (feedbackEl) {
          feedbackEl.innerHTML = `<span class="text-amber-700 font-semibold">⚠ Schedule generated with ${violations} violation(s).</span>`;
        }
      }
    }
  } catch (err) {
    console.error("Error applying availability:", err);
    if (feedbackEl) {
      feedbackEl.innerHTML = `<span class="text-rose-600 font-semibold">❌ Request failed: ${err.message}</span>`;
    }
    const summaryEl = document.getElementById("resultsSummary");
    if (summaryEl) {
      summaryEl.innerHTML = `<div class="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm">
        <div class="font-bold">❌ Server / Request Error</div>
        <div class="mt-1">${err.message}</div>
      </div>`;
    }
    document.getElementById("resultsSection").classList.remove("hidden");
  } finally {
    btn.disabled = false;
    facultySelect.disabled = false;
    document.querySelectorAll(".availability-checkbox").forEach(cb => (cb.disabled = false));
    btn.textContent = "Apply Availability & Regenerate Timetable";
  }
}

function renderResults(result, isAfterRegenerate) {
  const section = document.getElementById("resultsSection");
  section.classList.remove("hidden");

  const summaryEl = document.getElementById("resultsSummary");
  const gridEl = document.getElementById("resultsGrid");
  const diffEl = document.getElementById("diffNote");
  const badgeEl = document.getElementById("resultsBadge");
  const subtitleEl = document.getElementById("resultsSubtitle");

  if (subtitleEl && currentFaculty) {
    subtitleEl.textContent = `Weekly teaching schedule for ${currentFaculty.id} - ${currentFaculty.name}`;
  }

  // Case 1: Infeasible result
  if (!result.feasible) {
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="px-2.5 py-1 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">Infeasible</span>`;
    }
    summaryEl.innerHTML = `
      <div class="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-sm">
        <div class="font-bold flex items-center gap-1.5 text-base">
          <span>❌ Schedule Infeasible With Current Constraints</span>
        </div>
        <div class="mt-1 text-slate-700">${result.reason || "The solver could not find any valid assignment that satisfies all hard constraints (H1–H8)."}</div>
        <div class="mt-2 text-xs text-rose-700 bg-rose-100/70 p-2.5 rounded border border-rose-200">
          <b>Resolution advice:</b> Try unchecking one or more unavailable slots above to give the solver more options, then click <b>Apply Availability & Regenerate Timetable</b> again.
        </div>
      </div>`;
    gridEl.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-sm">
        <div class="text-3xl mb-2">📅</div>
        <div class="font-semibold text-slate-600">No Timetable Available</div>
        <div class="text-xs text-slate-400 mt-1">Timetable could not be produced because constraints cannot be satisfied simultaneously.</div>
      </div>`;
    diffEl.innerHTML = "";
    return;
  }

  // Case 2: Feasible result
  const violations = result.validation ? result.validation.totalViolations : 0;
  if (violations === 0) {
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Feasible (0 Violations)</span>`;
    }
    summaryEl.innerHTML = `
      <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-emerald-700 font-bold text-base leading-none">✓</span>
          <span class="font-semibold">Whole-system timetable regenerated — 0 hard-constraint violations (H1–H8 satisfied).</span>
        </div>
        <div class="text-xs text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded font-medium">
          Nodes explored: <b>${result.stats?.nodesExplored ?? 0}</b>
        </div>
      </div>`;
  } else {
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">⚠ ${violations} Violation(s)</span>`;
    }
    summaryEl.innerHTML = `
      <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
        <div class="font-bold">⚠️ Timetable generated with ${violations} hard-constraint violation(s)</div>
        <div class="text-xs text-amber-700 mt-1">Please review the scheduling engine logs or adjust constraints.</div>
      </div>`;
  }

  // Empty state check for personal sessions
  if (!result.mySessions || result.mySessions.length === 0) {
    gridEl.innerHTML = `
      <div class="p-8 text-center text-slate-500 text-sm">
        <div class="text-3xl mb-2">📋</div>
        <div class="font-semibold text-slate-700">No Teaching Sessions Assigned</div>
        <div class="text-xs text-slate-400 mt-1">This faculty member does not have any sessions scheduled in the current timetable.</div>
      </div>`;
    diffEl.innerHTML = "";
    return;
  }

  // Build a lookup of "where did each of my sessions used to be", keyed by sessionId
  const prevBySessionId = {};
  (previousMySessions || []).forEach(s => (prevBySessionId[s.sessionId] = s));

  let moved = 0;

  let html = `<table class="text-xs border-collapse w-full min-w-[620px]">
    <thead>
      <tr class="bg-slate-50 text-slate-700 border-b border-slate-200">
        <th class="border-r border-slate-200 px-3 py-2.5 text-left font-semibold w-24">Slot</th>`;
  meta.DAYS.forEach(day => {
    html += `<th class="border-r border-slate-200 last:border-r-0 px-3 py-2.5 text-center font-semibold">${day}</th>`;
  });
  html += `</tr></thead><tbody class="divide-y divide-slate-200">`;

  meta.SLOTS.forEach(slot => {
    html += `<tr><td class="border-r border-slate-200 px-3 py-2.5 font-medium text-slate-600 bg-slate-50/70 whitespace-nowrap">${slot}</td>`;
    meta.DAYS.forEach(day => {
      const s = result.mySessions.find(t => t.day === day && t.slot === slot);
      const isUnavailable = isMarkedUnavailable(day, slot);

      let cellClass = "border-r border-slate-200 last:border-r-0 p-2 align-top text-center transition-colors";
      let cellContent = "";

      if (s) {
        const prev = prevBySessionId[s.sessionId];
        const wasMoved = isAfterRegenerate && prev && (prev.day !== s.day || prev.slot !== s.slot);
        if (wasMoved) {
          moved++;
          cellClass += " bg-amber-50 ring-2 ring-inset ring-amber-300";
        } else {
          cellClass += " bg-indigo-50/30";
        }

        const courseObj = coursesMap[s.courseId];
        const courseName = courseObj?.name || s.courseId;

        cellContent = `
          <div class="flex flex-col h-full justify-between text-left space-y-1.5 p-1 rounded">
            <div>
              <div class="font-bold text-slate-900 text-xs leading-snug" title="${courseName}">${courseName}</div>
              <div class="flex flex-wrap items-center gap-1 mt-1.5">
                <span class="inline-block font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200" title="Course Code">
                  ${s.courseId}
                </span>
                <span class="inline-block text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200" title="Section">
                  Sec: ${s.sectionId}
                </span>
                <span class="inline-block text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200" title="Room">
                  ${s.room}
                </span>
              </div>
            </div>
            ${wasMoved ? `
              <div class="mt-1 pt-1 border-t border-amber-200">
                <span class="inline-flex items-center text-[10px] font-bold text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded">
                  ⚡ Moved from ${prev.day} ${prev.slot}
                </span>
              </div>` : ''}
          </div>
        `;
      } else if (isUnavailable) {
        cellClass += " bg-rose-50/50";
        cellContent = `
          <div class="py-3 px-1 text-center">
            <span class="inline-block text-[10px] font-medium text-rose-600 bg-rose-100/70 border border-rose-200 px-1.5 py-0.5 rounded">
              ⛔ Unavailable
            </span>
          </div>`;
      } else {
        cellContent = `
          <div class="py-3 text-center text-slate-300 text-xs italic">
            —
          </div>`;
      }

      html += `<td class="${cellClass}">${cellContent}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  gridEl.innerHTML = html;

  // Render Diff Note explaining moves vs unchanged
  if (isAfterRegenerate) {
    if (previousMySessions) {
      if (moved > 0) {
        diffEl.innerHTML = `
          <div class="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
            <span class="text-amber-600 font-bold text-base leading-none mt-0.5">⚡</span>
            <div>
              <div class="font-semibold text-amber-950">Timetable Reorganized</div>
              <div><b>${moved} session(s)</b> for this faculty member were moved to a different day/slot to satisfy updated availability constraints (highlighted with amber badge above). Schedules of other faculty or sections may have adjusted as well.</div>
            </div>
          </div>`;
      } else {
        diffEl.innerHTML = `
          <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
            <span class="text-emerald-600 font-bold text-base leading-none mt-0.5">✓</span>
            <div>
              <div class="font-semibold text-emerald-950">Schedule Unchanged</div>
              <div><b>No sessions needed to move</b> — the existing timetable schedule already respects the updated availability constraints.</div>
            </div>
          </div>`;
      }
    }
  } else {
    diffEl.innerHTML = `
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs flex items-start gap-2">
        <span class="text-slate-400 font-bold">ℹ</span>
        <div><b>Current Baseline Schedule:</b> Displaying the active schedule before any changes. Modify availability checkboxes above and click <b>Apply Availability & Regenerate Timetable</b> to see the engine adapt.</div>
      </div>`;
  }

  // Save the current schedule as baseline for the next diff
  previousMySessions = result.mySessions;
}

init();
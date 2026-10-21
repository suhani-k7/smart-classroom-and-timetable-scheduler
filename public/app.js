/**
 * app.js
 * ------------------------------------------------------------
 * Admin View Frontend Logic for Smart Classroom & Timetable Scheduler.
 *
 * Provides full dataset configuration, real-time change & impact tracking,
 * one-click CSP timetable generation, and independent constraint validation.
 * ------------------------------------------------------------
 */

let dataset = null;          // Working dataset modified by the administrator
let baselineDataset = null;  // Snapshot of dataset from server load / reset
let lastSubmittedDiff = [];  // Configuration changes recorded at time of generation

// ---------------- DATA LOADING & RESET ----------------

async function loadDataset() {
  const statusEl = document.getElementById("actionStatus");
  if (statusEl) {
    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span><span>Loading dataset from server...</span>`;
  }

  try {
    const res = await fetch("/api/dataset");
    if (!res.ok) throw new Error("Failed to load dataset");
    dataset = await res.json();
    baselineDataset = JSON.parse(JSON.stringify(dataset));
    lastSubmittedDiff = [];
    renderAll();
    updateChangeSummary();

    if (statusEl) {
      statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>Ready to schedule. Edit inputs below to test constraint adaptations.</span>`;
    }
  } catch (err) {
    console.error("Error loading dataset:", err);
    if (statusEl) {
      statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span><span class="text-rose-600 font-medium">Failed to load dataset: ${err.message}</span>`;
    }
  }
}

async function resetDataset() {
  const btn = document.getElementById("resetBtn");
  btn.disabled = true;
  btn.textContent = "Resetting...";

  try {
    const res = await fetch("/api/reset", { method: "POST" });
    if (!res.ok) throw new Error("Failed to reset dataset");
    dataset = await res.json();
    baselineDataset = JSON.parse(JSON.stringify(dataset));
    lastSubmittedDiff = [];
    renderAll();
    updateChangeSummary();

    const statusEl = document.getElementById("actionStatus");
    if (statusEl) {
      statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>Reset to default dataset. No pending modifications.</span>`;
    }
  } catch (err) {
    alert("Error resetting dataset: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Reset to Default Data";
  }
}

function revertUnsavedInputs() {
  if (!baselineDataset) return;
  dataset = JSON.parse(JSON.stringify(baselineDataset));
  renderAll();
  updateChangeSummary();

  const statusEl = document.getElementById("actionStatus");
  if (statusEl) {
    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>Reverted unsaved edits to last loaded server state.</span>`;
  }
}

function renderAll() {
  renderCourses();
  renderSections();
  renderRooms();
  renderFacultyGrids();
  document.getElementById("resultsSection").classList.add("hidden");
}

// ---------------- CONFIGURATION IMPACT TRACKING ----------------

/**
 * Compares working dataset against baselineDataset to identify all active
 * modifications and associate each with an accurate constraint impact.
 */
function getConfigurationChanges() {
  if (!baselineDataset || !dataset) return [];
  const changes = [];

  // 1. Courses
  (dataset.COURSES || []).forEach((course, i) => {
    const base = (baselineDataset.COURSES || []).find(c => c.id === course.id) || baselineDataset.COURSES[i];
    if (!base) return;

    const currSessions = Number(course.sessionsPerWeek);
    const baseSessions = Number(base.sessionsPerWeek);

    if (currSessions !== baseSessions) {
      changes.push({
        category: "Academic Courses & Workload",
        item: `${course.name || course.id} (${course.id})`,
        field: "Sessions / Week",
        from: baseSessions,
        to: currSessions,
        impact: `Requested Workload (Hard Constraint H8): Weekly workload modified from ${baseSessions} to ${currSessions} session(s). The solver must assign exactly this number of weekly slots for each enrolled section across the schedule.`
      });
    }

    if (course.roomType !== base.roomType) {
      changes.push({
        category: "Academic Courses & Workload",
        item: `${course.name || course.id} (${course.id})`,
        field: "Required Facility Type",
        from: base.roomType,
        to: course.roomType,
        impact: `Facility Designation (Hard Constraint H5): Facility requirement changed from '${base.roomType}' to '${course.roomType}'. Sessions for this course can now only be placed into rooms matching type '${course.roomType}'.`
      });
    }
  });

  // 2. Sections
  (dataset.SECTIONS || []).forEach((section, i) => {
    const base = (baselineDataset.SECTIONS || []).find(s => s.id === section.id) || baselineDataset.SECTIONS[i];
    if (!base) return;

    const currCount = Number(section.studentCount);
    const baseCount = Number(base.studentCount);

    if (currCount !== baseCount) {
      changes.push({
        category: "Student Sections & Cohorts",
        item: `Section ${section.id}`,
        field: "Student Enrollment",
        from: baseCount,
        to: currCount,
        impact: `Room Capacity Constraint (Hard Constraint H6): Cohort size changed from ${baseCount} to ${currCount} students. The scheduler will disallow assigning any room whose seating capacity is strictly less than ${currCount}.`
      });
    }
  });

  // 3. Rooms
  (dataset.ROOMS || []).forEach((room, i) => {
    const base = (baselineDataset.ROOMS || []).find(r => r.id === room.id) || baselineDataset.ROOMS[i];
    if (!base) return;

    if (room.type !== base.type) {
      changes.push({
        category: "Classrooms & Laboratories",
        item: `Room ${room.id}`,
        field: "Facility Type",
        from: base.type,
        to: room.type,
        impact: `Facility Designation (Hard Constraint H5): Room converted from '${base.type}' to '${room.type}'. Only courses specifying room type '${room.type}' may be assigned to this facility.`
      });
    }

    const currCap = Number(room.capacity);
    const baseCap = Number(base.capacity);

    if (currCap !== baseCap) {
      changes.push({
        category: "Classrooms & Laboratories",
        item: `Room ${room.id}`,
        field: "Seating Capacity",
        from: baseCap,
        to: currCap,
        impact: `Room Capacity Constraint (Hard Constraint H6): Maximum capacity updated from ${baseCap} to ${currCap} seats. Any student cohort exceeding ${currCap} students cannot use this room.`
      });
    }
  });

  // 4. Faculty Availability
  (dataset.FACULTY || []).forEach((fac, i) => {
    const base = (baselineDataset.FACULTY || []).find(f => f.id === fac.id) || baselineDataset.FACULTY[i];
    if (!base) return;

    const baseSlots = new Set((base.unavailable || []).map(u => `${u.day}_${u.slot}`));
    const currSlots = new Set((fac.unavailable || []).map(u => `${u.day}_${u.slot}`));

    const added = [];
    const removed = [];

    currSlots.forEach(s => {
      if (!baseSlots.has(s)) {
        const [day, slot] = s.split("_");
        added.push(`${day} ${slot}`);
      }
    });

    baseSlots.forEach(s => {
      if (!currSlots.has(s)) {
        const [day, slot] = s.split("_");
        removed.push(`${day} ${slot}`);
      }
    });

    if (added.length > 0 || removed.length > 0) {
      const details = [];
      if (added.length > 0) details.push(`Marked UNAVAILABLE: ${added.join(", ")}`);
      if (removed.length > 0) details.push(`Marked AVAILABLE: ${removed.join(", ")}`);

      changes.push({
        category: "Faculty Availability Constraints",
        item: `${fac.id} - ${fac.name}`,
        field: "Availability Grid",
        from: `${base.unavailable?.length || 0} blocked slot(s)`,
        to: `${fac.unavailable?.length || 0} blocked slot(s)`,
        details: details.join(" | "),
        impact: `Faculty Availability (Hard Constraint H4): Constrains where ${fac.name} can teach. The CSP solver strictly avoids placing classes during blocked slots, which may shift sessions to other slots or sections.`
      });
    }
  });

  return changes;
}

function updateChangeSummary() {
  const badgeEl = document.getElementById("changeCountBadge");
  const contentEl = document.getElementById("changeSummaryContent");
  const revertBtn = document.getElementById("discardChangesBtn");
  const changes = getConfigurationChanges();

  if (changes.length === 0) {
    if (badgeEl) {
      badgeEl.textContent = "0 modifications (baseline)";
      badgeEl.className = "text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600";
    }
    if (revertBtn) revertBtn.classList.add("hidden");

    if (contentEl) {
      contentEl.innerHTML = `
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs sm:text-sm flex items-start gap-2.5">
          <span class="text-slate-400 font-bold text-base leading-none mt-0.5">ℹ</span>
          <div>
            <span class="font-semibold text-slate-800">Baseline Dataset Active:</span>
            No configuration inputs have been modified. Generating a timetable will execute against the default seed data. Edit any courses, sections, rooms, or faculty availability below to test constraint adaptations.
          </div>
        </div>`;
    }
    return;
  }

  // Changes exist
  if (badgeEl) {
    badgeEl.textContent = `${changes.length} modification${changes.length > 1 ? "s" : ""} pending`;
    badgeEl.className = "text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200";
  }
  if (revertBtn) revertBtn.classList.remove("hidden");

  // Group by category
  const grouped = {};
  changes.forEach(c => {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  });

  let html = `<div class="space-y-3">`;

  Object.entries(grouped).forEach(([catTitle, items]) => {
    html += `
      <div class="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
        <div class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center justify-between">
          <span>${catTitle}</span>
          <span class="text-[11px] font-normal text-slate-500">${items.length} edit${items.length > 1 ? 's' : ''}</span>
        </div>
        <div class="space-y-2.5">`;

    items.forEach(c => {
      html += `
        <div class="bg-white p-3 rounded-md border border-slate-200 shadow-2xs">
          <div class="flex flex-wrap items-center justify-between gap-1 text-xs">
            <span class="font-bold text-slate-900">${c.item}</span>
            <span class="text-slate-500 font-medium">${c.field}:</span>
            <div class="flex items-center gap-1.5 font-mono text-[11px]">
              <span class="line-through text-slate-400">${c.from}</span>
              <span class="text-slate-400">→</span>
              <span class="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">${c.to}</span>
            </div>
          </div>
          ${c.details ? `<div class="text-[11px] font-mono text-slate-600 mt-1 bg-slate-50 p-1.5 rounded">${c.details}</div>` : ""}
          <div class="mt-2 text-xs text-amber-900 bg-amber-50/90 border border-amber-200 rounded p-2 leading-relaxed">
            <span class="font-semibold text-amber-950">Potential Impact: </span>${c.impact}
          </div>
        </div>`;
    });

    html += `</div></div>`;
  });

  html += `</div>`;
  if (contentEl) contentEl.innerHTML = html;
}

// ---------------- RENDER CONFIGURATION TABLES ----------------

function renderCourses() {
  const tbody = document.getElementById("coursesTable");
  if (!tbody || !dataset.COURSES) return;
  tbody.innerHTML = "";

  dataset.COURSES.forEach((course) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/60 transition-colors";
    tr.innerHTML = `
      <td class="py-2.5 px-3">
        <div class="font-bold text-slate-900 text-xs">${course.name || course.id}</div>
        <div class="font-mono text-[10px] text-slate-500 mt-0.5">${course.id}</div>
      </td>
      <td class="py-2.5 px-3 text-center">
        <input type="number" min="1" max="6" value="${course.sessionsPerWeek}"
          aria-label="${course.id} sessions per week"
          data-course-id="${course.id}" data-field="sessionsPerWeek"
          class="border border-slate-300 rounded px-2 py-1 w-16 text-center text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
      </td>
      <td class="py-2.5 px-3">
        <select data-course-id="${course.id}" data-field="roomType"
          aria-label="${course.id} room type"
          class="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize">
          <option value="classroom" ${course.roomType === "classroom" ? "selected" : ""}>classroom</option>
          <option value="lab" ${course.roomType === "lab" ? "selected" : ""}>lab</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSections() {
  const tbody = document.getElementById("sectionsTable");
  if (!tbody || !dataset.SECTIONS) return;
  tbody.innerHTML = "";

  dataset.SECTIONS.forEach((section) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/60 transition-colors";
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-slate-900 text-xs">${section.id}</td>
      <td class="py-2.5 px-3">
        <div class="flex items-center gap-1.5">
          <input type="number" min="1" max="200" value="${section.studentCount}"
            aria-label="${section.id} student count"
            data-section-id="${section.id}" data-field="studentCount"
            class="border border-slate-300 rounded px-2 py-1 w-20 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          <span class="text-[11px] text-slate-500">students</span>
        </div>
      </td>
      <td class="py-2.5 px-3">
        <span class="text-[11px] text-slate-500">${(section.courses || []).length} courses enrolled</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRooms() {
  const tbody = document.getElementById("roomsTable");
  if (!tbody || !dataset.ROOMS) return;
  tbody.innerHTML = "";

  dataset.ROOMS.forEach((room) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/60 transition-colors";
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-slate-900 text-xs">${room.id}</td>
      <td class="py-2.5 px-3">
        <select data-room-id="${room.id}" data-field="type"
          aria-label="${room.id} facility type"
          class="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize">
          <option value="classroom" ${room.type === "classroom" ? "selected" : ""}>classroom</option>
          <option value="lab" ${room.type === "lab" ? "selected" : ""}>lab</option>
        </select>
      </td>
      <td class="py-2.5 px-3">
        <div class="flex items-center gap-1.5">
          <input type="number" min="1" max="300" value="${room.capacity}"
            aria-label="${room.id} capacity"
            data-room-id="${room.id}" data-field="capacity"
            class="border border-slate-300 rounded px-2 py-1 w-20 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          <span class="text-[11px] text-slate-500">seats</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------- FACULTY AVAILABILITY GRIDS ----------------

function isMarkedUnavailable(faculty, day, slot) {
  return (faculty.unavailable || []).some(u => u.day === day && u.slot === slot);
}

function toggleUnavailable(facIndex, day, slot, checked) {
  const fac = dataset.FACULTY[facIndex];
  if (!fac) return;
  if (!fac.unavailable) fac.unavailable = [];
  const existingIdx = fac.unavailable.findIndex(u => u.day === day && u.slot === slot);

  if (checked && existingIdx === -1) {
    fac.unavailable.push({ day, slot });
  } else if (!checked && existingIdx !== -1) {
    fac.unavailable.splice(existingIdx, 1);
  }

  updateChangeSummary();
}

function renderFacultyGrids() {
  const container = document.getElementById("facultyGrids");
  if (!container || !dataset.FACULTY || !dataset.DAYS || !dataset.SLOTS) return;
  container.innerHTML = "";

  // Build course lookup for titles
  const coursesMap = {};
  (dataset.COURSES || []).forEach(c => (coursesMap[c.id] = c.name));

  dataset.FACULTY.forEach((fac, facIndex) => {
    const wrapper = document.createElement("div");
    wrapper.className = "border border-slate-200 rounded-lg p-4 bg-slate-50/40";

    let html = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <span class="font-bold text-sm text-slate-900">${fac.id} - ${fac.name}</span>
          <div class="mt-1 flex flex-wrap gap-1">
            <span class="text-xs text-slate-500 font-medium mr-1">Eligible courses:</span>
            ${fac.expertise.map(cId => {
              const cName = coursesMap[cId] || cId;
              return `<span class="inline-block text-[10px] bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded border border-slate-200" title="${cName}">${cId}</span>`;
            }).join(" ")}
          </div>
        </div>
        <div class="text-xs text-slate-500 font-medium">
          ${(fac.unavailable || []).length} blocked slot${(fac.unavailable || []).length !== 1 ? 's' : ''}
        </div>
      </div>

      <div class="overflow-x-auto border border-slate-200 rounded-md bg-white">
        <table class="text-xs w-full min-w-[480px]">
          <thead>
            <tr class="bg-slate-50 text-slate-700 border-b border-slate-200">
              <th class="py-2 px-3 text-left font-semibold w-24">Slot</th>`;
    dataset.DAYS.forEach(day => (html += `<th class="py-2 px-3 text-center font-semibold">${day}</th>`));
    html += `</tr></thead><tbody class="divide-y divide-slate-100">`;

    dataset.SLOTS.forEach(slot => {
      html += `<tr><td class="py-2 px-3 font-medium text-slate-600 bg-slate-50/60 whitespace-nowrap">${slot}</td>`;
      dataset.DAYS.forEach(day => {
        const unavailable = isMarkedUnavailable(fac, day, slot);
        const cellBg = unavailable ? "bg-rose-50/80" : "hover:bg-slate-50";
        const badgeText = unavailable ? "Unavailable" : "Available";
        const badgeColor = unavailable
          ? "text-rose-700 bg-rose-100 border border-rose-300 font-semibold"
          : "text-slate-400 bg-slate-50 border border-slate-200";

        html += `<td class="py-1.5 px-2 text-center transition-colors ${cellBg}">
          <label class="inline-flex flex-col items-center justify-center cursor-pointer p-1 rounded group w-full">
            <input type="checkbox"
              class="availability-checkbox w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              data-fac-index="${facIndex}" data-day="${day}" data-slot="${slot}"
              ${unavailable ? "checked" : ""}
              aria-label="${fac.name} ${day} ${slot}: ${badgeText}" />
            <span class="text-[9px] mt-0.5 px-1 rounded transition-colors ${badgeColor}">
              ${badgeText}
            </span>
          </label>
        </td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
  });
}

// ---------------- EVENT DELEGATION HANDLERS ----------------

function handleCourseInput(e) {
  const target = e.target;
  const courseId = target.getAttribute("data-course-id");
  const field = target.getAttribute("data-field");
  if (!courseId || !field || !dataset || !dataset.COURSES) return;

  const course = dataset.COURSES.find(c => c.id === courseId);
  if (!course) return;

  if (field === "sessionsPerWeek") {
    const val = parseInt(target.value, 10);
    course.sessionsPerWeek = isNaN(val) ? 1 : Math.max(1, Math.min(6, val));
  } else if (field === "roomType") {
    course.roomType = target.value;
  }
  updateChangeSummary();
}

function handleSectionInput(e) {
  const target = e.target;
  const sectionId = target.getAttribute("data-section-id");
  const field = target.getAttribute("data-field");
  if (!sectionId || !field || !dataset || !dataset.SECTIONS) return;

  const section = dataset.SECTIONS.find(s => s.id === sectionId);
  if (!section) return;

  if (field === "studentCount") {
    const val = parseInt(target.value, 10);
    section.studentCount = isNaN(val) ? 1 : Math.max(1, Math.min(300, val));
  }
  updateChangeSummary();
}

function handleRoomInput(e) {
  const target = e.target;
  const roomId = target.getAttribute("data-room-id");
  const field = target.getAttribute("data-field");
  if (!roomId || !field || !dataset || !dataset.ROOMS) return;

  const room = dataset.ROOMS.find(r => r.id === roomId);
  if (!room) return;

  if (field === "capacity") {
    const val = parseInt(target.value, 10);
    room.capacity = isNaN(val) ? 1 : Math.max(1, Math.min(500, val));
  } else if (field === "type") {
    room.type = target.value;
  }
  updateChangeSummary();
}

function handleFacultyChange(e) {
  const target = e.target;
  if (!target.classList.contains("availability-checkbox")) return;

  const facIndex = parseInt(target.getAttribute("data-fac-index"), 10);
  const day = target.getAttribute("data-day");
  const slot = target.getAttribute("data-slot");
  if (isNaN(facIndex) || !day || !slot) return;

  toggleUnavailable(facIndex, day, slot, target.checked);

  // Update cell badge and background immediately
  const label = target.closest("label");
  const badge = label ? label.querySelector("span") : null;
  const td = target.closest("td");

  if (target.checked) {
    if (td) td.className = "py-1.5 px-2 text-center transition-colors bg-rose-50/80";
    if (badge) {
      badge.textContent = "Unavailable";
      badge.className = "text-[9px] mt-0.5 px-1 rounded transition-colors text-rose-700 bg-rose-100 border border-rose-300 font-semibold";
    }
  } else {
    if (td) td.className = "py-1.5 px-2 text-center transition-colors hover:bg-slate-50";
    if (badge) {
      badge.textContent = "Available";
      badge.className = "text-[9px] mt-0.5 px-1 rounded transition-colors text-slate-400 bg-slate-50 border border-slate-200";
    }
  }
}

function setupEventListeners() {
  const coursesTable = document.getElementById("coursesTable");
  if (coursesTable) {
    coursesTable.addEventListener("input", handleCourseInput);
    coursesTable.addEventListener("change", handleCourseInput);
  }

  const sectionsTable = document.getElementById("sectionsTable");
  if (sectionsTable) {
    sectionsTable.addEventListener("input", handleSectionInput);
    sectionsTable.addEventListener("change", handleSectionInput);
  }

  const roomsTable = document.getElementById("roomsTable");
  if (roomsTable) {
    roomsTable.addEventListener("input", handleRoomInput);
    roomsTable.addEventListener("change", handleRoomInput);
  }

  const facultyGrids = document.getElementById("facultyGrids");
  if (facultyGrids) {
    facultyGrids.addEventListener("change", handleFacultyChange);
  }

  document.getElementById("generateBtn").addEventListener("click", generateTimetable);
  document.getElementById("resetBtn").addEventListener("click", resetDataset);

  const discardBtn = document.getElementById("discardChangesBtn");
  if (discardBtn) {
    discardBtn.addEventListener("click", revertUnsavedInputs);
  }
}

// ---------------- GENERATE TIMETABLE & RESULTS ----------------

async function generateTimetable() {
  const btn = document.getElementById("generateBtn");
  const resetBtn = document.getElementById("resetBtn");
  const statusEl = document.getElementById("actionStatus");

  btn.disabled = true;
  if (resetBtn) resetBtn.disabled = true;

  btn.innerHTML = `
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
    Generating Timetable...
  `;

  if (statusEl) {
    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span><span>Executing CSP backtracking solver and hard constraint validator...</span>`;
  }

  // Capture diff submitted for this generation
  lastSubmittedDiff = getConfigurationChanges();

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataset)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with HTTP ${res.status}`);
    }

    const result = await res.json();
    renderResults(result);

    if (statusEl) {
      if (result.feasible) {
        statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span class="text-emerald-700 font-medium">Timetable generated successfully (0 hard-constraint violations).</span>`;
      } else {
        statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span><span class="text-rose-700 font-medium">Infeasible schedule: constraints could not be satisfied simultaneously.</span>`;
      }
    }
  } catch (err) {
    console.error("Error calling /api/generate:", err);
    if (statusEl) {
      statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span><span class="text-rose-600 font-medium">Request failed: ${err.message}</span>`;
    }
    alert("Error generating timetable: " + err.message);
  } finally {
    btn.disabled = false;
    if (resetBtn) resetBtn.disabled = false;
    btn.textContent = "Generate Timetable";
  }
}

function renderResults(result) {
  const section = document.getElementById("resultsSection");
  section.classList.remove("hidden");

  const badgeEl = document.getElementById("resultsBadge");
  const summaryEl = document.getElementById("resultsSummary");
  const recapEl = document.getElementById("resultsConfigRecap");
  const validationEl = document.getElementById("resultsValidation");
  const timetablesEl = document.getElementById("resultsTimetables");

  // Build course lookup for course titles
  const coursesMap = {};
  (dataset.COURSES || []).forEach(c => (coursesMap[c.id] = c.name));

  // 1. Submitted Configuration Recap Card
  if (recapEl) {
    if (lastSubmittedDiff.length === 0) {
      recapEl.innerHTML = `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-slate-800">Submitted Configuration:</span>
            <span>Default Baseline Dataset (no modified inputs).</span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">0 custom parameters</span>
        </div>`;
    } else {
      recapEl.innerHTML = `
        <div class="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-950 text-xs">
          <div class="font-semibold flex items-center justify-between">
            <span>Submitted Configuration (${lastSubmittedDiff.length} Custom Parameter${lastSubmittedDiff.length > 1 ? 's' : ''}):</span>
            <span class="font-mono text-[11px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">Custom Run</span>
          </div>
          <ul class="mt-1.5 space-y-1 list-disc list-inside text-indigo-900">
            ${lastSubmittedDiff.map(d => `<li><b>${d.item}</b> (${d.field}): ${d.from} → <b>${d.to}</b></li>`).join("")}
          </ul>
        </div>`;
    }
  }

  // 2. Case: Infeasible
  if (!result.feasible) {
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="px-2.5 py-1 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">Infeasible</span>`;
    }
    summaryEl.innerHTML = `
      <div class="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-sm">
        <div class="font-bold flex items-center gap-1.5 text-base">
          <span>❌ Schedule Infeasible With Submitted Dataset</span>
        </div>
        <div class="mt-1 text-slate-700 leading-relaxed">${result.reason || "The solver could not find any consistent assignment satisfying all constraints."}</div>
        <div class="mt-2.5 text-xs text-rose-700 bg-rose-100/70 p-2.5 rounded border border-rose-200">
          <b>Diagnostic Note:</b> An infeasible result demonstrates that the solver correctly enforces hard constraints (such as faculty availability, room capacity, or session totals) rather than producing an illegal schedule. Try loosening room capacities, adjusting sessions, or clearing faculty unavailable slots.
        </div>
      </div>`;
    validationEl.innerHTML = "";
    timetablesEl.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <div class="text-3xl mb-2">📅</div>
        <div class="font-semibold text-slate-600">No Timetable Generated</div>
        <div class="text-xs text-slate-400 mt-1">Due to infeasibility, no assignments were produced by the scheduling engine.</div>
      </div>`;
    return;
  }

  // 3. Case: Feasible
  const violations = result.validation ? result.validation.totalViolations : 0;
  if (violations === 0) {
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Feasible (0 Violations)</span>`;
    }
    summaryEl.innerHTML = `
      <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-emerald-700 font-bold text-base leading-none">✓</span>
          <span class="font-semibold">Whole-system timetable generated successfully — 0 hard-constraint violations (H1–H8).</span>
        </div>
        <div class="text-xs text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded font-medium">
          Search nodes explored: <b>${result.stats?.nodesExplored ?? 0}</b>
        </div>
      </div>`;
  } else {
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">⚠ ${violations} Violation(s)</span>`;
    }
    summaryEl.innerHTML = `
      <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
        <div class="font-bold">⚠️ Timetable generated with ${violations} hard-constraint violation(s)</div>
        <div class="text-xs text-amber-700 mt-1">Please review the validation pass output below.</div>
      </div>`;
  }

  // 4. Hard Constraint Validation (H1–H8)
  const constraintDescriptions = {
    H1_facultyClash: "Faculty cannot be double-booked across sections in the same slot.",
    H2_roomClash: "Rooms cannot host more than one class at any time slot.",
    H3_sectionClash: "A student section cannot attend two classes simultaneously.",
    H4_facultyAvailability: "Classes cannot be scheduled during a faculty member's unavailable slots.",
    H5_roomAvailability: "Courses requiring labs must be scheduled in lab facilities.",
    H6_roomCapacity: "Room capacity must accommodate student cohort size.",
    H7_facultyCourseMapping: "Faculty may only teach courses matching their registered expertise.",
    H8_requiredSessions: "Each course must meet its exact requested weekly session count."
  };

  let vHtml = `
    <div class="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-bold text-sm text-slate-900">Independent Hard Constraint Validation Pass (H1–H8)</h4>
        <span class="text-xs font-semibold text-slate-500">${result.validation.totalViolations} total violations</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">`;

  Object.entries(result.validation.violations).forEach(([key, arr]) => {
    const passed = arr.length === 0;
    const desc = constraintDescriptions[key] || "Hard constraint satisfaction.";

    vHtml += `
      <div class="p-2.5 rounded-md border ${passed ? 'bg-white border-slate-200' : 'bg-rose-50 border-rose-300'} flex items-start gap-2 text-xs">
        <span class="${passed ? 'text-emerald-600' : 'text-rose-600'} font-bold text-sm leading-none mt-0.5">
          ${passed ? '✓' : '✗'}
        </span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="font-bold text-slate-800 font-mono text-[11px]">${key}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded font-semibold ${passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-200 text-rose-900'}">
              ${passed ? 'Passed' : `${arr.length} Violation(s)`}
            </span>
          </div>
          <div class="text-[11px] text-slate-500 mt-0.5 leading-snug">${desc}</div>
          ${!passed ? `<ul class="mt-1 space-y-0.5 text-rose-700 font-mono text-[10px] list-disc list-inside">${arr.map(v => `<li>${v}</li>`).join("")}</ul>` : ''}
        </div>
      </div>`;
  });

  vHtml += `</div></div>`;
  validationEl.innerHTML = vHtml;

  // 5. Per-Section Timetable Grids
  timetablesEl.innerHTML = "";
  (result.sections || []).forEach(section => {
    const div = document.createElement("div");
    div.className = "border border-slate-200 rounded-lg p-4 bg-white shadow-2xs";

    let html = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h4 class="font-bold text-sm text-slate-900">Weekly Schedule: Section ${section.id}</h4>
          <span class="text-xs text-slate-500">${section.studentCount} students</span>
        </div>
      </div>
      <div class="overflow-x-auto border border-slate-200 rounded-md">
        <table class="text-xs border-collapse w-full min-w-[620px]">
          <thead>
            <tr class="bg-slate-50 text-slate-700 border-b border-slate-200">
              <th class="border-r border-slate-200 px-3 py-2 text-left font-semibold w-24">Slot</th>`;
    result.days.forEach(day => {
      html += `<th class="border-r border-slate-200 last:border-r-0 px-3 py-2 text-center font-semibold">${day}</th>`;
    });
    html += `</tr></thead><tbody class="divide-y divide-slate-200">`;

    result.slots.forEach(slot => {
      html += `<tr><td class="border-r border-slate-200 px-3 py-2.5 font-medium text-slate-600 bg-slate-50/70 whitespace-nowrap">${slot}</td>`;
      result.days.forEach(day => {
        const s = (result.timetable || []).find(
          t => t.sectionId === section.id && t.day === day && t.slot === slot
        );

        let cellContent = "";
        let cellClass = "border-r border-slate-200 last:border-r-0 p-2 align-top text-center transition-colors";

        if (s) {
          cellClass += " bg-indigo-50/30";
          const courseName = coursesMap[s.courseId] || s.courseId;
          cellContent = `
            <div class="flex flex-col h-full justify-between text-left space-y-1.5 p-1 rounded">
              <div>
                <div class="font-bold text-slate-900 text-xs leading-snug" title="${courseName}">${courseName}</div>
                <div class="flex flex-wrap items-center gap-1 mt-1.5">
                  <span class="inline-block font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    ${s.courseId}
                  </span>
                  <span class="inline-block text-[10px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                    ${s.faculty}
                  </span>
                  <span class="inline-block text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                    ${s.room}
                  </span>
                </div>
              </div>
            </div>`;
        } else {
          cellContent = `<div class="py-3 text-center text-slate-300 text-xs italic">—</div>`;
        }

        html += `<td class="${cellClass}">${cellContent}</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    div.innerHTML = html;
    timetablesEl.appendChild(div);
  });
}

// ---------------- INITIALIZATION ----------------

setupEventListeners();
loadDataset();
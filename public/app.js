/**
 * app.js
 * Vanilla JS frontend logic. No build step, no framework -
 * kept deliberately simple so it's easy to read and defend.
 */

let dataset = null; // will hold { DAYS, SLOTS, FACULTY, ROOMS, COURSES, SECTIONS }

async function loadDataset() {
  const res = await fetch("/api/dataset");
  dataset = await res.json();
  renderAll();
}

function renderAll() {
  renderCourses();
  renderSections();
  renderRooms();
  renderFacultyGrids();
  document.getElementById("resultsSection").classList.add("hidden");
}

// ---------------- COURSES ----------------
function renderCourses() {
  const tbody = document.getElementById("coursesTable");
  tbody.innerHTML = "";
  dataset.COURSES.forEach((course, i) => {
    const tr = document.createElement("tr");
    tr.className = "border-b";
    tr.innerHTML = `
      <td class="py-1 font-mono">${course.id}</td>
      <td>
        <input type="number" min="1" max="6" value="${course.sessionsPerWeek}"
          class="border rounded px-2 py-1 w-16"
          onchange="dataset.COURSES[${i}].sessionsPerWeek = parseInt(this.value)" />
      </td>
      <td>
        <select class="border rounded px-2 py-1"
          onchange="dataset.COURSES[${i}].roomType = this.value">
          <option value="classroom" ${course.roomType === "classroom" ? "selected" : ""}>classroom</option>
          <option value="lab" ${course.roomType === "lab" ? "selected" : ""}>lab</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------- SECTIONS ----------------
function renderSections() {
  const tbody = document.getElementById("sectionsTable");
  tbody.innerHTML = "";
  dataset.SECTIONS.forEach((section, i) => {
    const tr = document.createElement("tr");
    tr.className = "border-b";
    tr.innerHTML = `
      <td class="py-1 font-mono">${section.id}</td>
      <td>
        <input type="number" min="1" max="200" value="${section.studentCount}"
          class="border rounded px-2 py-1 w-20"
          onchange="dataset.SECTIONS[${i}].studentCount = parseInt(this.value)" />
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------- ROOMS ----------------
function renderRooms() {
  const tbody = document.getElementById("roomsTable");
  tbody.innerHTML = "";
  dataset.ROOMS.forEach((room, i) => {
    const tr = document.createElement("tr");
    tr.className = "border-b";
    tr.innerHTML = `
      <td class="py-1 font-mono">${room.id}</td>
      <td>
        <select class="border rounded px-2 py-1"
          onchange="dataset.ROOMS[${i}].type = this.value">
          <option value="classroom" ${room.type === "classroom" ? "selected" : ""}>classroom</option>
          <option value="lab" ${room.type === "lab" ? "selected" : ""}>lab</option>
        </select>
      </td>
      <td>
        <input type="number" min="1" max="300" value="${room.capacity}"
          class="border rounded px-2 py-1 w-20"
          onchange="dataset.ROOMS[${i}].capacity = parseInt(this.value)" />
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------- FACULTY AVAILABILITY GRIDS ----------------
function isMarkedUnavailable(faculty, day, slot) {
  return faculty.unavailable.some(u => u.day === day && u.slot === slot);
}

function toggleUnavailable(facIndex, day, slot, checked) {
  const fac = dataset.FACULTY[facIndex];
  const existingIdx = fac.unavailable.findIndex(u => u.day === day && u.slot === slot);
  if (checked && existingIdx === -1) {
    fac.unavailable.push({ day, slot });
  } else if (!checked && existingIdx !== -1) {
    fac.unavailable.splice(existingIdx, 1);
  }
}

function renderFacultyGrids() {
  const container = document.getElementById("facultyGrids");
  container.innerHTML = "";

  dataset.FACULTY.forEach((fac, facIndex) => {
    const wrapper = document.createElement("div");
    wrapper.className = "border rounded p-3";

    let html = `<div class="font-medium mb-2">${fac.id} - ${fac.name} <span class="text-slate-400 text-xs">(teaches: ${fac.expertise.join(", ")})</span></div>`;
    html += `<table class="text-xs"><thead><tr><th class="pr-2"></th>`;
    dataset.DAYS.forEach(day => (html += `<th class="px-2">${day}</th>`));
    html += `</tr></thead><tbody>`;

    dataset.SLOTS.forEach(slot => {
      html += `<tr><td class="pr-2 text-slate-500">${slot}</td>`;
      dataset.DAYS.forEach(day => {
        const checked = isMarkedUnavailable(fac, day, slot) ? "checked" : "";
        html += `<td class="px-2 text-center">
          <input type="checkbox" ${checked}
            onchange="toggleUnavailable(${facIndex}, '${day}', '${slot}', this.checked)" />
        </td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
  });
}

// ---------------- GENERATE ----------------
async function generateTimetable() {
  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.textContent = "Generating...";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataset)
    });
    const result = await res.json();
    renderResults(result);
  } catch (err) {
    alert("Error calling /api/generate: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate Timetable";
  }
}

function renderResults(result) {
  const section = document.getElementById("resultsSection");
  section.classList.remove("hidden");

  const summaryEl = document.getElementById("resultsSummary");
  const validationEl = document.getElementById("resultsValidation");
  const scoreEl = document.getElementById("resultsScore");
  const timetablesEl = document.getElementById("resultsTimetables");

  if (!result.feasible) {
    summaryEl.innerHTML = `<div class="text-red-600 font-semibold">❌ INFEASIBLE</div>
      <div class="text-sm text-slate-600 mt-1">${result.reason}</div>`;
    validationEl.innerHTML = "";
    scoreEl.innerHTML = "";
    timetablesEl.innerHTML = "";
    return;
  }

  summaryEl.innerHTML = `<div class="text-green-600 font-semibold">✅ Feasible timetable generated</div>
    <div class="text-sm text-slate-600">Search nodes explored: ${result.stats.nodesExplored}</div>`;

  // Hard constraint checklist
  let vHtml = `<h3 class="font-medium mb-2">Hard constraint validation (H1-H8)</h3><ul class="text-sm space-y-1">`;
  Object.entries(result.validation.violations).forEach(([key, arr]) => {
    const icon = arr.length === 0 ? "✅" : "❌";
    vHtml += `<li>${icon} <b>${key}</b>: ${arr.length} violation(s)</li>`;
  });
  vHtml += `</ul>`;
  validationEl.innerHTML = vHtml;

  // Soft score
  let sHtml = `<h3 class="font-medium mb-2">Soft constraint score (S1-S3)</h3>
    <div class="text-sm mb-1">Total penalty: <b>${result.score.totalPenalty}</b> (lower is better)</div><ul class="text-sm space-y-1">`;
  Object.entries(result.score.breakdown).forEach(([key, val]) => {
    sHtml += `<li><b>${key}</b>: penalty ${val.penalty}</li>`;
  });
  sHtml += `</ul>`;
  scoreEl.innerHTML = sHtml;

  // Per-section timetable grids
  timetablesEl.innerHTML = "";
  result.sections.forEach(section => {
    const div = document.createElement("div");
    div.className = "mb-6";
    let html = `<h3 class="font-medium mb-2">Timetable: ${section.id}</h3>
      <table class="text-xs border-collapse w-full"><thead><tr>
        <th class="border px-2 py-1 bg-slate-50">Slot</th>`;
    result.days.forEach(day => (html += `<th class="border px-2 py-1 bg-slate-50">${day}</th>`));
    html += `</tr></thead><tbody>`;

    result.slots.forEach(slot => {
      html += `<tr><td class="border px-2 py-1 font-medium">${slot}</td>`;
      result.days.forEach(day => {
        const s = result.timetable.find(
          t => t.sectionId === section.id && t.day === day && t.slot === slot
        );
        html += `<td class="border px-2 py-1">${s ? `${s.courseId}<br><span class="text-slate-400">${s.faculty} / ${s.room}</span>` : "-"}</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    div.innerHTML = html;
    timetablesEl.appendChild(div);
  });
}

// ---------------- INIT ----------------
document.getElementById("generateBtn").addEventListener("click", generateTimetable);
document.getElementById("resetBtn").addEventListener("click", loadDataset);
loadDataset();
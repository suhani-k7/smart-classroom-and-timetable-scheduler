export async function getDataset() {
  const res = await fetch("/api/dataset");
  if (!res.ok) throw new Error("Could not load dataset");
  return res.json();
}

export async function generateTimetable(dataset) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataset),
  });

  if (!res.ok) throw new Error("Generation failed");
  return res.json();
}
export async function getDefaultDataset() {
  const res = await fetch("/api/dataset/default");
  if (!res.ok) throw new Error("Could not load default dataset");
  return res.json();
}

export async function resetDataset() {
  const res = await fetch("/api/reset", { method: "POST" });
  if (!res.ok) throw new Error("Reset failed");
  return res.json();
}
export async function saveAvailability(facultyId, unavailable) {
  const res = await fetch(`/api/faculty/${facultyId}/availability`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unavailable }),
  });
  if (!res.ok) throw new Error("Could not save availability");
  return res.json();
}

export async function getPersonalTimetable(facultyId) {
  const res = await fetch(`/api/faculty/${facultyId}/personal-timetable`, { method: "POST" });
  if (!res.ok) throw new Error("Could not load timetable");
  return res.json();
}
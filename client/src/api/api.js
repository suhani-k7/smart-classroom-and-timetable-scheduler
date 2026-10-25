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

export async function getMyTimetable(facultyId) {
  const res = await fetch(`/api/faculty/${facultyId}/timetable`);
  if (!res.ok) throw new Error("Could not load timetable");
  return res.json();
}

export async function regenerateForFaculty(facultyId) {
  const res = await fetch(`/api/faculty/${facultyId}/regenerate`, { method: "POST" });
  if (!res.ok) throw new Error("Could not regenerate timetable");
  return res.json();
}

export async function getNotifications(facultyId) {
  const res = await fetch(`/api/faculty/${facultyId}/notifications`);
  if (!res.ok) throw new Error("Could not load notifications");
  return res.json();
}

export async function markNotificationsRead(facultyId) {
  await fetch(`/api/faculty/${facultyId}/notifications/read`, { method: "POST" });
}

export const listRuns = () => fetch("/api/runs").then((r) => r.json());
export const getRun = (id) => fetch(`/api/runs/${id}`).then((r) => r.json());
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
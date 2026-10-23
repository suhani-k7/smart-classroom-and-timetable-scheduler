import { useDataset } from "../context/DatasetContext";

export default function AdminPage() {
  const { dataset, error } = useDataset();
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!dataset) return <p className="p-6">Loading...</p>;
  return <h1 className="p-6 text-2xl font-bold">Admin — {dataset.COURSES.length} courses loaded</h1>;
}
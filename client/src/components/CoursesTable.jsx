import { useDataset } from "../context/DatasetContext";

export default function CoursesTable() {
  const { dataset, setDataset } = useDataset();

  const update = (index, field, value) =>
    setDataset((d) => ({
      ...d,
      COURSES: d.COURSES.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-base sm:text-lg text-slate-900">Academic Courses</h2>
        <span className="text-xs text-slate-500">Workload & Room Requirements</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Adjust required weekly sessions per course (H8) or change the required facility type.
      </p>
      <div className="overflow-x-auto border border-slate-100 rounded-lg">
        <table className="w-full text-xs text-left min-w-[420px]">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Course</th>
              <th className="py-2.5 px-3 font-semibold text-center">Sessions / Wk</th>
              <th className="py-2.5 px-3 font-semibold">Facility Needed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataset.COURSES.map((c, i) => (
              <tr key={c.id}>
                <td className="py-2 px-3">
                  <div className="font-semibold text-slate-900">{c.id}</div>
                  <div className="text-slate-500">{c.name}</div>
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="number" min="1" max="6"
                    value={c.sessionsPerWeek}
                    onChange={(e) => update(i, "sessionsPerWeek", parseInt(e.target.value) || 1)}
                    className="w-16 border border-slate-300 rounded px-2 py-1 text-center"
                  />
                </td>
                <td className="py-2 px-3">
                  <select
                    value={c.roomType}
                    onChange={(e) => update(i, "roomType", e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="classroom">classroom</option>
                    <option value="lab">lab</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
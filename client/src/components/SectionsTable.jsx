import { useDataset } from "../context/DatasetContext";

export default function SectionsTable() {
  const { dataset, setDataset } = useDataset();

  const update = (index, value) =>
    setDataset((d) => ({
      ...d,
      SECTIONS: d.SECTIONS.map((s, i) => (i === index ? { ...s, studentCount: value } : s)),
    }));

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-base sm:text-lg text-slate-900">Student Sections</h2>
        <span className="text-xs text-slate-500">Cohort Enrollment</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Altering section size directly restricts eligible rooms via Room Capacity (H6).
      </p>
      <div className="overflow-x-auto border border-slate-100 rounded-lg">
        <table className="w-full text-xs text-left min-w-[320px]">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Section ID</th>
              <th className="py-2.5 px-3 font-semibold">Enrolled Students</th>
              <th className="py-2.5 px-3 font-semibold">Curriculum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataset.SECTIONS.map((s, i) => (
              <tr key={s.id}>
                <td className="py-2 px-3 font-semibold text-slate-900">{s.id}</td>
                <td className="py-2 px-3">
                  <input
                    type="number" min="1" max="200"
                    value={s.studentCount}
                    onChange={(e) => update(i, parseInt(e.target.value) || 1)}
                    className="w-20 border border-slate-300 rounded px-2 py-1"
                  />
                  <span className="text-[11px] text-slate-500 ml-1.5">students</span>
                </td>
                <td className="py-2 px-3 text-slate-500">{s.courses.length} courses</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
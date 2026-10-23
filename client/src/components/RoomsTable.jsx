import { useDataset } from "../context/DatasetContext";

export default function RoomsTable() {
  const { dataset, setDataset } = useDataset();

  const update = (index, field, value) =>
    setDataset((d) => ({
      ...d,
      ROOMS: d.ROOMS.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-base sm:text-lg text-slate-900">Classrooms & Laboratories</h2>
        <span className="text-xs text-slate-500">Facility Capacities</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Define facility types and seating limits (H6) for classrooms and labs.
      </p>
      <div className="overflow-x-auto border border-slate-100 rounded-lg">
        <table className="w-full text-xs text-left min-w-[340px]">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Room ID</th>
              <th className="py-2.5 px-3 font-semibold">Type</th>
              <th className="py-2.5 px-3 font-semibold">Max Capacity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataset.ROOMS.map((r, i) => (
              <tr key={r.id}>
                <td className="py-2 px-3 font-semibold text-slate-900">{r.id}</td>
                <td className="py-2 px-3">
                  <select
                    value={r.type}
                    onChange={(e) => update(i, "type", e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="classroom">classroom</option>
                    <option value="lab">lab</option>
                  </select>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number" min="1" max="500"
                    value={r.capacity}
                    onChange={(e) => update(i, "capacity", parseInt(e.target.value) || 1)}
                    className="w-20 border border-slate-300 rounded px-2 py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
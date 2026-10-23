import { useDataset } from "../context/DatasetContext";

// Checked box = faculty is UNAVAILABLE in that slot (same as the old UI)
export default function AvailabilityGrid({ facultyId }) {
  const { dataset, setDataset } = useDataset();
  const fac = dataset.FACULTY.find((f) => f.id === facultyId);
  if (!fac) return null;

  const isBlocked = (day, slot) =>
    fac.unavailable.some((u) => u.day === day && u.slot === slot);

  const toggle = (day, slot) =>
    setDataset((d) => ({
      ...d,
      FACULTY: d.FACULTY.map((f) => {
        if (f.id !== facultyId) return f;
        const blocked = f.unavailable.some((u) => u.day === day && u.slot === slot);
        return {
          ...f,
          unavailable: blocked
            ? f.unavailable.filter((u) => !(u.day === day && u.slot === slot))
            : [...f.unavailable, { day, slot }],
        };
      }),
    }));

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <span className="font-semibold text-slate-900">{fac.id} — {fac.name}</span>
          <span className="ml-2 text-xs text-slate-500">teaches: {fac.expertise.join(", ")}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
          {fac.unavailable.length} blocked slot{fac.unavailable.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="py-1 pr-3 text-left text-slate-500 font-medium">Slot</th>
              {dataset.DAYS.map((d) => (
                <th key={d} className="py-1 px-3 text-slate-700 font-semibold">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataset.SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="py-1 pr-3 text-slate-600 whitespace-nowrap">{slot}</td>
                {dataset.DAYS.map((day) => {
                  const blocked = isBlocked(day, slot);
                  return (
                    <td key={day} className="py-1 px-3 text-center">
                      <label
                        className={`inline-flex items-center justify-center w-8 h-7 rounded border cursor-pointer ${
                          blocked ? "bg-rose-100 border-rose-300" : "bg-white border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={blocked}
                          onChange={() => toggle(day, slot)}
                          className="accent-rose-600"
                        />
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
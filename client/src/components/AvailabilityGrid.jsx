import { useDataset } from "../context/DatasetContext";

export default function AvailabilityGrid({ facultyId, disabled = false, showHeader = true }) {
  const { dataset, setDataset } = useDataset();
  const fac = dataset.FACULTY.find((f) => f.id === facultyId);
  if (!fac) return null;

  const courseName = (id) => dataset.COURSES.find((c) => c.id === id)?.name || id;
  const isBlocked = (day, slot) => fac.unavailable.some((u) => u.day === day && u.slot === slot);

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
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40">
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="font-bold text-sm text-slate-900">{fac.id} - {fac.name}</span>
            <div className="mt-1 flex flex-wrap gap-1 items-center">
              <span className="text-xs text-slate-500 font-medium mr-1">Eligible courses:</span>
              {fac.expertise.map((cId) => (
                <span key={cId} title={courseName(cId)}
                  className="inline-block text-[10px] bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded border border-slate-200">
                  {cId}
                </span>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {fac.unavailable.length} blocked slot{fac.unavailable.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
        <table className="text-xs w-full min-w-[480px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-semibold w-24">Slot</th>
              {dataset.DAYS.map((d) => <th key={d} className="py-2 px-3 text-center font-semibold">{d}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataset.SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="py-2 px-3 font-medium text-slate-600 bg-slate-50/60 whitespace-nowrap">{slot}</td>
                {dataset.DAYS.map((day) => {
                  const blocked = isBlocked(day, slot);
                  return (
                    <td key={day} className={`py-1.5 px-2 text-center transition-colors ${blocked ? "bg-rose-50/80" : "hover:bg-slate-50"}`}>
                      <label className="inline-flex flex-col items-center justify-center cursor-pointer p-1 rounded w-full">
                        <input
                          type="checkbox"
                          checked={blocked}
                          disabled={disabled}
                          onChange={() => toggle(day, slot)}
                          aria-label={`${fac.name} ${day} ${slot}: ${blocked ? "Unavailable" : "Available"}`}
                          className="w-4 h-4 accent-rose-600 cursor-pointer"
                        />
                        <span className={`text-[9px] mt-0.5 px-1 rounded ${
                          blocked ? "text-rose-700 bg-rose-100 border border-rose-300 font-semibold"
                                  : "text-slate-400 bg-slate-50 border border-slate-200"}`}>
                          {blocked ? "Unavailable" : "Available"}
                        </span>
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
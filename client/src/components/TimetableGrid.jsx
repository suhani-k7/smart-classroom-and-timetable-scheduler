export default function TimetableGrid({ section, timetable, days, slots, courses }) {
  const courseName = (id) => courses.find((c) => c.id === id)?.name || id;
  const cellFor = (day, slot) =>
    timetable.find((s) => s.sectionId === section.id && s.day === day && s.slot === slot);

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="mb-3">
        <h4 className="font-bold text-sm text-slate-900">Weekly Schedule: Section {section.id}</h4>
        {section.studentCount && <span className="text-xs text-slate-500">{section.studentCount} students</span>}
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="text-xs border-collapse w-full min-w-[620px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <th className="border-r border-slate-200 px-3 py-2 text-left font-semibold w-24">Slot</th>
              {days.map((d) => <th key={d} className="border-r border-slate-200 last:border-r-0 px-3 py-2 text-center font-semibold">{d}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {slots.map((slot) => (
              <tr key={slot}>
                <td className="border-r border-slate-200 px-3 py-2.5 font-medium text-slate-600 bg-slate-50/70 whitespace-nowrap">{slot}</td>
                {days.map((day) => {
                  const s = cellFor(day, slot);
                  if (!s && slot === "12-01")
                    return <td key={day} className="border-r border-slate-200 last:border-r-0 p-2 text-center bg-amber-50 text-amber-700 italic">Lunch</td>;
                  return (
                    <td key={day} className={`border-r border-slate-200 last:border-r-0 p-2 align-top ${s ? "bg-indigo-50/30" : ""}`}>
                      {s ? (
                        <div className="text-left p-1">
                          <div className="font-bold text-slate-900 text-xs leading-snug">{courseName(s.courseId)}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">{s.courseId}</span>
                            <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">{s.faculty}</span>
                            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">{s.room}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-3 text-center text-slate-300 italic">—</div>
                      )}
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
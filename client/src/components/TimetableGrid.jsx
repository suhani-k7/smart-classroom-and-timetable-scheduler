export default function TimetableGrid({ sectionId, timetable, days, slots, courses }) {
  const courseName = (id) => courses.find((c) => c.id === id)?.name || id;
  const cellFor = (day, slot) =>
    timetable.find((s) => s.sectionId === sectionId && s.day === day && s.slot === slot);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-900">
        Section {sectionId}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="py-2 px-3 text-left font-semibold">Slot</th>
              {days.map((d) => (
                <th key={d} className="py-2 px-3 text-left font-semibold">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slots.map((slot) => (
              <tr key={slot}>
                <td className="py-2 px-3 font-medium text-slate-600 whitespace-nowrap">{slot}</td>
                {days.map((day) => {
                  const s = cellFor(day, slot);
                  if (slot === "12-01" && !s) {
                    return <td key={day} className="py-2 px-3 bg-amber-50 text-amber-700 italic">Lunch</td>;
                  }
                  return (
                    <td key={day} className="py-2 px-3 align-top">
                      {s ? (
                        <div>
                          <div className="font-semibold text-indigo-700">{s.courseId}</div>
                          <div className="text-slate-600">{courseName(s.courseId)}</div>
                          <div className="text-slate-500">{s.faculty} · {s.room}</div>
                        </div>
                      ) : (
                        <span className="text-slate-300">–</span>
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
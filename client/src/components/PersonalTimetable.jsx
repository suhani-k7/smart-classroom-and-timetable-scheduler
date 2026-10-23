// Shows one faculty member's weekly classes (days × slots)
export default function PersonalTimetable({ sessions, days, slots, courses }) {
  const courseName = (id) => courses.find((c) => c.id === id)?.name || id;
  const cellFor = (day, slot) => sessions.find((s) => s.day === day && s.slot === slot);

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-xs min-w-[600px]">
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
                if (slot === "12-01" && !s)
                  return <td key={day} className="py-2 px-3 bg-amber-50 text-amber-700 italic">Lunch</td>;
                return (
                  <td key={day} className="py-2 px-3 align-top">
                    {s ? (
                      <div>
                        <div className="font-semibold text-indigo-700">{s.courseId}</div>
                        <div className="text-slate-600">{courseName(s.courseId)}</div>
                        <div className="text-slate-500">{s.sectionId} · {s.room}</div>
                      </div>
                    ) : (
                      <span className="text-slate-300">Free</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
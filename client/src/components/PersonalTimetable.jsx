export default function PersonalTimetable({ sessions, previous, highlightMoves, days, slots, courses, isUnavailable, newKeys = new Set() }) {
  const courseName = (id) => courses.find((c) => c.id === id)?.name || id;
  const prevById = Object.fromEntries((previous || []).map((s) => [s.sessionId, s]));

  return (
    <table className="text-xs border-collapse w-full min-w-[620px]">
      <thead>
        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
          <th className="border-r border-slate-200 px-3 py-2.5 text-left font-semibold w-24">Slot</th>
          {days.map((d) => <th key={d} className="border-r border-slate-200 last:border-r-0 px-3 py-2.5 text-center font-semibold">{d}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {slots.map((slot) => (
          <tr key={slot}>
            <td className="border-r border-slate-200 px-3 py-2.5 font-medium text-slate-600 bg-slate-50/70 whitespace-nowrap">{slot}</td>
            {days.map((day) => {
              const s = sessions.find((t) => t.day === day && t.slot === slot);
              const base = "border-r border-slate-200 last:border-r-0 p-2 align-top text-center";
              if (s) {
                const prev = prevById[s.sessionId];
                const moved = highlightMoves && prev && (prev.day !== s.day || prev.slot !== s.slot);
                return (
                  <td key={day} className={`${base} ${moved ? "bg-amber-50 ring-2 ring-inset ring-amber-300" : "bg-indigo-50/30"}`}>
                    <div className="text-left p-1 space-y-1.5">
                      <div className="font-bold text-slate-900 text-xs leading-snug">{courseName(s.courseId)}</div>
                      <div className="flex flex-wrap gap-1">
                        <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">{s.courseId}</span>
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">Sec: {s.sectionId}</span>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">{s.room}</span>
                      </div>
                      {moved && (
                        <div className="pt-1 border-t border-amber-200">
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded">
                            ⚡ Moved from {prev.day} {prev.slot}
                          </span>
                        </div>
                      )}
                      {newKeys.has(`${s.courseId}|${s.sectionId}|${s.day}|${s.slot}`) && (
                        <div className="pt-1 border-t border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-900 bg-emerald-200 px-1.5 py-0.5 rounded">🆕 New class</span>
                        </div>
                      )}
                    </div>
                  </td>
                );
              }
              if (isUnavailable(day, slot))
                return (
                  <td key={day} className={`${base} bg-rose-50/50`}>
                    <span className="inline-block my-2 text-[10px] font-medium text-rose-600 bg-rose-100/70 border border-rose-200 px-1.5 py-0.5 rounded">Unavailable</span>
                  </td>
                );
              if (slot === "12-01")
                return <td key={day} className={`${base} bg-amber-50 text-amber-700 italic`}>Lunch</td>;
              return <td key={day} className={base}><div className="py-3 text-slate-300 italic">—</div></td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
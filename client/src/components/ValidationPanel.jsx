const DESCRIPTIONS = {
  H1_facultyClash: "Faculty cannot be double-booked across sections in the same slot.",
  H2_roomClash: "Rooms cannot host more than one class at any time slot.",
  H3_sectionClash: "A student section cannot attend two classes simultaneously.",
  H4_facultyAvailability: "Classes cannot be scheduled during a faculty member's unavailable slots.",
  H5_roomAvailability: "Classes cannot be scheduled in a room during its unavailable slots.",
  H6_roomCapacity: "Room capacity must accommodate the student cohort size.",
  H7_facultyCourseMapping: "Faculty may only teach courses matching their registered expertise.",
  H8_requiredSessions: "Each course must meet its exact required weekly session count.",
};

export default function ValidationPanel({ validation }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-sm text-slate-900">Independent Hard Constraint Validation Pass (H1–H8)</h4>
        <span className="text-xs font-semibold text-slate-500">{validation.totalViolations} total violations</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {Object.entries(validation.violations).map(([key, arr]) => {
          const passed = arr.length === 0;
          return (
            <div key={key} className={`p-2.5 rounded-md border flex items-start gap-2 text-xs ${passed ? "bg-white border-slate-200" : "bg-rose-50 border-rose-300"}`}>
              <span className={`font-bold text-sm leading-none mt-0.5 ${passed ? "text-emerald-600" : "text-rose-600"}`}>{passed ? "✓" : "✗"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-800 font-mono text-[11px]">{key}</span>
                  <span className={`text-[10px] px-1.5 rounded font-semibold ${passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-200 text-rose-900"}`}>
                    {passed ? "Passed" : `${arr.length} Violation(s)`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{DESCRIPTIONS[key] || "Hard constraint."}</div>
                {!passed && (
                  <ul className="mt-1 space-y-0.5 text-rose-700 font-mono text-[10px] list-disc list-inside">
                    {arr.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
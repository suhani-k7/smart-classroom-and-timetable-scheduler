const LABELS = {
  H1_facultyClash: "H1 · No faculty double-booking",
  H2_roomClash: "H2 · No room double-booking",
  H3_sectionClash: "H3 · No section double-booking",
  H4_facultyAvailability: "H4 · Faculty availability",
  H5_roomAvailability: "H5 · Room availability",
  H6_roomCapacity: "H6 · Room capacity",
  H7_facultyCourseMapping: "H7 · Faculty eligibility",
  H8_requiredSessions: "H8 · Required weekly sessions",
};

export default function ValidationPanel({ validation }) {
  return (
    <div className="mb-6">
      <h3 className="font-bold text-base text-slate-900 mb-3">
        Hard-constraint validation ({validation.totalViolations} violation
        {validation.totalViolations === 1 ? "" : "s"})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(validation.violations).map(([key, list]) => (
          <div
            key={key}
            className={`rounded-md border p-3 text-xs ${
              list.length ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <div className="flex justify-between font-semibold">
              <span>{LABELS[key] || key}</span>
              <span className={list.length ? "text-rose-700" : "text-emerald-700"}>
                {list.length ? `✗ ${list.length}` : "✓ 0"}
              </span>
            </div>
            {list.map((v, i) => (
              <div key={i} className="mt-1 text-rose-700">{v}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
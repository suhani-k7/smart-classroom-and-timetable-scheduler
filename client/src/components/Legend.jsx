export default function Legend({ warningTitle, warningText }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-700">
        <div className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Availability Legend (Hard Constraint H4)
        </div>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="inline-block mt-0.5 px-1 py-0.5 bg-rose-100 border border-rose-300 text-rose-700 text-[10px] font-bold rounded whitespace-nowrap">☑ Checked</span>
            <span><b>UNAVAILABLE:</b> Faculty cannot teach during this day/slot. The scheduler will never assign a class here.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="inline-block mt-0.5 px-1 py-0.5 bg-white border border-slate-300 text-slate-600 text-[10px] font-bold rounded whitespace-nowrap">☐ Unchecked</span>
            <span><b>AVAILABLE:</b> Faculty is eligible to take scheduled sessions during this slot.</span>
          </li>
        </ul>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900">
        <div className="font-semibold text-amber-800 mb-1">⚠️ {warningTitle}</div>
        <p className="leading-relaxed">{warningText}</p>
      </div>
    </div>
  );
}
import { useDataset } from "../context/DatasetContext";
import { diffDataset } from "../utils/diff";

export default function ChangeSummary() {
  const { dataset, baseline, revert } = useDataset();
  const changes = diffDataset(baseline, dataset);

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-base sm:text-lg text-slate-900">Configuration Changes & Impact Summary</h2>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            changes.length ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
          }`}>
            {changes.length} modification{changes.length === 1 ? "" : "s"}
          </span>
        </div>
        {changes.length > 0 && (
          <button onClick={revert} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
            Revert Unsaved Inputs
          </button>
        )}
      </div>

      {changes.length === 0 ? (
        <p className="text-xs text-slate-500">No changes. The default dataset will be used.</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {changes.map((c, i) => (
            <li key={i} className="flex flex-wrap gap-2">
              <span className="px-1.5 rounded bg-slate-100 text-slate-600 font-medium">{c.area}</span>
              <span className="text-slate-800">{c.text}</span>
              <span className="text-slate-500">→ affects {c.impact}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
import { useDataset } from "../context/DatasetContext";
import { diffDataset } from "../utils/diff";

export default function ChangeSummary() {
  const { dataset, baseline, hasUnsaved, revertUnsaved } = useDataset();
  const changes = diffDataset(baseline, dataset);

  const grouped = changes.reduce((acc, c) => {
    (acc[c.category] = acc[c.category] || []).push(c);
    return acc;
  }, {});

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-bold text-base sm:text-lg text-slate-900">Configuration Changes & Impact Summary</h2>
          {changes.length === 0 ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">0 modifications (baseline)</span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200">
              {changes.length} modification{changes.length > 1 ? "s" : ""} from default
            </span>
          )}
          {hasUnsaved && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
              unsaved edits
            </span>
          )}
        </div>
        {hasUnsaved && (
          <button onClick={revertUnsaved} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
            Revert Unsaved Inputs
          </button>
        )}
      </div>

      {changes.length === 0 ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs sm:text-sm flex items-start gap-2.5">
          <span className="text-slate-400 font-bold text-base leading-none mt-0.5">ℹ</span>
          <div>
            <span className="font-semibold text-slate-800">Baseline Dataset Active:</span> No configuration inputs have been
            modified. Generating will use the default seed data. Edit courses, sections, rooms or faculty availability below
            to test constraint adaptations.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center justify-between">
                <span>{cat}</span>
                <span className="text-[11px] font-normal text-slate-500">{items.length} edit{items.length > 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2.5">
                {items.map((c, i) => (
                  <div key={i} className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                      <span className="font-bold text-slate-900">{c.item}</span>
                      <span className="text-slate-500 font-medium">{c.field}:</span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="line-through text-slate-400">{c.from}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{c.to}</span>
                      </div>
                    </div>
                    {c.details && (
                      <div className="text-[11px] font-mono text-slate-600 mt-1 bg-slate-50 p-1.5 rounded">{c.details}</div>
                    )}
                    <div className="mt-2 text-xs text-amber-900 bg-amber-50/90 border border-amber-200 rounded p-2 leading-relaxed">
                      <span className="font-semibold text-amber-950">Potential Impact: </span>{c.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
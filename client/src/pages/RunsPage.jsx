import { useEffect, useState } from "react";
import { listRuns } from "../api/api";

export default function RunsPage() {
  const [runs, setRuns] = useState([]);
  useEffect(() => { listRuns().then(setRuns); }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Timetable Run History</h1>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700 text-left">
            <tr>
              <th className="p-3">Run</th><th className="p-3">Time</th><th className="p-3">Result</th>
              <th className="p-3">Nodes</th><th className="p-3">Violations</th><th className="p-3">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runs.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-semibold">#{r.id}</td>
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">
                  {r.feasible
                    ? <span className="text-emerald-700 font-medium">✅ Feasible</span>
                    : <span className="text-rose-700 font-medium" title={r.reason}>❌ Infeasible</span>}
                </td>
                <td className="p-3">{r.nodes_explored ?? "–"}</td>
                <td className="p-3">{r.total_violations ?? "–"}</td>
                <td className="p-3">{r.duration_ms} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
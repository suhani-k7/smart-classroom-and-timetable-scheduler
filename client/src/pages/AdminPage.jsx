import { useState } from "react";
import { useDataset } from "../context/DatasetContext";
import { generateTimetable } from "../api/api";
import { diffDataset } from "../utils/diff";
import ChangeSummary from "../components/ChangeSummary";
import CoursesTable from "../components/CoursesTable";
import SectionsTable from "../components/SectionsTable";
import RoomsTable from "../components/RoomsTable";
import AvailabilityGrid from "../components/AvailabilityGrid";
import Legend from "../components/Legend";
import ValidationPanel from "../components/ValidationPanel";
import TimetableGrid from "../components/TimetableGrid";

const DOT = { ready: "bg-emerald-500", busy: "bg-indigo-600 animate-pulse", ok: "bg-emerald-500", bad: "bg-rose-500", info: "bg-slate-400" };

function Spinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function AdminPage() {
  const { dataset, baseline, error, resetToDefault, markSaved } = useDataset();
  const [result, setResult] = useState(null);
  const [recap, setRecap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [status, setStatus] = useState({ kind: "ready", text: "Ready to schedule. Edit inputs below to test constraint adaptations." });

  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!dataset) return <p className="p-6">Loading dataset from server...</p>;

  async function handleGenerate() {
    setLoading(true);
    setStatus({ kind: "busy", text: "Executing CSP backtracking solver and hard constraint validator..." });
    setRecap(diffDataset(baseline, dataset));
    try {
      const r = await generateTimetable(dataset);
      setResult(r);
      markSaved(dataset);
      setStatus(r.feasible
        ? { kind: "ok", text: `Timetable generated successfully (${r.validation.totalViolations} hard-constraint violations).` }
        : { kind: "bad", text: "Infeasible schedule: constraints could not be satisfied simultaneously." });
    } catch (e) {
      setStatus({ kind: "bad", text: `Request failed: ${e.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      await resetToDefault();
      setResult(null);
      setStatus({ kind: "ready", text: "Reset to default dataset. No pending modifications." });
    } catch (e) {
      setStatus({ kind: "bad", text: `Reset failed: ${e.message}` });
    } finally {
      setResetting(false);
    }
  }

  const violations = result?.validation?.totalViolations ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Admin Scheduling Dashboard</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
            CSP Backtracking Engine • Constraints H1–H8
          </span>
        </div>
        <p className="text-slate-600 text-sm">
          Configure institutional academic data, simulate constraints, and generate a conflict-free timetable verified against eight hard constraints.
        </p>
      </header>

      {/* Action bar */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap items-center justify-between gap-4 sticky top-16 z-20">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleGenerate} disabled={loading || resetting}
            className="px-5 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium text-sm shadow-sm flex items-center">
            {loading ? <><Spinner />Generating Timetable...</> : "Generate Timetable"}
          </button>
          <button onClick={handleReset} disabled={loading || resetting}
            className="px-4 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium text-sm border border-slate-300">
            {resetting ? "Resetting..." : "Reset to Default Data"}
          </button>
        </div>
        <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${DOT[status.kind]}`}></span>
          <span className={status.kind === "bad" ? "text-rose-700" : status.kind === "ok" ? "text-emerald-700" : ""}>{status.text}</span>
        </div>
      </div>

      <ChangeSummary />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CoursesTable />
        <div className="space-y-6">
          <SectionsTable />
          <RoomsTable />
        </div>
      </div>

      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
        <div className="border-b border-slate-200 pb-3 mb-4">
          <h2 className="font-bold text-lg text-slate-900">Faculty Availability Constraints</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define time slot exclusions for academic faculty (Hard Constraint H4).</p>
        </div>
        <Legend
          warningTitle="Scheduling Ripple Effects"
          warningText="Restricting slots reduces search domain size. The solver may need to shift multiple courses, faculty assignments, and rooms to achieve 0 clashes. If overly restricted, the solver will correctly report infeasibility."
        />
        <div className="space-y-6">
          {dataset.FACULTY.map((f) => <AvailabilityGrid key={f.id} facultyId={f.id} disabled={loading} />)}
        </div>
      </section>

      {/* Results */}
      {result && (
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
            <div>
              <h2 className="font-bold text-lg text-slate-900">Timetable Generation & Validation Results</h2>
              <p className="text-xs text-slate-500 mt-0.5">Outputs produced by the CSP backtracking scheduler and verified by the independent validator.</p>
            </div>
            {!result.feasible ? (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">Infeasible</span>
            ) : violations === 0 ? (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Feasible (0 Violations)</span>
            ) : (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">⚠ {violations} Violation(s)</span>
            )}
          </div>

          {/* Summary banner */}
          {!result.feasible ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-sm mb-4">
              <div className="font-bold text-base">❌ Schedule Infeasible With Submitted Dataset</div>
              <div className="mt-1 text-slate-700 leading-relaxed">{result.reason}</div>
              <div className="mt-2.5 text-xs text-rose-700 bg-rose-100/70 p-2.5 rounded border border-rose-200">
                <b>Diagnostic Note:</b> An infeasible result shows the solver correctly enforces hard constraints instead of producing an illegal schedule.
                Try loosening room capacities, adjusting sessions, or clearing faculty unavailable slots.
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold text-base leading-none">✓</span>
                <span className="font-semibold">Whole-system timetable generated — {result.timetable.length} sessions placed, {violations} hard-constraint violations.</span>
              </div>
              <div className="text-xs text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded font-medium">
                Nodes explored: <b>{result.stats?.nodesExplored ?? 0}</b>{result.runId && <> · Run #{result.runId}</>}
              </div>
            </div>
          )}

          {/* Submitted configuration recap */}
          {recap.length === 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs flex items-center justify-between mb-4">
              <span><span className="font-semibold text-slate-800">Submitted Configuration:</span> Default baseline dataset (no modified inputs).</span>
              <span className="text-slate-400 font-mono text-[11px]">0 custom parameters</span>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-950 text-xs mb-4">
              <div className="font-semibold flex items-center justify-between">
                <span>Submitted Configuration ({recap.length} custom parameter{recap.length > 1 ? "s" : ""}):</span>
                <span className="font-mono text-[11px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">Custom Run</span>
              </div>
              <ul className="mt-1.5 space-y-1 list-disc list-inside text-indigo-900">
                {recap.map((d, i) => <li key={i}><b>{d.item}</b> ({d.field}): {String(d.from)} → <b>{String(d.to)}</b></li>)}
              </ul>
            </div>
          )}

          {result.feasible ? (
            <>
              <ValidationPanel validation={result.validation} />
              <h3 className="font-bold text-base text-slate-900 mb-3">Institutional Weekly Timetables (By Section)</h3>
              <div className="space-y-6">
                {result.sections.map((s) => (
                  <TimetableGrid key={s.id} section={s} timetable={result.timetable}
                    days={result.days} slots={result.slots} courses={dataset.COURSES} />
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <div className="text-3xl mb-2">📅</div>
              <div className="font-semibold text-slate-600">No Timetable Generated</div>
              <div className="text-xs text-slate-400 mt-1">Due to infeasibility, no assignments were produced by the scheduling engine.</div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
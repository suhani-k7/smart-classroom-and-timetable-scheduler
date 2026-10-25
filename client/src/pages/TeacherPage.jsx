import { useState } from "react";
import { useDataset } from "../context/DatasetContext";
import AvailabilityGrid from "../components/AvailabilityGrid";
import Legend from "../components/Legend";
import PersonalTimetable from "../components/PersonalTimetable";
import { saveAvailability, getMyTimetable, regenerateForFaculty, getNotifications, markNotificationsRead } from "../api/api";
import NotificationPanel from "../components/NotificationPanel";


export default function TeacherPage() {
  const { dataset, saved, error, markFacultySaved } = useDataset();
  const [facultyId, setFacultyId] = useState("");
  const [result, setResult] = useState(null);        // latest personal timetable result
  const [previous, setPrevious] = useState(null);    // sessions before the last regenerate
  const [afterRegen, setAfterRegen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);    // { kind, text }
  const [notifications, setNotifications] = useState([]);

  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!dataset) return <p className="p-6">Loading...</p>;

  const fac = dataset.FACULTY.find((f) => f.id === facultyId);
  const savedFac = saved?.FACULTY.find((f) => f.id === facultyId);
  const unsaved = fac && savedFac && JSON.stringify(fac.unavailable) !== JSON.stringify(savedFac.unavailable);
  const courseName = (id) => dataset.COURSES.find((c) => c.id === id)?.name;
  const isUnavailable = (day, slot) => !!fac?.unavailable.some((u) => u.day === day && u.slot === slot);

  async function selectFaculty(id) {
    setFacultyId(id);
    setResult(null); setPrevious(null); setAfterRegen(false); setFeedback(null); setNotifications([]);
    if (!id) return;
    try {
      const [tt, notes] = await Promise.all([getMyTimetable(id), getNotifications(id)]);
      setResult(tt);
      setNotifications(notes);
    } catch (e) {
      setFeedback({ kind: "bad", text: `Failed to load: ${e.message}` });
    }
  }

  async function dismissNotifications() {
    await markNotificationsRead(facultyId);
    setNotifications([]);
  }

  async function applyAndRegenerate() {
    setBusy(true);
    setFeedback({ kind: "busy", text: "Updating availability and running CSP scheduler..." });
    try {
      await saveAvailability(fac.id, fac.unavailable);
      markFacultySaved(fac.id);
      const r = await regenerateForFaculty(fac.id);
      setPrevious(result?.feasible ? result.mySessions : null);
      setAfterRegen(true);
      setResult(r);
      if (!r.feasible) setFeedback({ kind: "bad", text: "❌ Infeasible: unable to satisfy all constraints." });
      else if (r.validation.totalViolations === 0) setFeedback({ kind: "ok", text: `✓ Timetable successfully regenerated (0 hard violations).${r.notified?.length ? ` ${r.notified.length} other teacher(s) notified of changes.` : ""}` });
      else setFeedback({ kind: "warn", text: `⚠ Schedule generated with ${r.validation.totalViolations} violation(s).` });
    } catch (e) {
      setFeedback({ kind: "bad", text: `❌ Request failed: ${e.message}` });
    } finally {
      setBusy(false);
    }
  }

  // moved-session count for the diff note
  const prevById = Object.fromEntries((previous || []).map((s) => [s.sessionId, s]));
  const moved = afterRegen && result?.feasible
    ? result.mySessions.filter((s) => prevById[s.sessionId] && (prevById[s.sessionId].day !== s.day || prevById[s.sessionId].slot !== s.slot)).length
    : 0;
  const violations = result?.validation?.totalViolations ?? 0;
  const fbColor = { busy: "text-indigo-600", ok: "text-emerald-700", warn: "text-amber-700", bad: "text-rose-600" };

  const newKeys = new Set(
    notifications.flatMap((n) => [
      ...n.details.added.map((s) => `${s.courseId}|${s.sectionId}|${s.day}|${s.slot}`),
      ...n.details.moved.map((m) => `${m.to.courseId}|${m.to.sectionId}|${m.to.day}|${m.to.slot}`),
    ])
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Teacher View</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            Prototype Simulation • No Authentication
          </span>
        </div>
        <p className="text-slate-600 text-sm">
          Preview any faculty member's personal weekly schedule, adjust availability constraints, and observe how the CSP scheduling engine adapts.
        </p>
        <div className="mt-3 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5 leading-relaxed">
          <span className="text-blue-600 font-bold text-base leading-none">ℹ</span>
          <div>
            <span className="font-semibold">Demonstration Selector Notice:</span> This is an interactive selector for prototype evaluation,
            not a login system. Role-based access control (RBAC) is not active yet. Changes submitted here update the shared dataset in the
            database and affect the system-wide timetable.
          </div>
        </div>
      </header>

      {/* Faculty selector */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
        <label className="block text-sm font-semibold text-slate-800 mb-1">Preview faculty member</label>
        <p className="text-xs text-slate-500 mb-3">
          Select a faculty profile to view their expertise, configure unavailable slots, and inspect their personal timetable.
        </p>
        <select value={facultyId} disabled={busy} onChange={(e) => selectFaculty(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-md bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="">-- Select faculty member --</option>
          {dataset.FACULTY.map((f) => <option key={f.id} value={f.id}>{f.id} - {f.name}</option>)}
        </select>
      </section>
      {fac && <NotificationPanel notifications={notifications} onDismiss={dismissNotifications} />}

      {fac && (
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
          <div className="border-b border-slate-200 pb-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-lg text-slate-900">{fac.id} - {fac.name}</h2>
              {unsaved && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">unsaved changes</span>}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-semibold text-slate-600 mr-1">Eligible Courses:</span>
              {fac.expertise.map((cId) => (
                <span key={cId} className="inline-block text-[11px] bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded border border-slate-200">
                  {cId}{courseName(cId) ? ` · ${courseName(cId)}` : ""}
                </span>
              ))}
            </div>
          </div>

          <Legend
            warningTitle="Institutional Schedule Impact"
            warningText="Marking slots unavailable constrains the entire timetable. When regenerated, the solver re-assigns sessions across all sections, rooms and faculty to satisfy H1–H8. Other teachers' or sections' sessions may shift as a result."
          />

          <AvailabilityGrid facultyId={fac.id} disabled={busy} showHeader={false} />

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button onClick={applyAndRegenerate} disabled={busy}
              className="px-5 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium text-sm shadow-sm">
              {busy ? "Applying & Regenerating..." : "Apply Availability & Regenerate Timetable"}
            </button>
            {feedback && <span className={`text-xs font-semibold ${fbColor[feedback.kind]}`}>{feedback.text}</span>}
          </div>
        </section>
      )}

      {fac && result && (
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="font-bold text-lg text-slate-900">Personal Weekly Timetable</h2>
              <p className="text-xs text-slate-500">Weekly teaching schedule for {fac.id} - {fac.name}</p>
            </div>
            {!result.feasible ? (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">Infeasible</span>
            ) : violations === 0 ? (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Feasible (0 Violations)</span>
            ) : (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">⚠ {violations} Violation(s)</span>
            )}
          </div>

          {!result.feasible ? (
            <>
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-sm mb-4">
                <div className="font-bold text-base">❌ Schedule Infeasible With Current Constraints</div>
                <div className="mt-1 text-slate-700">{result.reason}</div>
                <div className="mt-2 text-xs text-rose-700 bg-rose-100/70 p-2.5 rounded border border-rose-200">
                  <b>Resolution advice:</b> Uncheck one or more unavailable slots above to give the solver more options, then click
                  <b> Apply Availability & Regenerate Timetable</b> again.
                </div>
              </div>
              <div className="p-8 text-center text-slate-400 text-sm border border-slate-200 rounded-lg">
                <div className="text-3xl mb-2">📅</div>
                <div className="font-semibold text-slate-600">No Timetable Available</div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="font-semibold">✓ Whole-system timetable {afterRegen ? "regenerated" : "loaded"} — H1–H8 satisfied.</span>
                <span className="text-xs text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded font-medium">
                  Nodes explored: <b>{result.stats?.nodesExplored ?? 0}</b>
                </span>
              </div>

              {result.mySessions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm border border-slate-200 rounded-lg">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="font-semibold text-slate-700">No Teaching Sessions Assigned</div>
                  <div className="text-xs text-slate-400 mt-1">This faculty member has no sessions in the current timetable.</div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <PersonalTimetable sessions={result.mySessions} previous={previous} highlightMoves={afterRegen} newKeys={newKeys}
                    days={result.days} slots={result.slots} courses={dataset.COURSES} isUnavailable={isUnavailable} />
                </div>
              )}

              {/* Diff note */}
              <div className="mt-4">
                {!afterRegen ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs flex items-start gap-2">
                    <span className="text-slate-400 font-bold">ℹ</span>
                    <div><b>Current Baseline Schedule:</b> Showing the active schedule before any changes. Modify the checkboxes above and click
                      <b> Apply Availability & Regenerate Timetable</b> to see the engine adapt.</div>
                  </div>
                ) : previous && moved > 0 ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
                    <span className="text-amber-600 font-bold text-base leading-none mt-0.5">⚡</span>
                    <div><div className="font-semibold text-amber-950">Timetable Reorganized</div>
                      <b>{moved} session(s)</b> for this faculty member moved to a different day/slot (highlighted above). Other faculty or sections may have shifted as well.</div>
                  </div>
                ) : previous ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold text-base leading-none mt-0.5">✓</span>
                    <div><div className="font-semibold text-emerald-950">Schedule Unchanged</div>
                      <b>No sessions needed to move</b>: the existing schedule already respects the updated availability.</div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
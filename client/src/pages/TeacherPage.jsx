import { useState } from "react";
import { Link } from "react-router-dom";
import { useDataset } from "../context/DatasetContext";
import { saveAvailability, getPersonalTimetable } from "../api/api";
import AvailabilityGrid from "../components/AvailabilityGrid";
import PersonalTimetable from "../components/PersonalTimetable";

export default function TeacherPage() {
  const { dataset, error } = useDataset();
  const [facultyId, setFacultyId] = useState("");
  const [status, setStatus] = useState("");       // save message
  const [saving, setSaving] = useState(false);
  const [myResult, setMyResult] = useState(null); // personal timetable result
  const [loadingTT, setLoadingTT] = useState(false);

  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!dataset) return <p className="p-6">Loading...</p>;

  const fac = dataset.FACULTY.find((f) => f.id === facultyId);

  async function handleSave() {
    setSaving(true);
    setStatus("");
    try {
      await saveAvailability(fac.id, fac.unavailable);
      setStatus("✅ Availability saved. It will be used in the next timetable generation.");
      setMyResult(null); // old personal timetable is now out of date
    } catch (e) {
      setStatus("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleViewTimetable() {
    setLoadingTT(true);
    try {
      setMyResult(await getPersonalTimetable(fac.id));
    } catch (e) {
      setMyResult({ feasible: false, reason: e.message });
    } finally {
      setLoadingTT(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      {/* View switcher */}
      <div className="flex gap-4 mb-4 text-sm">
        <Link to="/admin" className="text-slate-500 hover:text-indigo-700 pb-1">Admin View</Link>
        <Link to="/teacher" className="font-semibold text-indigo-700 border-b-2 border-indigo-700 pb-1">Teacher View</Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Teacher Availability Portal</h1>
        <p className="text-slate-600 text-sm">
          Select your name, mark the slots when you are unavailable, and save. The scheduler will respect them (Hard Constraint H4).
        </p>
      </header>

      {/* Faculty selector */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
        <label className="block text-sm font-semibold text-slate-800 mb-2">Faculty member</label>
        <select
          value={facultyId}
          onChange={(e) => { setFacultyId(e.target.value); setStatus(""); setMyResult(null); }}
          className="border border-slate-300 rounded px-3 py-2 text-sm w-full sm:w-80"
        >
          <option value="">— Select your name —</option>
          {dataset.FACULTY.map((f) => (
            <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
          ))}
        </select>
      </section>

      {fac && (
        <>
          {/* Availability editor */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
            <h2 className="font-bold text-lg text-slate-900 mb-1">My Availability</h2>
            <p className="text-xs text-slate-500 mb-4">☑ Checked = UNAVAILABLE · ☐ Unchecked = available</p>

            <AvailabilityGrid facultyId={fac.id} />

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium text-sm"
              >
                {saving ? "Saving..." : "Save Availability"}
              </button>
              <button
                onClick={handleViewTimetable}
                disabled={loadingTT}
                className="px-4 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium text-sm border border-slate-300"
              >
                {loadingTT ? "Generating..." : "View My Timetable"}
              </button>
              {status && <span className="text-xs text-slate-700">{status}</span>}
            </div>
          </section>

          {/* Personal timetable */}
          {myResult && (
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-10">
              <h2 className="font-bold text-lg text-slate-900 mb-3">My Weekly Timetable</h2>
              {!myResult.feasible ? (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-4 text-sm text-rose-800">
                  <b>❌ No feasible timetable with the current saved data.</b>
                  <div>{myResult.reason}</div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mb-3">
                    {myResult.mySessions.length} session(s) assigned to {fac.name} this week.
                  </p>
                  <PersonalTimetable
                    sessions={myResult.mySessions}
                    days={myResult.days}
                    slots={myResult.slots}
                    courses={dataset.COURSES}
                  />
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
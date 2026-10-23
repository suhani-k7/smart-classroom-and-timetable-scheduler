import { useState } from "react";
import { Link } from "react-router-dom";
import { useDataset } from "../context/DatasetContext";
import { generateTimetable } from "../api/api";
import TimetableGrid from "../components/TimetableGrid";
import ValidationPanel from "../components/ValidationPanel";
import CoursesTable from "../components/CoursesTable";
import SectionsTable from "../components/SectionsTable";
import RoomsTable from "../components/RoomsTable";
import AvailabilityGrid from "../components/AvailabilityGrid";

export default function AdminPage() {
    const { dataset, error } = useDataset();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
    if (!dataset) return <p className="p-6">Loading...</p>;

    async function handleGenerate() {
        setLoading(true);
        try {
            setResult(await generateTimetable(dataset));
        } catch (e) {
            setResult({ feasible: false, reason: e.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
            {/* View switcher */}
            <div className="flex gap-4 mb-4 text-sm">
                <Link to="/admin" className="font-semibold text-indigo-700 border-b-2 border-indigo-700 pb-1">Admin View</Link>
                <Link to="/teacher" className="text-slate-500 hover:text-indigo-700 pb-1">Teacher View</Link>
            </div>

            {/* Header */}
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap items-center justify-between gap-4 sticky top-3 z-10">
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors shadow-sm"
                >
                    {loading ? "Generating..." : "Generate Timetable"}
                </button>
                <span className="text-xs text-slate-600">
                    {loading ? "Running CSP search..." : "Ready to schedule."}
                </span>
            </div>

            {/* Configuration: courses (left), sections + rooms (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <CoursesTable />
                <div className="space-y-6">
                    <SectionsTable />
                    <RoomsTable />
                </div>
            </div>

            {/* Faculty availability will go here (Step 18) */}
            {/* Faculty availability (full width) */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
                <div className="border-b border-slate-200 pb-3 mb-4">
                    <h2 className="font-bold text-lg text-slate-900">Faculty Availability Constraints</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Define time slot exclusions for academic faculty (Hard Constraint H4).
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-700">
                        <div className="font-semibold text-slate-800 mb-1">Availability Legend (H4)</div>
                        <ul className="space-y-1">
                            <li><b className="text-rose-700">☑ Checked = UNAVAILABLE:</b> the solver will never assign a session here.</li>
                            <li><b>☐ Unchecked = AVAILABLE:</b> faculty can take sessions in this slot.</li>
                        </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900">
                        <div className="font-semibold text-amber-800 mb-1">⚠️ Scheduling Ripple Effects</div>
                        <p>
                            Restricting slots shrinks the search domain. If over-restricted, the solver will correctly report infeasibility.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {dataset.FACULTY.map((f) => (
                        <AvailabilityGrid key={f.id} facultyId={f.id} />
                    ))}
                </div>
            </section>

            {/* Results */}
            {result && (
                <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 mb-10">
                    <h2 className="font-bold text-lg text-slate-900 mb-4">Timetable Generation & Validation Results</h2>

                    {!result.feasible && (
                        <div className="bg-rose-50 border border-rose-200 rounded-md p-4 text-sm">
                            <div className="font-bold text-rose-700 mb-1">❌ Infeasible: no valid timetable exists</div>
                            <div className="text-rose-800">{result.reason}</div>
                        </div>
                    )}

                    {result.feasible && (
                        <>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-sm mb-6">
                                <span className="font-bold text-emerald-700">✅ Feasible timetable generated</span>
                                <span className="text-emerald-800">
                                    {" "}· {result.timetable.length} sessions placed · {result.stats.nodesExplored} search nodes
                                </span>
                            </div>

                            <ValidationPanel validation={result.validation} />

                            <h3 className="font-bold text-base text-slate-900 mb-3">Weekly Timetables (By Section)</h3>
                            <div className="space-y-6">
                                {result.sections.map((s) => (
                                    <TimetableGrid
                                        key={s.id}
                                        sectionId={s.id}
                                        timetable={result.timetable}
                                        days={result.days}
                                        slots={result.slots}
                                        courses={dataset.COURSES}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}
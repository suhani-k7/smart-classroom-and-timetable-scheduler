import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-indigo-100 text-indigo-800" : "text-slate-600 hover:text-indigo-700 hover:bg-slate-100"
  }`;

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <NavLink to="/admin" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">S</span>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Smart<span className="text-indigo-600">Sched</span>
          </span>
          <span className="hidden md:inline text-xs text-slate-500 ml-2">Constraint-based timetable scheduler</span>
        </NavLink>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <NavLink to="/admin" className={linkClass}>Admin</NavLink>
          <NavLink to="/teacher" className={linkClass}>Teacher</NavLink>
          <NavLink to="/runs" className={linkClass}>Run History</NavLink>
        </nav>
      </div>
    </header>
  );
}
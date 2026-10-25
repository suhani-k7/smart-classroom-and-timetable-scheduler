const fmt = (s) => `${s.courseId} · ${s.sectionId} · ${s.day} ${s.slot} · ${s.room}`;

export default function NotificationPanel({ notifications, onDismiss }) {
  if (!notifications.length) return null;

  return (
    <section className="bg-amber-50 border border-amber-300 rounded-lg p-4 sm:p-5 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-bold text-amber-950 flex items-center gap-2">
          <span className="text-lg">🔔</span>
          {notifications.length} timetable update{notifications.length > 1 ? "s" : ""} since your last visit
        </h2>
        <button onClick={onDismiss}
          className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white">
          Got it — mark as read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="bg-white border border-amber-200 rounded-md p-3 text-xs">
            <div className="flex flex-wrap justify-between gap-2 mb-1.5">
              <span className="font-semibold text-slate-900">{n.summary}</span>
              <span className="text-slate-500">{new Date(n.created_at).toLocaleString()} · Run #{n.run_id}</span>
            </div>
            <div className="text-slate-500 mb-2">Caused by: <b className="text-slate-700">{n.triggered_by}</b></div>

            {n.details.added.length > 0 && (
              <div className="mb-1.5">
                <span className="font-semibold text-emerald-700">🆕 New classes:</span>
                <ul className="list-disc list-inside text-emerald-900 font-mono text-[11px]">
                  {n.details.added.map((s, i) => <li key={i}>{fmt(s)}</li>)}
                </ul>
              </div>
            )}
            {n.details.moved.length > 0 && (
              <div className="mb-1.5">
                <span className="font-semibold text-amber-700">⚡ Moved:</span>
                <ul className="list-disc list-inside text-amber-900 font-mono text-[11px]">
                  {n.details.moved.map((m, i) => (
                    <li key={i}>{m.to.courseId} · {m.to.sectionId}: {m.from.day} {m.from.slot} → <b>{m.to.day} {m.to.slot}</b> ({m.to.room})</li>
                  ))}
                </ul>
              </div>
            )}
            {n.details.removed.length > 0 && (
              <div>
                <span className="font-semibold text-rose-700">➖ No longer teaching:</span>
                <ul className="list-disc list-inside text-rose-900 font-mono text-[11px]">
                  {n.details.removed.map((s, i) => <li key={i}>{fmt(s)}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
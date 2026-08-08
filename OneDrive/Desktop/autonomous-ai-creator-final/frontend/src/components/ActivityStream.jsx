const EVENT_META = {
  discovered: { label: 'Topic discovered', dot: 'bg-signal-500' },
  evaluating: { label: 'Evaluating', dot: 'bg-ink-300' },
  rejected: { label: 'Rejected', dot: 'bg-reject-500' },
  accepted: { label: 'Accepted', dot: 'bg-publish-500' },
  deferred: { label: 'Deferred', dot: 'bg-defer-500' },
  published: { label: 'Published', dot: 'bg-publish-500' },
  memory_updated: { label: 'Memory updated', dot: 'bg-signal-400' },
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

export default function ActivityStream({ events = [] }) {
  const sorted = [...events].sort((a, b) => new Date(b.ts) - new Date(a.ts))

  return (
    <section aria-label="Live agent activity" className="panel-raised rounded-lg border border-ink-700 flex flex-col min-h-0">
      <div className="px-4 py-3.5 border-b border-ink-700 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-ink-100">Live Activity</h2>
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-500">real-time log</span>
      </div>

      <ol className="overflow-y-auto max-h-[520px] divide-y divide-ink-800">
        {sorted.map((ev) => {
          const meta = EVENT_META[ev.type] ?? { label: ev.type, dot: 'bg-ink-500' }
          return (
            <li key={ev.id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${meta.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink-400">{meta.label}</p>
                <p className="text-sm text-ink-100 truncate">{ev.topic}</p>
              </div>
              <span className="font-mono text-[10px] text-ink-500 shrink-0 whitespace-nowrap">{timeAgo(ev.ts)}</span>
            </li>
          )
        })}
        {sorted.length === 0 && (
          <li className="px-4 py-6 text-sm text-ink-500 text-center">No activity yet.</li>
        )}
      </ol>
    </section>
  )
}

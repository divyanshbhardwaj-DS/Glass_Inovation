import { useMemo, useState } from 'react'
import DecisionCard from './DecisionCard.jsx'

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PUBLISH', label: 'Published' },
  { key: 'REJECT', label: 'Rejected' },
  { key: 'DEFER', label: 'Deferred' },
]

const FILTER_ACTIVE_CLASS = {
  ALL: 'bg-ink-700 text-ink-100 border-ink-600',
  PUBLISH: 'bg-publish-bg text-publish-400 border-publish-500/50',
  REJECT: 'bg-reject-bg text-reject-400 border-reject-500/50',
  DEFER: 'bg-defer-bg text-defer-400 border-defer-500/50',
}

export default function DecisionRoom({ decisions = [] }) {
  const [filter, setFilter] = useState('ALL')

  const counts = useMemo(() => {
    const c = { ALL: decisions.length, PUBLISH: 0, REJECT: 0, DEFER: 0 }
    for (const d of decisions) c[d.decision] = (c[d.decision] ?? 0) + 1
    return c
  }, [decisions])

  const visible = useMemo(() => {
    const sorted = [...decisions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    return filter === 'ALL' ? sorted : sorted.filter((d) => d.decision === filter)
  }, [decisions, filter])

  return (
    <section aria-label="Editorial decision room" className="flex flex-col gap-4 min-h-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-ink-100">Editorial Decision Room</h2>
          <p className="text-[11px] text-ink-500 mt-0.5">
            Every evaluated topic, every score, every reason — publish and reject decisions shown with equal weight.
          </p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active ? FILTER_ACTIVE_CLASS[f.key] : 'border-ink-700 text-ink-400 hover:text-ink-200'
                }`}
              >
                {f.label} <span className="tabular-nums opacity-70">({counts[f.key] ?? 0})</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((decision) => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-ink-500 col-span-full text-center py-10">No decisions in this category.</p>
        )}
      </div>
    </section>
  )
}

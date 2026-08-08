function formatPct(v) {
  if (v === null || v === undefined) return '—'
  return `${Math.round(v * 100)}%`
}

const METRIC_DEFS = [
  { key: 'topicsDiscovered', label: 'Discovered', tone: 'default' },
  { key: 'topicsEvaluated', label: 'Evaluated', tone: 'default' },
  { key: 'topicsRejected', label: 'Rejected', tone: 'reject' },
  { key: 'topicsDeferred', label: 'Deferred', tone: 'defer' },
  { key: 'postsPublished', label: 'Published', tone: 'publish' },
  { key: 'duplicateRate', label: 'Duplicate Rate', tone: 'default', format: formatPct },
  { key: 'sourceBackedPct', label: 'Source-Backed', tone: 'default', format: formatPct },
]

const TONE_TEXT = {
  default: 'text-ink-100',
  publish: 'text-publish-400',
  reject: 'text-reject-400',
  defer: 'text-defer-400',
}

const TONE_ACCENT = {
  default: 'bg-ink-600',
  publish: 'bg-publish-500',
  reject: 'bg-reject-500',
  defer: 'bg-defer-500',
}

export default function MetricsBar({ metrics }) {
  return (
    <section aria-label="Editorial pipeline metrics" className="mx-auto max-w-7xl px-4 sm:px-6 pt-5">
      <div className="panel-raised rounded-lg border border-ink-700 overflow-x-auto">
        <div className="flex divide-x divide-ink-700 min-w-max">
          {METRIC_DEFS.map((def) => {
            const raw = metrics?.[def.key]
            const value = def.format ? def.format(raw) : raw ?? '—'
            return (
              <div key={def.key} className="relative flex-1 min-w-[7.5rem] px-4 py-3.5 flex flex-col gap-1.5 group hover:bg-white/[0.02] transition-colors">
                <span className={`absolute top-0 left-0 right-0 h-0.5 ${TONE_ACCENT[def.tone]} opacity-70 group-hover:opacity-100 transition-opacity`} />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">{def.label}</span>
                <span className={`font-display text-2xl font-semibold tabular-nums ${TONE_TEXT[def.tone]}`}>{value}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

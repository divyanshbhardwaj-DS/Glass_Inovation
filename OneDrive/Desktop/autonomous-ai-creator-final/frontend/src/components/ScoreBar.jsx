const SCORE_LABELS = {
  relevance: 'Relevance',
  novelty: 'Novelty',
  recency: 'Recency',
  personaFit: 'Persona Fit',
  sourceQuality: 'Source Quality',
  impact: 'Impact',
  duplicateRisk: 'Duplicate Risk',
}

// duplicateRisk is "bad when high" — everything else is "good when high".
const INVERTED_KEYS = new Set(['duplicateRisk'])

function barTextColor(key, value) {
  const goodness = INVERTED_KEYS.has(key) ? 1 - value : value
  if (goodness >= 0.7) return 'text-publish-500'
  if (goodness >= 0.4) return 'text-defer-500'
  return 'text-reject-500'
}

export default function ScoreBar({ scoreKey, value }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[6.5rem] shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink-500">
        {SCORE_LABELS[scoreKey] ?? scoreKey}
      </span>
      <div className="flex-1 h-1 bg-ink-800 rounded-full overflow-hidden">
        <div
          className={`score-fill h-full rounded-full ${barTextColor(scoreKey, value)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-300">{pct}</span>
    </div>
  )
}

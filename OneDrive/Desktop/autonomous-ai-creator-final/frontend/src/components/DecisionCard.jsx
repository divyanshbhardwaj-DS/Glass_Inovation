import ScoreBar from './ScoreBar.jsx'
import SourceList from './SourceList.jsx'

const DECISION_STYLES = {
  PUBLISH: { ring: 'border-publish-500/30', stamp: 'text-publish-400', label: 'Published' },
  REJECT: { ring: 'border-reject-500/30', stamp: 'text-reject-400', label: 'Rejected' },
  DEFER: { ring: 'border-defer-500/30', stamp: 'text-defer-400', label: 'Deferred' },
}

const SCORE_ORDER = ['relevance', 'novelty', 'recency', 'personaFit', 'sourceQuality', 'impact', 'duplicateRisk']

export default function DecisionCard({ decision }) {
  const style = DECISION_STYLES[decision.decision] ?? DECISION_STYLES.DEFER

  return (
    <article className={`panel-raised card-lift rounded-lg border ${style.ring} p-4 flex flex-col gap-3.5`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-sm font-medium text-ink-100 leading-snug">{decision.topic}</h3>
        <span className={`stamp shrink-0 text-[10px] ${style.stamp}`}>{style.label}</span>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {SCORE_ORDER.map((key) => (
          <ScoreBar key={key} scoreKey={key} value={decision.scores[key]} />
        ))}
      </div>

      <div className="rounded-md bg-black/25 px-3 py-2.5 border-l-2 border-ink-600">
        <p className="font-mono text-[10px] uppercase tracking-wide text-ink-500 mb-1">Why</p>
        <p className="text-sm text-ink-200 leading-relaxed">{decision.reason}</p>
        {decision.duplicateOf && (
          <p className="text-[11px] text-ink-500 mt-1.5">
            Matched prior topic: <span className="text-ink-300">{decision.duplicateOf.title}</span>
          </p>
        )}
      </div>

      {decision.decision === 'PUBLISH' && <SourceList sources={decision.sources} />}
    </article>
  )
}

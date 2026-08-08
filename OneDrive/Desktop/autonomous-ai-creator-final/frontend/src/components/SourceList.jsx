export default function SourceList({ sources = [] }) {
  if (sources.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-ink-800">
      <p className="font-mono text-[10px] uppercase tracking-wide text-ink-500 mb-1.5">Sources</p>
      <ul className="space-y-1">
        {sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-signal-400 hover:text-signal-500 underline decoration-signal-500/30 underline-offset-2 truncate block"
            >
              {s.label} <span className="text-ink-500">— {s.url}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

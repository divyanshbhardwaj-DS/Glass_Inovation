function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function PublishedFeed({ posts = [] }) {
  const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <section aria-label="Published feed" className="flex flex-col gap-4 min-h-0">
      <div>
        <h2 className="font-display text-sm font-semibold text-ink-100">Published Feed</h2>
        <p className="text-[11px] text-ink-500 mt-0.5">
          Only topics the agent actually decided to publish — each post keeps its editorial rationale and source URLs.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {sorted.map((post) => (
          <article key={post.id} className="panel-raised card-lift rounded-lg border border-publish-500/30 p-4 flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <span className="stamp shrink-0 text-[10px] text-publish-400">Published</span>
              <span className="font-mono text-[11px] text-ink-500 shrink-0 whitespace-nowrap">{formatTimestamp(post.createdAt)}</span>
            </div>

            <p className="text-sm text-ink-100 leading-relaxed whitespace-pre-line">{post.text}</p>

            <div className="rounded-md bg-black/25 px-3 py-2.5 border-l-2 border-publish-500/40">
              <p className="font-mono text-[10px] uppercase tracking-wide text-ink-500 mb-1">Why this was published</p>
              <p className="text-sm text-ink-200 leading-relaxed">{post.rationale}</p>
            </div>

            {post.sources?.length > 0 ? (
              <div className="pt-1">
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink-500 mb-1.5">Sources</p>
                <ul className="space-y-1">
                  {post.sources.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-signal-400 hover:text-signal-500 underline decoration-signal-500/30 underline-offset-2 truncate block"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-[11px] text-ink-500 italic">Source unavailable — not fabricated.</p>
            )}
          </article>
        ))}

        {sorted.length === 0 && (
          <p className="text-sm text-ink-500 text-center py-10">Nothing published yet — the agent only publishes when a topic clears every editorial bar.</p>
        )}
      </div>
    </section>
  )
}

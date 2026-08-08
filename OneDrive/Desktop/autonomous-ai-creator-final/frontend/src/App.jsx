import { useState } from 'react'
import Header from './components/Header.jsx'
import MetricsBar from './components/MetricsBar.jsx'
import ActivityStream from './components/ActivityStream.jsx'
import DecisionRoom from './components/DecisionRoom.jsx'
import PublishedFeed from './components/PublishedFeed.jsx'
import { useAgentFeed } from './hooks/useAgentFeed.js'

const TABS = [
  { key: 'decisions', label: 'Decision Room' },
  { key: 'feed', label: 'Published Feed' },
]

const TICKER_DOT = {
  discovered: 'text-signal-400',
  evaluating: 'text-ink-300',
  rejected: 'text-reject-400',
  accepted: 'text-publish-400',
  deferred: 'text-defer-400',
  published: 'text-publish-400',
  memory_updated: 'text-signal-400',
}

function WireTicker({ events = [] }) {
  const recent = [...events].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 12)
  if (recent.length === 0) return null

  const segment = (keyPrefix) => (
    <div className="flex items-center">
      {recent.map((ev, i) => (
        <span key={`${keyPrefix}-${ev.id}-${i}`} className="flex items-center gap-2 pr-8 whitespace-nowrap font-mono text-[11px]">
          <span className={TICKER_DOT[ev.type] ?? 'text-ink-400'}>●</span>
          <span className="text-ink-400 uppercase tracking-wide">{ev.type.replace('_', ' ')}</span>
          <span className="text-ink-200">{ev.topic}</span>
          <span className="text-ink-600">/</span>
        </span>
      ))}
    </div>
  )

  return (
    <div className="border-b border-ink-700 bg-ink-900/80">
      <div className="flex items-stretch">
        <div className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 border-r border-ink-700 bg-ink-850">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal-400">Wire</span>
        </div>
        <div className="ticker-viewport flex-1 overflow-hidden">
          <div className="ticker-track py-2.5">
            {segment('a')}
            {segment('b')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { data, loading, error } = useAgentFeed()
  const [tab, setTab] = useState('decisions')

  return (
    <div className="min-h-screen text-ink-100 font-sans">
      <Header agent={data?.agent} />
      {data && <WireTicker events={data.activity} />}
      {loading && !data && <div className="mx-auto max-w-7xl px-4 py-16 text-center text-ink-400 text-sm">Starting autonomous editor…</div>}
      {error && <div className="mx-auto max-w-7xl px-4 py-4"><div className="rounded-lg border border-reject-500/40 bg-reject-bg text-reject-400 px-4 py-3 text-sm">Failed to load agent: {error.message}</div></div>}
      {data && <>
        <MetricsBar metrics={data.metrics} />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <div className="flex flex-col gap-4 min-w-0">
            <div className="inline-flex gap-1 p-1 rounded-lg border border-ink-700 bg-ink-900/60 self-start">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-all ${
                    tab === t.key
                      ? 'bg-ink-700 text-ink-100 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {t.label}
                  {t.key === 'feed' && <span className="ml-1.5 tabular-nums opacity-70">({data.posts.length})</span>}
                </button>
              ))}
            </div>
            {tab === 'decisions'
              ? <DecisionRoom decisions={data.decisions} />
              : <PublishedFeed posts={data.posts} />}
          </div>
          <ActivityStream events={data.activity} />
        </main>
      </>}
    </div>
  )
}

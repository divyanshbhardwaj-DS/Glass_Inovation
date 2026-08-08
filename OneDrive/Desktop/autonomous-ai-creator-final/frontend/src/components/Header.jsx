const LAMP_COLOR = {
  AUTONOMOUS: 'bg-signal-500 shadow-[0_0_14px_3px_rgba(63,214,196,0.65)]',
  SUPERVISED: 'bg-defer-500 shadow-[0_0_14px_3px_rgba(245,166,35,0.55)]',
  PAUSED: 'bg-ink-500',
}

function formatTimestamp(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString()
  } catch {
    return '—'
  }
}

export default function Header({ agent }) {
  const status = agent?.status ?? 'AUTONOMOUS'
  const lamp = LAMP_COLOR[status] ?? LAMP_COLOR.AUTONOMOUS

  return (
    <header className="relative border-b border-ink-700 desk-grain overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal-500/50 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal-400 mb-1.5">
            ✦ Editorial Wire Desk
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-gradient">
            Autonomous AI Editorial Agent
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            <span className="text-ink-100 font-medium">{agent?.persona ?? '—'}</span>
            <span className="mx-2 text-ink-600">·</span>
            {agent?.domain ?? '—'}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-ink-500">
            Last action <span className="text-ink-300">{formatTimestamp(agent?.lastActionAt)}</span>
            <span className="mx-2 text-ink-700">/</span>
            Next cycle <span className="text-ink-300">{formatTimestamp(agent?.nextCycleAt)}</span>
          </p>
        </div>

        <div className="panel-raised inline-flex items-center gap-2.5 self-start sm:self-auto rounded-lg border border-ink-700 px-3.5 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {status === 'AUTONOMOUS' && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-500 opacity-60" />
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${lamp}`} />
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-ink-100">{status}</span>
          <span className="hidden sm:inline text-ink-500 text-[11px]">— no human approval in the loop</span>
        </div>
      </div>
    </header>
  )
}

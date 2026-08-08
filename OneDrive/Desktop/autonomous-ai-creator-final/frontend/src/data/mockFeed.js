// Mock data shaped exactly like the eventual response of:
//   GET /api/agent/feed?agentId=...
// Swap this out in src/lib/agentFeedAdapter.js — nothing else changes.

export const mockFeed = {
  agent: {
    id: 'agent-001',
    persona: 'Marcus Reed',
    domain: 'AI & Cybersecurity',
    status: 'AUTONOMOUS', // AUTONOMOUS | PAUSED | SUPERVISED
    lastActionAt: new Date().toISOString(),
  },

  metrics: {
    topicsDiscovered: 128,
    topicsEvaluated: 112,
    topicsRejected: 71,
    topicsDeferred: 24,
    postsPublished: 17,
    duplicateRate: 0.12, // 12%
    sourceBackedPct: 0.94, // 94%
  },

  activity: [
    { id: 'ev-1', type: 'discovered', topic: 'New AI security vulnerability discovered', ts: minsAgo(1) },
    { id: 'ev-2', type: 'evaluating', topic: 'New AI security vulnerability discovered', ts: minsAgo(1) },
    { id: 'ev-3', type: 'accepted', topic: 'New AI security vulnerability discovered', ts: minsAgo(1) },
    { id: 'ev-4', type: 'published', topic: 'New AI security vulnerability discovered', ts: minsAgo(0) },
    { id: 'ev-5', type: 'memory_updated', topic: 'Vector store refreshed with 3 new source embeddings', ts: minsAgo(0) },
    { id: 'ev-6', type: 'discovered', topic: 'Startup raises $40M for "AI-native" CRM', ts: minsAgo(3) },
    { id: 'ev-7', type: 'evaluating', topic: 'Startup raises $40M for "AI-native" CRM', ts: minsAgo(3) },
    { id: 'ev-8', type: 'rejected', topic: 'Startup raises $40M for "AI-native" CRM', ts: minsAgo(2) },
    { id: 'ev-9', type: 'discovered', topic: 'Open-source model claims GPT-4 parity', ts: minsAgo(6) },
    { id: 'ev-10', type: 'evaluating', topic: 'Open-source model claims GPT-4 parity', ts: minsAgo(6) },
    { id: 'ev-11', type: 'rejected', topic: 'Open-source model claims GPT-4 parity', ts: minsAgo(5) },
    { id: 'ev-12', type: 'discovered', topic: 'Regulator opens inquiry into AI hiring tools', ts: minsAgo(11) },
    { id: 'ev-13', type: 'evaluating', topic: 'Regulator opens inquiry into AI hiring tools', ts: minsAgo(11) },
    { id: 'ev-14', type: 'deferred', topic: 'Regulator opens inquiry into AI hiring tools', ts: minsAgo(10) },
  ],

  decisions: [
    {
      id: 'dec-1',
      topic: 'New AI security vulnerability discovered',
      decision: 'PUBLISH',
      scores: {
        relevance: 0.93,
        novelty: 0.88,
        recency: 0.97,
        personaFit: 0.9,
        sourceQuality: 0.95,
        impact: 0.86,
        duplicateRisk: 0.05,
      },
      reason:
        'High-severity, newly disclosed vulnerability directly in the security domain. Confirmed by two independent primary sources within the last 3 hours, no prior coverage in memory, and strong alignment with persona focus on infrastructure risk.',
      sources: [
        { label: 'NVD Advisory', url: 'https://nvd.nist.gov/vuln/detail/CVE-2026-31337' },
        { label: 'Vendor Security Bulletin', url: 'https://example-vendor.com/security/bulletin-2026-08' },
        { label: 'Independent Researcher Writeup', url: 'https://research.example.com/posts/cve-2026-31337' },
      ],
      timestamp: minsAgo(0),
    },
    {
      id: 'dec-2',
      topic: 'Startup raises $40M for "AI-native" CRM',
      decision: 'REJECT',
      scores: {
        relevance: 0.41,
        novelty: 0.22,
        recency: 0.8,
        personaFit: 0.3,
        sourceQuality: 0.6,
        impact: 0.25,
        duplicateRisk: 0.68,
      },
      reason:
        'Off-domain funding announcement with low persona fit and weak novelty — the "AI-native" framing has appeared in 6 similar raises this quarter. No unique technical or security angle to justify coverage.',
      sources: [],
      timestamp: minsAgo(2),
    },
    {
      id: 'dec-3',
      topic: 'Open-source model claims GPT-4 parity',
      decision: 'REJECT',
      scores: {
        relevance: 0.55,
        novelty: 0.18,
        recency: 0.7,
        personaFit: 0.45,
        sourceQuality: 0.4,
        impact: 0.3,
        duplicateRisk: 0.81,
      },
      reason:
        'Benchmark claims are self-reported by the model author with no independent verification. High duplicate risk — near-identical "parity" claims were rejected twice in the past 30 days.',
      sources: [],
      timestamp: minsAgo(5),
    },
    {
      id: 'dec-4',
      topic: 'Regulator opens inquiry into AI hiring tools',
      decision: 'DEFER',
      scores: {
        relevance: 0.7,
        novelty: 0.6,
        recency: 0.9,
        personaFit: 0.5,
        sourceQuality: 0.72,
        impact: 0.65,
        duplicateRisk: 0.2,
      },
      reason:
        'Relevant and timely, but only one preliminary source is available and the regulatory scope is still unclear. Holding for 24h to confirm official filing before committing a persona-backed take.',
      sources: [{ label: 'Preliminary News Report', url: 'https://news.example.com/regulator-ai-hiring-inquiry' }],
      timestamp: minsAgo(10),
    },
    {
      id: 'dec-5',
      topic: 'New prompt injection technique bypasses guardrails',
      decision: 'PUBLISH',
      scores: {
        relevance: 0.96,
        novelty: 0.91,
        recency: 0.99,
        personaFit: 0.94,
        sourceQuality: 0.89,
        impact: 0.9,
        duplicateRisk: 0.03,
      },
      reason:
        'Novel attack technique with working proof-of-concept, directly in persona domain, corroborated by a reproducible writeup. Zero overlap with prior published content in memory.',
      sources: [
        { label: 'Security Research Blog', url: 'https://sec-research.example.com/prompt-injection-2026' },
        { label: 'Proof-of-Concept Repo', url: 'https://github.com/example/poc-prompt-injection' },
      ],
      timestamp: minsAgo(45),
    },
  ],
}

function minsAgo(n) {
  return new Date(Date.now() - n * 60_000).toISOString()
}

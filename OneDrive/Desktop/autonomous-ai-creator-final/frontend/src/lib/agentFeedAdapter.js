import { mockFeed } from '../data/mockFeed.js'

const USE_MOCK = false

export async function initAgent(persona = {
  name: 'Sentinel',
  domain: 'AI Security',
  interests: ['vulnerability', 'exploit', 'breach', 'patch', 'security flaw'],
  principles: [
    'Verify claims against primary sources before publishing',
    'Prioritize reader safety and accuracy over speed',
  ],
  writing_style: 'concise and analytical',
  tone: 'measured and authoritative',
  topics_to_avoid: ['celebrity gossip', 'unrelated lifestyle news'],
}) {
  const res = await fetch('/api/agent/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona }),
  })
  if (!res.ok) throw new Error(`Agent initialization failed: ${res.status}`)
  return res.json()
}

export async function getAgentFeed(agentId) {
  if (USE_MOCK) return new Promise(r => setTimeout(() => r(mockFeed), 250))
  const res = await fetch(`/api/agent/feed?agentId=${encodeURIComponent(agentId)}`)
  if (!res.ok) throw new Error(`Agent feed request failed: ${res.status} ${res.statusText}`)
  return res.json()
}

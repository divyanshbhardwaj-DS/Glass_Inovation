import { useEffect, useRef, useState } from 'react'
import { getAgentFeed, initAgent } from '../lib/agentFeedAdapter.js'

const POLL_INTERVAL_MS = 3000

export function useAgentFeed() {
  const [agentId, setAgentId] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function start() {
      try {
        const stored = sessionStorage.getItem('editorialAgentId')
        const id = stored || (await initAgent()).agentId
        sessionStorage.setItem('editorialAgentId', id)
        if (!cancelled) setAgentId(id)
      } catch (err) {
        if (!cancelled) { setError(err); setLoading(false) }
      }
    }
    start()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!agentId) return
    let cancelled = false
    async function load(initial=false) {
      try {
        if (initial) setLoading(true)
        const feed = await getAgentFeed(agentId)
        if (!cancelled) { setData(feed); setError(null) }
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled && initial) setLoading(false)
      }
    }
    load(true)
    timerRef.current = setInterval(() => load(false), POLL_INTERVAL_MS)
    return () => { cancelled=true; clearInterval(timerRef.current) }
  }, [agentId])

  return { data, loading, error, agentId }
}

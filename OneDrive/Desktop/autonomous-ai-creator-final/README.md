# Autonomous AI Editorial Agent

24-hour hackathon MVP. The agent independently discovers candidate topics,
evaluates them against a persistent editorial persona, decides to
**publish / reject / defer**, generates a source-grounded post only for
accepted topics, and remembers every decision so future cycles don't
re-cover the same ground. It is deliberately **not** `RSS → LLM → auto-post`
— rejection and deferral are first-class, visible outcomes.

## Architecture

React/Vite "Decision Room" dashboard → FastAPI → SQLite memory → autonomous
editorial loop.

```
DISCOVER → NORMALIZE → EVALUATE → DUPLICATE CHECK → DECIDE
  ├── REJECT
  ├── DEFER
  └── PUBLISH → GENERATE → VERIFY SOURCES → PERSIST → FEED → MEMORY → REPEAT
```

- **Discovery** (`app/services/autonomous.py`): tries a set of AI-industry
  RSS feeds; any single feed failure is isolated and logged, never crashes
  the cycle. If no live source returns anything, it falls back to
  deterministic local demo data (`data/demo_sources.json`) so the app and
  demo always work, even fully offline.
- **Editorial evaluator** (`app/agent/evaluator.py`): a transparent,
  deterministic 0–1 scoring model (displayed in the UI as 0–100) over
  relevance, novelty, recency, persona fit, source quality, impact and
  duplicate risk. No randomness, no keyword-matching-only shortcuts, and no
  fixed publish quota — the decision emerges from the scores. Persona
  `topics_to_avoid` is a hard guardrail that rejects regardless of other
  scores; persona `interests` boost relevance/persona-fit.
- **Duplicate detection** (`app/storage/database.py::find_duplicate_topic`):
  exact-title and Jaccard token-similarity matching against every
  previously seen topic for the agent. A duplicate match is stored
  (`editorial_topics.duplicate_of`) and named in the decision rationale —
  "why was this rejected" always points at the specific prior topic.
- **Generation** (`app/agent/writer.py`): only runs after a topic is
  accepted, never before. Fully deterministic local fallback (no LLM
  dependency, so the demo works with zero API keys); persona tone, writing
  style and principles shape the generated text.
- **Memory** (`app/storage/database.py`): SQLite tables for agents
  (including full persona config), topics, sources, editorial decisions +
  scores + rationale, published posts, and an activity/event log. Survives
  restart. A topic re-seen in a later cycle is recognized via memory and
  rejected as a duplicate instead of being re-evaluated fresh.
- **Autonomous loop** (`app/services/autonomous.py::autonomous_cycle`):
  runs every `CYCLE_INTERVAL_SECONDS` (default 10s) with no human prompt
  required. Each candidate is processed in a `try/except` so one malformed
  item can't abort the rest of the batch, and the whole cycle is wrapped so
  a crash in one cycle doesn't stop the next.

## Persona

`POST /api/agent/init` accepts a full editorial persona, persisted in
SQLite and used directly during evaluation and generation — not just
displayed in the UI:

```json
{
  "persona": {
    "name": "Sentinel",
    "domain": "AI Security",
    "interests": ["vulnerability", "exploit", "breach", "patch"],
    "principles": ["Verify claims against primary sources before publishing"],
    "writing_style": "concise and analytical",
    "tone": "measured and authoritative",
    "topics_to_avoid": ["celebrity gossip"]
  }
}
```

## API

- `POST /api/agent/init` — creates an agent with a persona and starts its
  autonomous loop.
- `GET /api/agent/feed?agentId=<id>` — returns
  `{ agent, metrics, activity, decisions, posts }` with newest-first
  ordering and UTC ISO timestamps. `agent.nextCycleAt` and
  `agent.lastActionAt` back the "Agent Status" panel; each decision's
  `duplicateOf` (when present) names the prior topic that caused a
  duplicate rejection.
- `GET /health` — liveness check.

## Backend

```powershell
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload --port 4000
```

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The first dashboard load initializes an agent
with a default AI-security persona. The backend then discovers live RSS
topics when available and falls back to deterministic demo data when live
sources fail.

The dashboard has two tabs: **Decision Room** (every evaluated topic, every
score, filterable by Publish/Reject/Defer — reject and defer decisions are
shown with equal visual weight to publish, so it's obvious the agent does
not publish everything) and **Published Feed** (only accepted topics, with
full generated text, rationale, and source links).

## Environment variables

Copy `.env.example` to `.env`. Everything is optional — the app runs fully
deterministically with local demo data if nothing is set.

| Variable | Default | Purpose |
|---|---|---|
| `CYCLE_INTERVAL_SECONDS` | `10` | Seconds between autonomous cycles |
| `MAX_CANDIDATES_PER_CYCLE` | `12` | Candidates evaluated per cycle |
| `DUPLICATE_SIMILARITY_THRESHOLD` | `0.80` | Jaccard title-similarity threshold for duplicate detection |
| `ANTHROPIC_API_KEY` | unset | Not required; reserved seam for a future real LLM writer. Generation always has a deterministic local fallback. |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |

## Demo mode

`data/demo_sources.json` contains seven deterministic scenarios exercising
every required decision path, evaluated against the default "Sentinel /
AI Security" persona sent by the frontend on first load:

| Scenario | Expected verdict |
|---|---|
| Highly relevant + recent | PUBLISH |
| Irrelevant (off-domain) | REJECT |
| Duplicate of an already-seen topic | REJECT |
| Borderline (weaker source/impact) | DEFER |
| High-impact | PUBLISH |
| Low-quality source | REJECT |
| Breaking/current | PUBLISH |

Demo data is only used as a fallback when live RSS sources are unreachable
(e.g. this offline sandbox) or return nothing — it flows through the exact
same pipeline as live data, never a separate mocked path. (The frontend
also ships `src/data/mockFeed.js` purely as a shape reference for the
`GET /feed` response; it is not wired in — `USE_MOCK` is `false`.)

## Testing

```powershell
py -m pytest tests/ -v
```

Covers: database persistence and restart survival, topic creation,
editorial decision persistence, duplicate detection (exact + fuzzy +
`duplicate_of` linkage), persona persistence and its effect on decisions
(`topics_to_avoid` guardrail, `interests` boosting relevance), all three
publish/reject/defer paths, published-post persistence, feed ordering, a
single failing RSS source not crashing discovery, and a full autonomous
cycle processing every discovered candidate deterministically (including
across repeated cycles, where memory causes previously-seen topics to be
rejected as duplicates).

## How editorial decisions work

Every topic gets seven 0–1 scores (relevance, novelty, recency, persona
fit, source quality, impact, duplicate risk) computed deterministically
from the candidate + persona + duplicate lookup — never randomly. Decision
thresholds: a persona `topics_to_avoid` match or a duplicate match forces
REJECT; source quality below 0.35 or relevance below 0.45 forces REJECT;
source quality below 0.60 or impact below 0.40 (and otherwise passing)
forces DEFER; everything else PUBLISHes. High rejection rates are expected
and correct — the point is that the agent explains every "no," not that it
publishes everything it finds.

## Known limitations (MVP scope)

- Generation is deterministic/local only; no live LLM call is wired in
  (by design, so the demo needs zero API keys — see `ANTHROPIC_API_KEY`
  above for the reserved seam).
- Duplicate detection is title-similarity based (exact + Jaccard token
  overlap), not semantic/embedding-based — sufficient for the MVP demo
  scope but simpler than a production system.

from __future__ import annotations
import asyncio, json
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
from app.agent.discovery import CandidateItem
from app.agent.evaluator import EditorialEvaluator, Verdict
from app.agent.persona import Persona
from app.agent.writer import write_post
from app.config import settings
from app.models.schemas import EditorialDecisionRecord, SourceRecord
from app.storage.database import database, utc_now

RSS_FEEDS = [
    ("OpenAI News", "https://openai.com/news/rss.xml"),
    ("Anthropic News", "https://www.anthropic.com/rss.xml"),
    ("DeepMind Blog", "https://deepmind.google/blog/rss.xml"),
    ("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/"),
]
DEMO_FILE = Path(__file__).resolve().parents[2] / "data" / "demo_sources.json"


def _recent(pub_date: str | None) -> bool:
    """An item counts as current if it has no date (assume fresh) or is <14 days old."""
    if not pub_date:
        return True
    try:
        dt = parsedate_to_datetime(pub_date)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - dt).days <= 14
    except (TypeError, ValueError):
        return True


def fetch_feed(label: str, url: str):
    """Fetch and normalize one RSS source. Any failure here is isolated —
    it returns an empty list instead of raising, so one broken source
    can never take down the discovery step or the autonomous loop."""
    try:
        req = Request(url, headers={"User-Agent": "AutonomousAI-Creator/1.0"})
        with urlopen(req, timeout=6) as response:
            root = ET.fromstring(response.read())
        result = []
        for item in root.findall(".//item")[:10]:
            title = item.findtext("title")
            link = item.findtext("link")
            desc = item.findtext("description") or ""
            pub = item.findtext("pubDate")
            if title and link:
                result.append(CandidateItem(
                    title=title.strip(), url=link.strip(), summary=desc.strip(),
                    source_quality=0.82, impact=0.65, current=_recent(pub),
                    source=label, published_at=pub,
                ))
        return result
    except Exception as exc:
        print(f"[discovery] RSS source '{label}' unavailable, skipping: {exc}")
        return []


def demo_candidates():
    try:
        data = json.loads(DEMO_FILE.read_text(encoding="utf-8"))
        return [
            CandidateItem(
                title=x["title"], url=x["url"], summary=x["description"],
                source_quality=x.get("source_quality", 0.7), impact=x.get("impact", 0.5),
                current=x.get("current", True), source="demo-fallback",
            )
            for x in data
        ]
    except Exception as exc:
        print(f"[discovery] demo fallback data unavailable: {exc}")
        return []


def discover(persona: Persona):
    """Discover candidate topics. Live RSS sources are tried first; each
    source failure is isolated (see fetch_feed). If no live source yields
    anything, fall back to deterministic local demo data so the agent and
    demo always keep working."""
    live = []
    for label, url in RSS_FEEDS:
        live.extend(fetch_feed(label, url))
    return live or demo_candidates()


async def run_cycle(agent_id: str):
    row = database.get_agent(agent_id)
    if not row:
        return
    persona = database.get_persona(agent_id) or Persona(row["name"], row["domain"])

    try:
        candidates = discover(persona)
    except Exception as exc:
        # Discovery itself must never kill the loop.
        print(f"[cycle] discovery failed entirely, skipping cycle: {exc}")
        candidates = []
    if not candidates:
        return

    evaluator = EditorialEvaluator()
    for item in candidates[: settings.max_candidates_per_cycle]:
        try:
            duplicate = database.find_duplicate_topic(
                agent_id, item.title, threshold=settings.duplicate_similarity_threshold
            )
            topic = database.create_topic(
                agent_id, item.title, item.summary, item.url,
                duplicate_of=duplicate.id if duplicate else None,
            )
            database.add_activity(agent_id, "discovered", item.title)
            database.add_activity(agent_id, "evaluating", item.title)

            evaluation = evaluator.evaluate(item, persona, duplicate)
            database.save_source(SourceRecord(
                id=f"src-{topic.id}", topic_id=topic.id, url=item.url, label=item.source,
                quality=item.source_quality, discovered_at=utc_now()))
            decision = EditorialDecisionRecord(
                id=f"dec-{topic.id}", agent_id=agent_id, topic_id=topic.id,
                decision=evaluation.verdict.value, rationale=evaluation.rationale,
                scores=evaluation.scores, created_at=utc_now())
            database.save_decision(decision)
            database.add_activity(
                agent_id,
                "accepted" if evaluation.verdict is Verdict.PUBLISH else evaluation.verdict.value.lower(),
                item.title,
            )

            if evaluation.verdict is Verdict.PUBLISH:
                post = write_post(item, evaluation, persona)
                database.save_post(agent_id, post, topic.id)
                database.add_activity(agent_id, "published", item.title)
                database.add_activity(agent_id, "memory_updated", item.title)
        except Exception as exc:
            # One malformed candidate must never abort the rest of the cycle.
            print(f"[cycle] failed to process candidate '{getattr(item, 'title', '?')}': {exc}")
            continue


async def autonomous_cycle(agent_id: str):
    """Run one editorial cycle every CYCLE_INTERVAL_SECONDS until the agent is paused."""
    while True:
        row = database.get_agent(agent_id)
        if not row or not row["active"]:
            return
        try:
            await run_cycle(agent_id)
        except Exception as exc:
            print(f"[cycle] autonomous cycle error (recovering): {exc}")
        await asyncio.sleep(settings.cycle_interval_seconds)

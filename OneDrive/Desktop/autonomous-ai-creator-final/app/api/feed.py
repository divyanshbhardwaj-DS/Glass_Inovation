from datetime import timedelta
from fastapi import APIRouter, HTTPException
from app.config import settings
from app.storage.database import database, _dt

router = APIRouter(prefix="/api/agent", tags=["agent"])


def iso(dt):
    return dt.isoformat().replace("+00:00", "Z")


def build_feed(agent_id: str):
    agent = database.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    persona = database.get_persona(agent_id)
    decisions = database.list_decisions(agent_id)
    posts = database.list_posts(agent_id)
    topics = {t.id: t for t in database.list_topics(agent_id, 500)}
    activities = database.list_activity(agent_id)

    decision_items = []
    for d in decisions:
        topic = topics.get(d.topic_id)
        sources = database.list_sources(d.topic_id)
        matched_topic = topics.get(topic.duplicate_of) if topic and topic.duplicate_of else None
        decision_items.append({
            "id": d.id,
            "topic": topic.title if topic else d.topic_id,
            "decision": d.decision,
            "scores": d.scores,
            "reason": d.rationale,
            "sources": [{"label": s.label or "Source", "url": s.url} for s in sources],
            "timestamp": iso(d.created_at),
            "duplicateOf": {"topicId": matched_topic.id, "title": matched_topic.title} if matched_topic else None,
        })

    post_items = [{"id": p.id, "createdAt": iso(p.created_at), "text": p.text,
                   "rationale": p.rationale, "sources": p.sources} for p in posts]

    total = len(decisions)
    published = sum(d.decision == "PUBLISH" for d in decisions)
    rejected = sum(d.decision == "REJECT" for d in decisions)
    deferred = sum(d.decision == "DEFER" for d in decisions)
    duplicate_count = sum(1 for d in decisions if d.scores.get("duplicateRisk", 0) >= .8)
    source_backed = sum(1 for d in decisions if database.list_sources(d.topic_id))

    last_ts = activities[0]["ts"] if activities else agent["created_at"]
    next_cycle_at = None
    if agent["active"]:
        try:
            next_cycle_at = iso(_dt(last_ts) + timedelta(seconds=settings.cycle_interval_seconds))
        except (ValueError, TypeError):
            next_cycle_at = None

    return {
        "agent": {
            "id": agent["id"], "persona": agent["name"], "domain": agent["domain"],
            "status": "AUTONOMOUS" if agent["active"] else "PAUSED",
            "lastActionAt": last_ts, "nextCycleAt": next_cycle_at,
            "interests": list(persona.interests) if persona else [],
            "tone": persona.tone if persona else "",
            "topicsToAvoid": list(persona.topics_to_avoid) if persona else [],
        },
        "metrics": {
            "topicsDiscovered": len(database.list_topics(agent_id, 10000)),
            "topicsEvaluated": total, "topicsRejected": rejected, "topicsDeferred": deferred,
            "postsPublished": published,
            "duplicateRate": duplicate_count / total if total else 0,
            "sourceBackedPct": source_backed / total if total else 0,
        },
        "activity": activities,
        "decisions": decision_items,
        "posts": post_items,
    }


@router.get("/feed")
def get_feed(agentId: str):
    return build_feed(agentId)

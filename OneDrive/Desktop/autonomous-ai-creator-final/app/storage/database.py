"""SQLite memory/persistence for agents, topics, decisions, sources and posts."""
from __future__ import annotations
import json, re, sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4
from app.models.schemas import (
    AgentInitRequest, EditorialDecisionRecord, MemoryRecord, Post,
    SourceRecord, TopicRecord,
)

DB_FILE = Path(__file__).resolve().parents[2] / "autonomous_ai.db"

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def _iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()

def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))

def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", text.lower())).strip()

def _tokens(text: str) -> set[str]:
    return {x for x in _normalize(text).split() if len(x) > 2}

class Database:
    def __init__(self, path: str | Path = DB_FILE):
        self.path = Path(path)
        if str(self.path) != ":memory:":
            self.path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def connect(self):
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def init_db(self):
        with self.connect() as conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS agents(
              id TEXT PRIMARY KEY, name TEXT NOT NULL, domain TEXT NOT NULL,
              created_at TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
              persona_json TEXT NOT NULL DEFAULT '{}'
            );
            CREATE TABLE IF NOT EXISTS posts(
              id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, topic_id TEXT,
              created_at TEXT NOT NULL, text TEXT NOT NULL, rationale TEXT NOT NULL,
              sources TEXT NOT NULL DEFAULT '[]',
              FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS editorial_topics(
              id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, title TEXT NOT NULL,
              normalized_title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
              url TEXT, discovered_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DISCOVERED',
              duplicate_of TEXT,
              FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_topics_agent ON editorial_topics(agent_id, discovered_at DESC);
            CREATE INDEX IF NOT EXISTS idx_topics_norm ON editorial_topics(agent_id, normalized_title);
            CREATE TABLE IF NOT EXISTS editorial_decisions(
              id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, topic_id TEXT NOT NULL,
              decision TEXT NOT NULL CHECK(decision IN ('PUBLISH','REJECT','DEFER')),
              rationale TEXT NOT NULL, scores_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL,
              FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE,
              FOREIGN KEY(topic_id) REFERENCES editorial_topics(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_decisions_agent ON editorial_decisions(agent_id, created_at DESC);
            CREATE TABLE IF NOT EXISTS editorial_sources(
              id TEXT PRIMARY KEY, topic_id TEXT NOT NULL, url TEXT NOT NULL,
              label TEXT, quality REAL, discovered_at TEXT NOT NULL,
              FOREIGN KEY(topic_id) REFERENCES editorial_topics(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS activity_events(
              id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, type TEXT NOT NULL,
              topic TEXT NOT NULL, ts TEXT NOT NULL,
              FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );
            """)
            self._migrate(conn)

    @staticmethod
    def _migrate(conn):
        """Idempotently add columns introduced after the initial schema so
        existing on-disk databases upgrade in place instead of breaking."""
        migrations = {
            "agents": [("persona_json", "TEXT NOT NULL DEFAULT '{}'")],
            "editorial_topics": [("duplicate_of", "TEXT")],
        }
        for table, columns in migrations.items():
            existing = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
            for name, ddl_type in columns:
                if name not in existing:
                    conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {ddl_type}")

    # ---- agents ----
    def create_agent(self, name: str, domain: str, persona_extra: dict | None = None) -> str:
        agent_id = str(uuid4())
        with self.connect() as conn:
            conn.execute("INSERT INTO agents(id,name,domain,created_at,active,persona_json) VALUES (?,?,?,?,1,?)",
                         (agent_id, name, domain, _iso(utc_now()), json.dumps(persona_extra or {})))
        return agent_id

    def get_agent(self, agent_id: str):
        with self.connect() as conn:
            return conn.execute("SELECT * FROM agents WHERE id=?", (agent_id,)).fetchone()

    def get_persona(self, agent_id: str):
        """Build a full Persona (name/domain + editorial config) from a stored agent row."""
        from app.agent.persona import Persona  # local import avoids a cycle at module load

        row = self.get_agent(agent_id)
        if not row:
            return None
        extra = {}
        try:
            extra = json.loads(row["persona_json"] or "{}")
        except (json.JSONDecodeError, TypeError):
            extra = {}
        return Persona(
            name=row["name"],
            domain=row["domain"],
            interests=tuple(extra.get("interests", [])),
            principles=tuple(extra.get("principles", [])),
            writing_style=extra.get("writing_style", ""),
            tone=extra.get("tone", ""),
            topics_to_avoid=tuple(extra.get("topics_to_avoid", [])),
        )

    def list_agents(self):
        with self.connect() as conn:
            return conn.execute("SELECT * FROM agents ORDER BY created_at DESC").fetchall()

    # ---- topics ----
    def save_topic(self, topic: TopicRecord):
        with self.connect() as conn:
            conn.execute("""INSERT OR REPLACE INTO editorial_topics
              (id,agent_id,title,normalized_title,description,url,discovered_at,status,duplicate_of)
              VALUES (?,?,?,?,?,?,?,?,?)""",
              (topic.id, topic.agent_id, topic.title, _normalize(topic.title),
               topic.description, topic.url, _iso(topic.discovered_at), topic.status,
               topic.duplicate_of))
        return topic

    def create_topic(self, agent_id, title, description="", url=None, status="DISCOVERED", duplicate_of=None):
        # Keep the low-level memory API usable in isolated tests and scripts:
        # if a caller supplies an agent id directly, create a minimal placeholder.
        if self.get_agent(agent_id) is None:
            with self.connect() as conn:
                conn.execute(
                    "INSERT INTO agents(id,name,domain,created_at,active,persona_json) VALUES (?,?,?,?,1,'{}')",
                    (agent_id, "Unknown Agent", "General", _iso(utc_now())),
                )
        return self.save_topic(TopicRecord(
            id=str(uuid4()), agent_id=agent_id, title=title, description=description,
            url=url, discovered_at=utc_now(), status=status, duplicate_of=duplicate_of))

    def find_duplicate_topic(self, agent_id, title, threshold=0.80):
        norm = _normalize(title)
        if not norm: return None
        with self.connect() as conn:
            exact = conn.execute("""SELECT * FROM editorial_topics
              WHERE agent_id=? AND normalized_title=? ORDER BY discovered_at DESC LIMIT 1""",
              (agent_id, norm)).fetchone()
            if exact: return self._topic(exact)
            rows = conn.execute("SELECT * FROM editorial_topics WHERE agent_id=?",
                                (agent_id,)).fetchall()
        incoming = _tokens(title)
        if not incoming: return None
        for row in rows:
            existing = _tokens(row["title"])
            if existing and len(incoming & existing)/len(incoming | existing) >= threshold:
                return self._topic(row)
        return None

    @staticmethod
    def _topic(row):
        keys = row.keys()
        return TopicRecord(id=row["id"], agent_id=row["agent_id"], title=row["title"],
            description=row["description"], url=row["url"],
            discovered_at=_dt(row["discovered_at"]), status=row["status"],
            duplicate_of=row["duplicate_of"] if "duplicate_of" in keys else None)

    def list_topics(self, agent_id, limit=200):
        with self.connect() as conn:
            rows=conn.execute("SELECT * FROM editorial_topics WHERE agent_id=? ORDER BY discovered_at DESC LIMIT ?",
                               (agent_id,limit)).fetchall()
        return [self._topic(r) for r in rows]

    # ---- sources ----
    def save_source(self, source: SourceRecord):
        with self.connect() as conn:
            conn.execute("""INSERT OR REPLACE INTO editorial_sources
              (id,topic_id,url,label,quality,discovered_at) VALUES (?,?,?,?,?,?)""",
              (source.id,source.topic_id,source.url,source.label,source.quality,_iso(source.discovered_at)))
        return source

    def list_sources(self, topic_id):
        with self.connect() as conn:
            rows=conn.execute("SELECT * FROM editorial_sources WHERE topic_id=? ORDER BY discovered_at",
                               (topic_id,)).fetchall()
        return [SourceRecord(id=r["id"],topic_id=r["topic_id"],url=r["url"],label=r["label"],
            quality=r["quality"],discovered_at=_dt(r["discovered_at"])) for r in rows]

    # ---- decisions ----
    def save_decision(self, decision: EditorialDecisionRecord):
        with self.connect() as conn:
            conn.execute("""INSERT OR REPLACE INTO editorial_decisions
              (id,agent_id,topic_id,decision,rationale,scores_json,created_at)
              VALUES (?,?,?,?,?,?,?)""",
              (decision.id,decision.agent_id,decision.topic_id,decision.decision,
               decision.rationale,json.dumps(decision.scores),_iso(decision.created_at)))
        return decision

    def list_decisions(self, agent_id, limit=200):
        with self.connect() as conn:
            rows=conn.execute("""SELECT * FROM editorial_decisions
              WHERE agent_id=? ORDER BY created_at DESC LIMIT ?""",(agent_id,limit)).fetchall()
        return [EditorialDecisionRecord(id=r["id"],agent_id=r["agent_id"],topic_id=r["topic_id"],
            decision=r["decision"],rationale=r["rationale"],scores=json.loads(r["scores_json"]),
            created_at=_dt(r["created_at"])) for r in rows]

    # ---- posts ----
    def save_post(self, agent_id, post: Post, topic_id=None):
        with self.connect() as conn:
            conn.execute("""INSERT OR REPLACE INTO posts
              (id,agent_id,topic_id,created_at,text,rationale,sources)
              VALUES (?,?,?,?,?,?,?)""",
              (post.id,agent_id,topic_id or post.topic_id,_iso(post.created_at),
               post.text,post.rationale,json.dumps(post.sources)))
        return post

    def list_posts(self, agent_id, limit=200):
        with self.connect() as conn:
            rows=conn.execute("SELECT * FROM posts WHERE agent_id=? ORDER BY created_at DESC LIMIT ?",
                              (agent_id,limit)).fetchall()
        return [Post(id=r["id"],created_at=_dt(r["created_at"]),text=r["text"],
            rationale=r["rationale"],sources=json.loads(r["sources"]),topic_id=r["topic_id"]) for r in rows]

    # ---- activity ----
    def add_activity(self, agent_id, event_type, topic, ts=None):
        with self.connect() as conn:
            conn.execute("INSERT INTO activity_events VALUES (?,?,?,?,?)",
                         (str(uuid4()),agent_id,event_type,topic,_iso(ts or utc_now())))

    def list_activity(self, agent_id, limit=200):
        with self.connect() as conn:
            rows=conn.execute("""SELECT id,type,topic,ts FROM activity_events
              WHERE agent_id=? ORDER BY ts DESC LIMIT ?""",(agent_id,limit)).fetchall()
        return [dict(r) for r in rows]

    def get_memory(self, topic_id):
        topic=None
        with self.connect() as conn:
            r=conn.execute("SELECT * FROM editorial_topics WHERE id=?",(topic_id,)).fetchone()
        if not r: return None
        topic=self._topic(r)
        decisions=self.list_decisions(topic.agent_id)
        decision=next((d for d in decisions if d.topic_id==topic_id),None)
        sources=self.list_sources(topic_id)
        with self.connect() as conn:
            r=conn.execute("SELECT id FROM posts WHERE topic_id=? ORDER BY created_at DESC LIMIT 1",(topic_id,)).fetchone()
        return MemoryRecord(topic=topic,decision=decision,sources=sources,
                            published_post_id=r["id"] if r else None)

database = Database()

# Backward-compatible helper names for existing modules.
def get_connection(): return database.connect()
def init_db(): database.init_db()

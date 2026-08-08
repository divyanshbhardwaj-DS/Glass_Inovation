import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from app.models.schemas import EditorialDecisionRecord, SourceRecord
from app.storage.database import Database


class MemoryDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Database(Path(self.tmp.name) / "test.db")

    def tearDown(self):
        self.tmp.cleanup()

    def test_topic_decision_source_and_memory_persist(self):
        topic = self.db.create_topic(
            "agent-1",
            "Critical AI agent security vulnerability discovered",
            "Security incident details",
            "https://example.com/story",
        )
        self.db.save_source(
            SourceRecord(
                id="source-1",
                topic_id=topic.id,
                url="https://example.com/story",
                label="Demo Source",
                quality=0.95,
                discovered_at=datetime.now(timezone.utc),
            )
        )
        self.db.save_decision(
            EditorialDecisionRecord(
                id="decision-1",
                agent_id="agent-1",
                topic_id=topic.id,
                decision="PUBLISH",
                rationale="High impact and strong source quality.",
                scores={"impact": 0.95},
                created_at=datetime.now(timezone.utc),
            )
        )

        reopened = Database(Path(self.tmp.name) / "test.db")
        memory = reopened.get_memory(topic.id)

        self.assertIsNotNone(memory)
        self.assertEqual(memory.topic.title, topic.title)
        self.assertEqual(memory.decision.decision, "PUBLISH")
        self.assertEqual(len(memory.sources), 1)

    def test_duplicate_lookup_exact_and_similar(self):
        topic = self.db.create_topic(
            "agent-1",
            "OpenAI releases security evaluation framework for agents",
        )

        exact = self.db.find_duplicate_topic(
            "agent-1", "OpenAI releases security evaluation framework for agents"
        )
        similar = self.db.find_duplicate_topic(
            "agent-1", "OpenAI releases a security evaluation framework for agents"
        )

        self.assertEqual(exact.id, topic.id)
        self.assertEqual(similar.id, topic.id)

    def test_different_topic_is_not_duplicate(self):
        self.db.create_topic("agent-1", "New compiler optimization released")
        duplicate = self.db.find_duplicate_topic("agent-1", "AI weather forecasting research")
        self.assertIsNone(duplicate)

    def test_persona_persists_and_survives_restart(self):
        agent_id = self.db.create_agent(
            "Sentinel", "AI Security",
            {"interests": ["exploit"], "tone": "measured", "topics_to_avoid": ["celebrity gossip"]},
        )
        reopened = Database(Path(self.tmp.name) / "test.db")
        persona = reopened.get_persona(agent_id)
        self.assertEqual(persona.tone, "measured")
        self.assertIn("exploit", persona.interests)
        self.assertIn("celebrity gossip", persona.topics_to_avoid)

    def test_duplicate_of_is_persisted_on_the_topic(self):
        original = self.db.create_topic("agent-1", "OpenAI releases security evaluation framework for agents")
        dup = self.db.create_topic(
            "agent-1", "OpenAI releases a security evaluation framework for agents",
            duplicate_of=original.id,
        )
        reloaded = [t for t in self.db.list_topics("agent-1") if t.id == dup.id][0]
        self.assertEqual(reloaded.duplicate_of, original.id)


if __name__ == "__main__":
    unittest.main()

import unittest

from app.agent.discovery import CandidateItem
from app.agent.evaluator import EditorialEvaluator, Verdict
from app.agent.persona import Persona
from app.storage.database import Database, TopicRecord
from datetime import datetime, timezone


PERSONA = Persona(
    name="Sentinel",
    domain="AI Security",
    interests=("vulnerability", "exploit", "breach", "patch", "security flaw"),
    topics_to_avoid=("celebrity gossip",),
)


class EvaluatorTests(unittest.TestCase):
    def setUp(self):
        self.evaluator = EditorialEvaluator()

    def _item(self, **overrides):
        base = dict(
            title="Critical vulnerability discovered in widely deployed AI agent tooling",
            url="https://example.com/story",
            summary="Security researchers disclose a high-severity flaw.",
            source_quality=0.9,
            impact=0.9,
            current=True,
        )
        base.update(overrides)
        return CandidateItem(**base)

    def test_relevant_current_well_sourced_publishes(self):
        result = self.evaluator.evaluate(self._item(), PERSONA, duplicate=None)
        self.assertEqual(result.verdict, Verdict.PUBLISH)
        self.assertIn("relevance", result.scores)

    def test_irrelevant_topic_is_rejected(self):
        item = self._item(
            title="Local cafe launches a new weekend breakfast menu",
            summary="A lifestyle update about business hours.",
            impact=0.1,
        )
        result = self.evaluator.evaluate(item, PERSONA, duplicate=None)
        self.assertEqual(result.verdict, Verdict.REJECT)

    def test_weak_source_quality_is_rejected(self):
        item = self._item(source_quality=0.15)
        result = self.evaluator.evaluate(item, PERSONA, duplicate=None)
        self.assertEqual(result.verdict, Verdict.REJECT)

    def test_borderline_topic_is_deferred(self):
        item = self._item(
            title="Report questions security implications of a new AI model update",
            summary="Preliminary, single-source claim.",
            source_quality=0.55,
            impact=0.45,
        )
        result = self.evaluator.evaluate(item, PERSONA, duplicate=None)
        self.assertEqual(result.verdict, Verdict.DEFER)

    def test_duplicate_is_rejected_with_named_match(self):
        prior = TopicRecord(
            id="topic-prior", agent_id="agent-1", title="OpenAI announces new security evaluation framework",
            description="", url=None, discovered_at=datetime.now(timezone.utc), status="PUBLISHED",
        )
        result = self.evaluator.evaluate(self._item(), PERSONA, duplicate=prior)
        self.assertEqual(result.verdict, Verdict.REJECT)
        self.assertIn(prior.title, result.rationale)

    def test_avoided_topic_is_rejected_even_if_high_quality(self):
        item = self._item(title="Celebrity gossip about an AI startup founder")
        result = self.evaluator.evaluate(item, PERSONA, duplicate=None)
        self.assertEqual(result.verdict, Verdict.REJECT)
        self.assertIn("avoid", result.rationale)

    def test_duplicate_lookup_is_available(self):
        db = Database(":memory:")
        self.assertTrue(callable(db.find_duplicate_topic))


if __name__ == "__main__":
    unittest.main()

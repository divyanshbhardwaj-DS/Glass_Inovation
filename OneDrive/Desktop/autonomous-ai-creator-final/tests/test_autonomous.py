import asyncio
import tempfile
import unittest
from pathlib import Path

from app.storage.database import Database
from app.services import autonomous as auto


class AutonomousCycleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Database(Path(self.tmp.name) / "cycle.db")
        auto.database = self.db
        # No network in test environment (and none required): force the
        # discovery step to fail so it exercises the demo-data fallback,
        # exactly like a real offline run would.
        auto.RSS_FEEDS = [("Broken Source", "http://127.0.0.1:9/does-not-exist")]
        self.agent_id = self.db.create_agent(
            "Sentinel", "AI Security",
            {
                "interests": ["vulnerability", "exploit", "breach", "patch", "security flaw"],
                "topics_to_avoid": ["celebrity gossip"],
            },
        )

    def tearDown(self):
        self.tmp.cleanup()

    def test_one_broken_source_does_not_crash_discovery(self):
        candidates = auto.discover(self.db.get_persona(self.agent_id))
        self.assertTrue(len(candidates) > 0, "expected fallback demo data when RSS is unreachable")

    def test_full_cycle_processes_all_candidates_deterministically(self):
        asyncio.run(auto.run_cycle(self.agent_id))
        topics = self.db.list_topics(self.agent_id)
        decisions = self.db.list_decisions(self.agent_id)
        self.assertEqual(len(topics), 7, "early-return-after-first-publish bug would stop this short")
        self.assertEqual(len(decisions), 7)
        verdicts = {d.decision for d in decisions}
        self.assertEqual(verdicts, {"PUBLISH", "REJECT", "DEFER"})

    def test_memory_causes_repeat_topics_to_be_rejected_next_cycle(self):
        asyncio.run(auto.run_cycle(self.agent_id))
        asyncio.run(auto.run_cycle(self.agent_id))
        decisions = self.db.list_decisions(self.agent_id)
        self.assertEqual(len(decisions), 14)
        most_recent_batch = decisions[:7]
        self.assertTrue(all(d.decision == "REJECT" for d in most_recent_batch))

    def test_missing_agent_does_not_raise(self):
        asyncio.run(auto.run_cycle("no-such-agent"))  # should return quietly


if __name__ == "__main__":
    unittest.main()

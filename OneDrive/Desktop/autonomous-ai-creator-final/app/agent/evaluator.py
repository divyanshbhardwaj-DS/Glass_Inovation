from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from .discovery import CandidateItem
from .persona import Persona


class Verdict(str, Enum):
    PUBLISH = "PUBLISH"
    REJECT = "REJECT"
    DEFER = "DEFER"


@dataclass
class Evaluation:
    verdict: Verdict
    rationale: str
    scores: dict[str, float]


AI_TERMS = ["ai", "agent", "model", "security", "cybersecurity", "llm", "machine learning"]


def _words(text: str) -> list[str]:
    return [w for w in text.lower().replace("-", " ").split() if len(w) > 2]


class EditorialEvaluator:
    """Deterministic, transparent 0-100 (0.0-1.0) editorial scoring engine.

    Combines persona fit (domain / interests / topics-to-avoid), recency,
    source quality, impact and duplicate risk into a single, explainable
    verdict. No randomness; every score and the resulting rationale are
    derived directly from the candidate + persona + duplicate lookup, so
    the same inputs always produce the same decision.
    """

    def evaluate(self, item: CandidateItem, persona: Persona, duplicate=None) -> Evaluation:
        is_duplicate = duplicate is not None
        text = f"{item.title} {item.summary}".lower()

        # --- topics-to-avoid is a hard editorial guardrail, checked first ---
        avoided = next((t for t in persona.topics_to_avoid if t.lower() in text), None)

        domain_words = [w for w in _words(persona.domain) if w not in ("and", "the")]
        domain_hits = sum(w in text for w in domain_words)
        ai_hits = sum(term in text for term in AI_TERMS)
        interest_hits = sum(1 for interest in persona.interests if interest.lower() in text)

        # Base relevance starts low (genuinely off-topic content should
        # score low, not "borderline") and rises with real signal.
        relevance = 0.25 + 0.18 * min(domain_hits, 2) + 0.08 * min(ai_hits, 3) + 0.10 * min(interest_hits, 3)
        relevance = max(0.0, min(1.0, relevance))

        novelty = 0.05 if is_duplicate else 0.88
        recency = 0.95 if item.current else 0.45
        persona_fit = max(0.0, min(1.0, relevance + 0.05 * min(interest_hits, 2)))
        source_quality = max(0.0, min(1.0, item.source_quality))
        impact = max(0.0, min(1.0, item.impact))
        duplicate_risk = 0.95 if is_duplicate else 0.04

        scores = {
            "relevance": round(relevance, 2),
            "novelty": round(novelty, 2),
            "recency": round(recency, 2),
            "personaFit": round(persona_fit, 2),
            "sourceQuality": round(source_quality, 2),
            "impact": round(impact, 2),
            "duplicateRisk": round(duplicate_risk, 2),
        }

        if avoided:
            verdict = Verdict.REJECT
            reason = f"Rejected because the topic touches '{avoided}', which the persona's editorial principles explicitly avoid."
        elif is_duplicate:
            verdict = Verdict.REJECT
            reason = (
                f"Rejected because editorial memory already covers a substantially similar topic: "
                f"\"{duplicate.title}\" (discovered {duplicate.discovered_at.date().isoformat()})."
            )
        elif source_quality < 0.35:
            verdict = Verdict.REJECT
            reason = "Rejected because the source quality is too weak to support publication."
        elif relevance < 0.45:
            verdict = Verdict.REJECT
            reason = f"Rejected because the topic has weak fit with the {persona.domain} persona."
        elif source_quality < 0.60 or impact < 0.40:
            verdict = Verdict.DEFER
            reason = "Deferred because the topic is relevant but currently under-evidenced (weaker source quality or impact) — holding for stronger confirmation."
        else:
            verdict = Verdict.PUBLISH
            reason = "Published because it is relevant to the persona, current, sufficiently sourced, high enough impact, and not duplicated."

        return Evaluation(verdict, reason, scores)


Evaluator = EditorialEvaluator

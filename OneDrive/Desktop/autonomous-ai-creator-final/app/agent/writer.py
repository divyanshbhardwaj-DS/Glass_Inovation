from __future__ import annotations
from datetime import datetime, timezone
from uuid import uuid4
from .discovery import CandidateItem
from .evaluator import Evaluation
from .persona import Persona
from app.models.schemas import Post


def write_post(item: CandidateItem, evaluation: Evaluation, persona: Persona) -> Post:
    """Deterministic local content generation (no external LLM required).

    If ANTHROPIC_API_KEY were provided, this is the seam where a real model
    call would slot in; the fallback below keeps the demo fully functional
    without any external dependency or key.
    """
    tone = persona.tone or "measured and direct"
    style_note = f" Written in a {persona.writing_style} style." if persona.writing_style else ""
    principle = f" Guided by: {persona.principles[0]}." if persona.principles else ""

    text = (
        f"{item.title}\n\n"
        f"My take: this development matters for {persona.domain}. "
        f"The important question is what changes when this moves from a headline "
        f"into real-world systems and workflows.\n\n"
        f"Tone: {tone}.{style_note}{principle}"
    )
    return Post(
        id=str(uuid4()),
        created_at=datetime.now(timezone.utc),
        text=text,
        rationale=evaluation.rationale,
        sources=[item.url] if item.url else [],
    )


class Writer:
    def write(self, item, evaluation, persona):
        return write_post(item, evaluation, persona)

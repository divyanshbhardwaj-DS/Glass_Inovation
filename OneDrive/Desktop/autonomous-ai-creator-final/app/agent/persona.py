from dataclasses import dataclass, field


@dataclass(frozen=True)
class Persona:
    """Editorial persona used by the evaluator, writer and duplicate logic.

    Only `name` and `domain` are required; the rest are optional editorial
    configuration that, when supplied, directly influences scoring
    (interests / topics_to_avoid) and generated writing (writing_style /
    tone / principles).
    """

    name: str
    domain: str
    interests: tuple[str, ...] = field(default_factory=tuple)
    principles: tuple[str, ...] = field(default_factory=tuple)
    writing_style: str = ""
    tone: str = ""
    topics_to_avoid: tuple[str, ...] = field(default_factory=tuple)

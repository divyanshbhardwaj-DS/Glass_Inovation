from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional, Protocol
from .persona import Persona


@dataclass
class CandidateItem:
    title: str
    url: str
    summary: str
    source_quality: float = 0.7
    impact: float = 0.5
    current: bool = True
    source: str = "unknown"
    published_at: Optional[str] = None


class DiscoverySource(Protocol):
    def discover(self, persona: Persona) -> List[CandidateItem]: ...

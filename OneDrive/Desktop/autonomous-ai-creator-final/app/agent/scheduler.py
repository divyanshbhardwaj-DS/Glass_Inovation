from typing import Protocol
from .persona import Persona

class Scheduler(Protocol):
    async def run_cycle(self, agent_id: str, persona: Persona) -> None: ...

from datetime import datetime
from pydantic import BaseModel, Field
from .schemas import AgentInitRequest

class Agent(BaseModel):
    id: str
    name: str
    domain: str
    created_at: datetime
    active: bool = True
    published_topics: list[str] = Field(default_factory=list)

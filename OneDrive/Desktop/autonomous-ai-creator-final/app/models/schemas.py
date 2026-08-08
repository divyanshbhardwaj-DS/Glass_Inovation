"""Shared API and persistence schemas for the autonomous editorial agent."""
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class PersonaConfig(BaseModel):
    name: str
    domain: str
    interests: List[str] = Field(default_factory=list)
    principles: List[str] = Field(default_factory=list)
    writing_style: str = ""
    tone: str = ""
    topics_to_avoid: List[str] = Field(default_factory=list)

class AgentInitRequest(BaseModel):
    persona: PersonaConfig

class AgentInitResponse(BaseModel):
    agentId: str

class Post(BaseModel):
    id: str
    created_at: datetime
    text: str
    rationale: str
    sources: List[str] = Field(default_factory=list)
    topic_id: Optional[str] = None

class TopicRecord(BaseModel):
    id: str
    agent_id: str
    title: str
    description: str = ""
    url: Optional[str] = None
    discovered_at: datetime
    status: str = "DISCOVERED"
    duplicate_of: Optional[str] = None

class EditorialDecisionRecord(BaseModel):
    id: str
    agent_id: str
    topic_id: str
    decision: str = Field(pattern="^(PUBLISH|REJECT|DEFER)$")
    rationale: str
    scores: Dict[str, float] = Field(default_factory=dict)
    created_at: datetime

class SourceRecord(BaseModel):
    id: str
    topic_id: str
    url: str
    label: Optional[str] = None
    quality: Optional[float] = None
    discovered_at: datetime

class MemoryRecord(BaseModel):
    topic: TopicRecord
    decision: Optional[EditorialDecisionRecord] = None
    sources: List[SourceRecord] = Field(default_factory=list)
    published_post_id: Optional[str] = None

class FeedResponse(BaseModel):
    agent: dict
    metrics: dict
    activity: List[dict]
    decisions: List[dict]
    posts: List[dict]

from fastapi import APIRouter
import asyncio
from app.models.schemas import AgentInitRequest, AgentInitResponse
from app.storage.database import database
from app.services.autonomous import autonomous_cycle

router = APIRouter(prefix="/api/agent", tags=["agent"])
_active_tasks = {}


@router.post("/init", response_model=AgentInitResponse)
async def initialize_agent(request: AgentInitRequest):
    persona = request.persona
    persona_extra = {
        "interests": persona.interests,
        "principles": persona.principles,
        "writing_style": persona.writing_style,
        "tone": persona.tone,
        "topics_to_avoid": persona.topics_to_avoid,
    }
    agent_id = database.create_agent(persona.name, persona.domain, persona_extra)
    task = asyncio.create_task(autonomous_cycle(agent_id))
    _active_tasks[agent_id] = task
    return AgentInitResponse(agentId=agent_id)

from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.init import router as init_router, _active_tasks
from app.api.feed import router as feed_router
from app.storage.database import database
from app.services.autonomous import autonomous_cycle
from app.config import settings

@asynccontextmanager
async def lifespan(app):
    for row in database.list_agents():
        if row["active"]:
            _active_tasks[row["id"]]=asyncio.create_task(autonomous_cycle(row["id"]))
    yield
    for task in _active_tasks.values():
        task.cancel()
    _active_tasks.clear()

app=FastAPI(title="Autonomous AI Editorial Agent",version="2.0.0",lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=settings.cors_origins,
                   allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
app.include_router(init_router)
app.include_router(feed_router)

@app.get("/")
def home(): return {"message":"Autonomous AI Editorial Agent API is running"}

@app.get("/health")
def health(): return {"status":"ok"}

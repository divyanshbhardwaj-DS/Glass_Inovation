"""Compatibility facade. Persistence lives in app.storage.database."""
from app.storage.database import database, get_connection, init_db

agents = {}
posts = {}

def save_agent(agent):
    # New API uses database.create_agent directly.
    return database.get_agent(agent.id)

def save_post(agent_id, post):
    return database.save_post(agent_id, post)

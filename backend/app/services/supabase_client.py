import structlog
from supabase import create_client, Client
from typing import Optional
from ..config import get_settings

logger = structlog.get_logger()

_supabase: Optional[Client] = None

def get_supabase() -> Optional[Client]:
    """Get or initialize the Supabase client."""
    global _supabase
    if _supabase is None:
        settings = get_settings()
        if settings.supabase_url and settings.supabase_key:
            try:
                _supabase = create_client(settings.supabase_url, settings.supabase_key)
                logger.info("supabase_client_initialized")
            except Exception as e:
                logger.error("supabase_init_error", error=str(e))
        else:
            logger.warning("supabase_credentials_missing", msg="Skipping Supabase initialization.")
    return _supabase

def save_concept_graph(topic: str, intent: str, level: str, concepts: list) -> Optional[dict]:
    """Save generated concept graph to Supabase."""
    client = get_supabase()
    if not client:
        return None
    
    try:
        data = {
            "topic": topic,
            "intent": intent,
            "level": level,
            "concepts": concepts
        }
        response = client.table("concept_graphs").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error("supabase_save_graph_error", error=str(e))
        return None

def save_student_profile(name: str, preferences: dict = None) -> Optional[dict]:
    """Save or create a student profile."""
    client = get_supabase()
    if not client:
        return None
        
    try:
        data = {
            "name": name,
            "preferences": preferences or {}
        }
        response = client.table("student_profiles").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error("supabase_save_profile_error", error=str(e))
        return None

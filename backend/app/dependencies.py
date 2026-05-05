from fastapi import Request
from .config import get_settings

def get_config():
    return get_settings()

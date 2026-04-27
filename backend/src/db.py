from supabase import create_client, Client
from .config import settings


def get_supabase() -> Client:
    """Anonymous client (respektiert RLS)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def get_supabase_admin() -> Client:
    """Service-Role-Client (bypassed RLS — nur server-side!)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

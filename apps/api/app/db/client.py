"""
Supabase client initialization for the FastAPI backend.

Two client patterns:
- get_supabase_client(): service role key, bypasses RLS (admin ops, background tasks)
- get_user_client(jwt): user-scoped, respects RLS (all user-initiated operations)
"""

from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return a cached Supabase client using the service role key (bypasses RLS)."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_user_client(user_jwt: str) -> Client:
    """Return a Supabase client scoped to a specific user's JWT (respects RLS)."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in the environment.")
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.auth.set_session(access_token=user_jwt, refresh_token="")
    return client

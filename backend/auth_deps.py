"""
auth_deps.py — Nickname-based auth for Project Evaluator.
Users are identified by X-User-Id header (UUID stored in their localStorage).
No JWT, no Supabase Auth.
"""
from fastapi import Header, HTTPException, status, Depends
from database import get_supabase
from config import settings

def get_current_user(
    x_user_id: str | None = Header(default=None)
) -> dict:
    """Validates the X-User-Id header and returns the user row."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail='Authentication required. Provide X-User-Id header.')
    db = get_supabase()
    result = db.table('users').select('*').eq('id', x_user_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=401, detail='Invalid user ID.')
    # Touch last_active_at
    db.table('users').update({'last_active_at': 'now()'}).eq('id', x_user_id).execute()
    return result.data

def get_current_admin(
    x_user_id: str | None = Header(default=None)
) -> dict:
    """Validates user is in admin_nicknames list."""
    user = get_current_user(x_user_id)
    if user['nickname'].upper() not in [n.upper() for n in settings.admin_nicknames]:
        raise HTTPException(status_code=403, detail='Admin access required.')
    return user

def get_competition_state(db=None) -> dict:
    """Returns current competition state."""
    if db is None:
        db = get_supabase()
    result = db.table('competition_state').select('*').eq('id', 1).single().execute()
    return result.data

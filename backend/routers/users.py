from fastapi import APIRouter, Depends, HTTPException, Request, status
from database import get_supabase
from schemas.users import ClaimNicknameRequest, CheckNicknameRequest
from auth_deps import get_current_user
from limiter import limiter
from datetime import datetime, timezone
import json
import hashlib
import hmac
import secrets

router = APIRouter(prefix="/users", tags=["Users"])


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations and a secure random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"pbkdf2_sha256$100000${salt}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> tuple[bool, bool]:
    """
    Verify password using constant-time comparison.
    Supports both modern salted PBKDF2 and legacy SHA-256 (for auto-upgrade).
    Returns (is_valid, needs_upgrade).
    """
    if not stored_hash:
        return False, False

    if stored_hash.startswith("pbkdf2_sha256$"):
        try:
            parts = stored_hash.split("$")
            if len(parts) != 4:
                return False, False
            iterations = int(parts[1])
            salt = parts[2]
            expected_key = parts[3]
            actual_key = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode('utf-8'),
                salt.encode('utf-8'),
                iterations
            ).hex()
            return hmac.compare_digest(actual_key, expected_key), False
        except Exception:
            return False, False

    # Check legacy SHA-256
    legacy_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    if hmac.compare_digest(legacy_hash, stored_hash):
        return True, True
    return False, False


@router.post("/check")
@limiter.limit("60/minute")
def check_nickname(request: Request, body: CheckNicknameRequest):
    """Check if a nickname already exists and whether it has a password set."""
    db = get_supabase()
    nickname_lower = body.nickname.strip().lower()
    existing = db.table('users').select('*').eq('nickname_lower', nickname_lower).maybe_single().execute()
    if not existing.data:
        return {'exists': False, 'has_password': False, 'nickname': body.nickname.strip()}
    user = existing.data
    return {
        'exists': True,
        'has_password': bool(user.get('password_hash')),
        'nickname': user['nickname']
    }


@router.post("")
@limiter.limit("20/minute")
def claim_nickname(request: Request, body: ClaimNicknameRequest):
    db = get_supabase()
    nickname_lower = body.nickname.strip().lower()

    # If user already exists, log them back into their account
    existing = db.table('users').select('*').eq('nickname_lower', nickname_lower).maybe_single().execute()
    now_iso = datetime.now(timezone.utc).isoformat()

    if existing.data:
        user = existing.data
        stored_hash = user.get('password_hash')

        # If user has a password set, verify it
        if stored_hash:
            if not body.password:
                raise HTTPException(status_code=400, detail="This account is protected by a password. Please enter your password.")
            is_valid, needs_upgrade = verify_password(body.password, stored_hash)
            if not is_valid:
                raise HTTPException(status_code=400, detail="Incorrect password. Please try again.")
            if needs_upgrade:
                new_hash = hash_password(body.password)
                db.table('users').update({'password_hash': new_hash}).eq('id', user['id']).execute()
        elif body.password:
            # Account had no password yet, but user optionally entered one to set it
            new_hash = hash_password(body.password)
            db.table('users').update({'password_hash': new_hash}).eq('id', user['id']).execute()

        try:
            db.table('users').update({'last_active_at': now_iso}).eq('id', user['id']).execute()
        except Exception:
            pass

        return {'id': user['id'], 'nickname': user['nickname'], 'created_at': user['created_at']}

    # Otherwise, create a new user account
    user_data = {
        'nickname': body.nickname.strip(),
        'nickname_lower': nickname_lower,
    }
    if body.password:
        user_data['password_hash'] = hash_password(body.password)

    result = db.table('users').insert(user_data).execute()
    user = result.data[0]

    # Log activity
    db.table('activities').insert({
        'user_id': user['id'],
        'action': 'user_joined',
        'metadata': json.dumps({'nickname': user['nickname']})
    }).execute()

    return {'id': user['id'], 'nickname': user['nickname'], 'created_at': user['created_at']}


@router.get("/{user_id}")
def get_user_profile(user_id: str):
    db = get_supabase()
    user_res = db.table('users').select('*').eq('id', user_id).maybe_single().execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")

    projects_submitted = db.table('projects').select('id', count='exact').eq('creator_id', user_id).execute()
    projects_rated     = db.table('ratings').select('id', count='exact').eq('user_id', user_id).execute()

    user = dict(user_res.data)
    # Strictly strip password_hash to prevent sensitive data leakage
    user.pop('password_hash', None)
    user['projects_submitted'] = projects_submitted.count or 0
    user['projects_rated']     = projects_rated.count or 0
    return user


@router.get("")
def get_people_leaderboard():
    """People leaderboard with badges. Uses batch queries to avoid N+1."""
    db = get_supabase()
    users_res = db.table('users').select('*').execute()
    users = users_res.data

    if not users:
        return []

    # Batch fetch all data in 3 queries
    ratings_res    = db.table('ratings').select('user_id').execute()
    projects_res   = db.table('projects').select('creator_id').execute()
    activities_res = db.table('activities').select('user_id').execute()

    # Aggregate counts by user
    ratings_by_user:    dict[str, int] = {}
    projects_by_user:   dict[str, int] = {}
    activities_by_user: dict[str, int] = {}

    for r in (ratings_res.data or []):
        uid = r['user_id']
        ratings_by_user[uid] = ratings_by_user.get(uid, 0) + 1

    for p in (projects_res.data or []):
        uid = p['creator_id']
        projects_by_user[uid] = projects_by_user.get(uid, 0) + 1

    for a in (activities_res.data or []):
        uid = a.get('user_id')
        if uid:
            activities_by_user[uid] = activities_by_user.get(uid, 0) + 1

    enriched = []
    for user in users:
        u = dict(user)
        # Strictly strip password_hash
        u.pop('password_hash', None)
        uid = u['id']
        u['projects_submitted'] = projects_by_user.get(uid, 0)
        u['projects_rated']     = ratings_by_user.get(uid, 0)
        u['total_ratings']      = ratings_by_user.get(uid, 0)
        u['activity_score']     = activities_by_user.get(uid, 0)
        u['badges']             = []
        enriched.append(u)

    # Assign badges (top performer per category)
    sorted_by_ratings  = sorted(enriched, key=lambda u: u['projects_rated'],     reverse=True)
    sorted_by_projects = sorted(enriched, key=lambda u: u['projects_submitted'],  reverse=True)
    sorted_by_activity = sorted(enriched, key=lambda u: u['activity_score'],      reverse=True)

    if sorted_by_ratings and sorted_by_ratings[0]['projects_rated'] > 0:
        sorted_by_ratings[0]['badges'].append('Most Active Evaluator')

    if sorted_by_projects and sorted_by_projects[0]['projects_submitted'] > 0:
        sorted_by_projects[0]['badges'].append('Idea Creator')

    if sorted_by_activity and sorted_by_activity[0]['activity_score'] > 0:
        sorted_by_activity[0]['badges'].append('Top Contributor')

    # Early Contributor — first user to join
    if enriched:
        earliest = min(enriched, key=lambda u: u.get('created_at') or '9999')
        if 'Early Contributor' not in earliest['badges']:
            earliest['badges'].append('Early Contributor')

    return sorted(enriched, key=lambda u: u['activity_score'], reverse=True)

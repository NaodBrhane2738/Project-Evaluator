from fastapi import APIRouter, Depends, HTTPException, status
from database import get_supabase
from schemas.users import ClaimNicknameRequest, CheckNicknameRequest
from auth_deps import get_current_user
import json
import hashlib

router = APIRouter(prefix="/users", tags=["Users"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


@router.post("/check")
def check_nickname(request: CheckNicknameRequest):
    """Check if a nickname already exists and whether it has a password set."""
    db = get_supabase()
    nickname_lower = request.nickname.strip().lower()
    existing = db.table('users').select('*').eq('nickname_lower', nickname_lower).maybe_single().execute()
    if not existing.data:
        return {'exists': False, 'has_password': False, 'nickname': request.nickname.strip()}
    user = existing.data
    return {
        'exists': True,
        'has_password': bool(user.get('password_hash')),
        'nickname': user['nickname']
    }


@router.post("")
def claim_nickname(request: ClaimNicknameRequest):
    db = get_supabase()
    nickname_lower = request.nickname.strip().lower()

    # If user already exists, log them back into their account
    existing = db.table('users').select('*').eq('nickname_lower', nickname_lower).maybe_single().execute()
    if existing.data:
        user = existing.data
        stored_hash = user.get('password_hash')

        # If user has a password set, verify it
        if stored_hash:
            if not request.password:
                raise HTTPException(status_code=400, detail="This account is protected by a password. Please enter your password.")
            if hash_password(request.password) != stored_hash:
                raise HTTPException(status_code=400, detail="Incorrect password. Please try again.")
        elif request.password:
            # Account had no password yet, but user optionally entered one to set it
            new_hash = hash_password(request.password)
            db.table('users').update({'password_hash': new_hash}).eq('id', user['id']).execute()

        db.table('users').update({'last_active_at': 'now()'}).eq('id', user['id']).execute()
        return {'id': user['id'], 'nickname': user['nickname'], 'created_at': user['created_at']}

    # Otherwise, create a new user account
    user_data = {
        'nickname': request.nickname.strip(),
        'nickname_lower': nickname_lower,
    }
    if request.password:
        user_data['password_hash'] = hash_password(request.password)

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

    user = user_res.data
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
        uid = user['id']
        user['projects_submitted'] = projects_by_user.get(uid, 0)
        user['projects_rated']     = ratings_by_user.get(uid, 0)
        user['total_ratings']      = ratings_by_user.get(uid, 0)
        user['activity_score']     = activities_by_user.get(uid, 0)
        user['badges']             = []
        enriched.append(user)

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
        earliest = min(enriched, key=lambda u: u['created_at'])
        if 'Early Contributor' not in earliest['badges']:
            earliest['badges'].append('Early Contributor')

    return sorted(enriched, key=lambda u: u['activity_score'], reverse=True)

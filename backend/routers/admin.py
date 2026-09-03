from fastapi import APIRouter, Depends
from database import get_supabase
from auth_deps import get_current_admin
from datetime import datetime, timezone
import json

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])

def log_audit(db, admin_id, action, target_type=None, target_id=None, details=None):
    now_iso = datetime.now(timezone.utc).isoformat()
    db.table('admin_audit_log').insert({
        'admin_id': admin_id,
        'action': action,
        'target_type': target_type,
        'target_id': target_id,
        'details': json.dumps(details or {}),
        'created_at': now_iso,
    }).execute()

@router.post("/projects/{id}/hide")
def hide_project(id: str, admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    db.table('projects').update({'hidden': True}).eq('id', id).execute()
    log_audit(db, admin['id'], 'hide_project', 'project', id)
    return {"status": "ok"}

@router.post("/projects/{id}/show")
def show_project(id: str, admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    db.table('projects').update({'hidden': False}).eq('id', id).execute()
    log_audit(db, admin['id'], 'show_project', 'project', id)
    return {"status": "ok"}

@router.delete("/projects/{id}")
def delete_project(id: str, admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    db.table('projects').delete().eq('id', id).execute()
    log_audit(db, admin['id'], 'delete_project', 'project', id)
    return {"status": "ok"}

@router.delete("/ratings/{id}")
def delete_rating(id: str, admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    db.table('ratings').delete().eq('id', id).execute()
    log_audit(db, admin['id'], 'delete_rating', 'rating', id)
    return {"status": "ok"}

@router.post("/competition/lock")
def lock_comp(admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()
    db.table('competition_state').update({
        'status': 'voting_locked',
        'locked_at': now_iso,
        'updated_at': now_iso
    }).eq('id', 1).execute()
    log_audit(db, admin['id'], 'lock_competition')
    return {"status": "locked"}

@router.post("/competition/unlock")
def unlock_comp(admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()
    db.table('competition_state').update({
        'status': 'voting_open',
        'updated_at': now_iso
    }).eq('id', 1).execute()
    log_audit(db, admin['id'], 'unlock_competition')
    return {"status": "unlocked"}

@router.post("/competition/finish")
def finish_comp(admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()
    db.table('competition_state').update({
        'status': 'finished',
        'finished_at': now_iso,
        'updated_at': now_iso
    }).eq('id', 1).execute()
    log_audit(db, admin['id'], 'finish_competition')
    return {"status": "finished"}

@router.get("/audit-log")
def get_audit_log(admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    res = db.table('admin_audit_log').select('*').order('created_at', desc=True).execute()
    logs = res.data or []
    users_data = db.table('users').select('id, nickname').execute().data or []
    users_map = {u['id']: u['nickname'] for u in users_data}
    for log in logs:
        admin_id = log.get('admin_id')
        nick = users_map.get(admin_id, 'Admin')
        log['admin_nickname'] = nick
        log['users'] = {'nickname': nick}
    return logs

@router.get("/stats")
def get_stats(admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    users_count = db.table('users').select('id', count='exact').execute().count or 0
    projects_count = db.table('projects').select('id', count='exact').execute().count or 0
    ratings_count = db.table('ratings').select('id', count='exact').execute().count or 0
    return {
        'users': users_count,
        'projects': projects_count,
        'ratings': ratings_count
    }

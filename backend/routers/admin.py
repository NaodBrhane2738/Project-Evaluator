from fastapi import APIRouter, Depends
from database import get_supabase
from auth_deps import get_current_admin
import json

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])

def log_audit(db, admin_id, action, target_type=None, target_id=None, details=None):
    db.table('admin_audit_log').insert({
        'admin_id': admin_id,
        'action': action,
        'target_type': target_type,
        'target_id': target_id,
        'details': json.dumps(details or {})
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
    db.table('competition_state').update({'status': 'voting_locked', 'locked_at': 'now()'}).eq('id', 1).execute()
    log_audit(db, admin['id'], 'lock_competition')
    return {"status": "locked"}

@router.post("/competition/unlock")
def unlock_comp(admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    db.table('competition_state').update({'status': 'voting_open'}).eq('id', 1).execute()
    log_audit(db, admin['id'], 'unlock_competition')
    return {"status": "unlocked"}

@router.post("/competition/finish")
def finish_comp(admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    db.table('competition_state').update({'status': 'finished', 'finished_at': 'now()'}).eq('id', 1).execute()
    log_audit(db, admin['id'], 'finish_competition')
    return {"status": "finished"}

@router.get("/audit-log")
def get_audit_log(admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    res = db.table('admin_audit_log').select('*, users!admin_audit_log_admin_id_fkey(nickname)').order('created_at', desc=True).execute()
    return res.data

@router.get("/stats")
def get_stats(admin: dict = Depends(get_current_admin)):
    db = get_supabase()
    users_count = db.table('users').select('id', count='exact').execute().count
    projects_count = db.table('projects').select('id', count='exact').execute().count
    ratings_count = db.table('ratings').select('id', count='exact').execute().count
    return {
        'users': users_count,
        'projects': projects_count,
        'ratings': ratings_count
    }

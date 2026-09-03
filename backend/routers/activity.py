from fastapi import APIRouter
from database import get_supabase
from config import settings

router = APIRouter(prefix="/activity", tags=["Activity"])

@router.get("")
def get_activity():
    db = get_supabase()
    users_map = {u['id']: u['nickname'] for u in (db.table('users').select('id, nickname').execute().data or [])}
    projects_map = {p['id']: p['name'] for p in (db.table('projects').select('id, name').execute().data or [])}

    activities_res = db.table('activities').select('*').order('created_at', desc=True).limit(50).execute()
    
    results = []
    for act in (activities_res.data or []):
        nickname = users_map.get(act.get('user_id'), 'Someone')
        # Strictly hide admin activities from public feed
        if settings.is_admin(nickname):
            continue

        project_name = projects_map.get(act.get('project_id'), 'a project')
        
        meta = act.get('metadata') or {}
        if isinstance(meta, dict):
            meta_project = meta.get('project_name', project_name)
        else:
            meta_project = project_name
        
        if act['action'] == 'user_joined':
            msg = f"{nickname} joined Project Evaluator"
        elif act['action'] == 'project_submitted':
            msg = f"{nickname} submitted \"{meta_project}\""
        elif act['action'] == 'project_rated':
            msg = f"{nickname} rated \"{meta_project}\""
        elif act['action'] == 'rating_updated':
            msg = f"{nickname} updated their rating for \"{meta_project}\""
        else:
            msg = f"{nickname} performed {act['action']}"
            
        act['message'] = msg
        results.append(act)
        
    return results

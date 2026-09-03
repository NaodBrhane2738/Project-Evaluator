from fastapi import APIRouter, Depends, HTTPException, status
from database import get_supabase
from auth_deps import get_current_user
from schemas.projects import CreateProjectRequest, UpdateProjectRequest
from services.scoring import score_project_from_ratings, rank_projects, get_voter_count_label, calculate_weighted_contributions
import json

router = APIRouter(prefix="/projects", tags=["Projects"])

def _enrich_users_and_projects(db):
    users = {u['id']: u['nickname'] for u in db.table('users').select('id, nickname').execute().data}
    return users

@router.post("")
def create_project(request: CreateProjectRequest, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    project_data = request.model_dump(exclude_unset=True)
    project_data['creator_id'] = current_user['id']
    
    result = db.table('projects').insert(project_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create project")
    project = result.data[0]
    
    db.table('activities').insert({
        'user_id': current_user['id'],
        'project_id': project['id'],
        'action': 'project_submitted',
        'metadata': json.dumps({'project_name': project['name']})
    }).execute()
    
    return project

@router.get("")
def list_projects():
    db = get_supabase()
    users_map = _enrich_users_and_projects(db)
    
    projects_res = db.table('projects').select('*').eq('hidden', False).execute()
    ratings_res = db.table('ratings').select('*').execute()
    
    ratings_by_project = {}
    for r in (ratings_res.data or []):
        ratings_by_project.setdefault(r['project_id'], []).append(r)
        
    enriched_projects = []
    for p in (projects_res.data or []):
        p['creator_nickname'] = users_map.get(p['creator_id'], 'Unknown')
        # Public scoring excludes creator self-ratings to maintain competition fairness
        p_ratings = [r for r in ratings_by_project.get(p['id'], []) if r['user_id'] != p['creator_id']]
        scores = score_project_from_ratings(p_ratings)
        p.update(scores)
        enriched_projects.append(p)
        
    ranked = rank_projects(enriched_projects)
    return ranked

@router.get("/{project_id}")
def get_project(project_id: str):
    db = get_supabase()
    users_map = _enrich_users_and_projects(db)
    
    project_res = db.table('projects').select('*').eq('id', project_id).maybe_single().execute()
    
    if not project_res.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = dict(project_res.data)
    project['creator_nickname'] = users_map.get(project['creator_id'], 'Unknown')
    
    ratings_res = db.table('ratings').select('*').eq('project_id', project_id).execute()
    ratings = ratings_res.data or []
    for r in ratings:
        r['voter_nickname'] = users_map.get(r['user_id'], 'Unknown')
    
    # Public scoring uses ratings from participants other than the creator
    public_ratings = [r for r in ratings if r['user_id'] != project['creator_id']]
    scores = score_project_from_ratings(public_ratings)
    project.update(scores)
    project['weighted_contributions'] = calculate_weighted_contributions(scores)
    project['voter_count_label'] = get_voter_count_label(scores['voter_count'])
    project['ratings'] = ratings
    
    project['rank'] = 1
    project['is_tied'] = False
    all_projects = list_projects()
    for p in all_projects:
        if p['id'] == project_id:
            project['rank'] = p['rank']
            project['is_tied'] = p.get('is_tied', False)
            break
            
    return project

@router.patch("/{project_id}")
def update_project(project_id: str, request: UpdateProjectRequest, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    project_res = db.table('projects').select('*').eq('id', project_id).maybe_single().execute()
    
    if not project_res.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project_res.data['creator_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to edit this project")
        
    update_data = request.model_dump(exclude_unset=True)
    if not update_data:
        return project_res.data
        
    result = db.table('projects').update(update_data).eq('id', project_id).execute()
    if result.data:
        return result.data[0]
    updated = db.table('projects').select('*').eq('id', project_id).maybe_single().execute()
    return updated.data or project_res.data

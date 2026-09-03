from fastapi import APIRouter, Depends, HTTPException, status
from database import get_supabase
from auth_deps import get_current_user, get_competition_state
from schemas.ratings import SubmitRatingRequest
from services.scoring import score_project_from_ratings
import json
from datetime import datetime, timezone

router = APIRouter(prefix="/projects", tags=["Ratings"])

@router.post("/{project_id}/ratings")
def submit_rating(project_id: str, request: SubmitRatingRequest, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    comp_state = get_competition_state(db)
    if comp_state['status'] != 'voting_open':
        raise HTTPException(status_code=400, detail="Voting is not open")
        
    project_res = db.table('projects').select('creator_id, name').eq('id', project_id).maybe_single().execute()
    if not project_res.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    scores = request.model_dump()
    for k, v in scores.items():
        if not (0 <= v <= 100):
            raise HTTPException(status_code=400, detail=f"Score {k} must be between 0 and 100")
            
    existing = db.table('ratings').select('id, created_at').eq('project_id', project_id).eq('user_id', current_user['id']).maybe_single().execute()
    
    rating_data = scores
    rating_data['project_id'] = project_id
    rating_data['user_id'] = current_user['id']
    now_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    
    if existing.data:
        rating_data['updated_at'] = now_str
        db.table('ratings').update(rating_data).eq('id', existing.data['id']).execute()
        action = 'rating_updated'
    else:
        rating_data['created_at'] = now_str
        rating_data['updated_at'] = now_str
        db.table('ratings').insert(rating_data).execute()
        action = 'project_rated'
        
    db.table('activities').insert({
        'user_id': current_user['id'],
        'project_id': project_id,
        'action': action,
        'metadata': json.dumps({'project_name': project_res.data['name']})
    }).execute()
    
    all_ratings = db.table('ratings').select('*').eq('project_id', project_id).execute().data or []
    creator_id = project_res.data.get('creator_id')
    public_ratings = [r for r in all_ratings if r['user_id'] != creator_id]
    return score_project_from_ratings(public_ratings)

@router.delete("/{project_id}/ratings")
def delete_my_rating(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    comp_state = get_competition_state(db)
    if comp_state['status'] != 'voting_open':
        raise HTTPException(status_code=400, detail="Voting is not open")

    existing = db.table('ratings').select('id').eq('project_id', project_id).eq('user_id', current_user['id']).maybe_single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Rating not found")

    project_res = db.table('projects').select('name, creator_id').eq('id', project_id).maybe_single().execute()
    project_name = project_res.data['name'] if project_res.data else 'Project'
    creator_id = project_res.data.get('creator_id') if project_res.data else None

    db.table('ratings').delete().eq('id', existing.data['id']).execute()
    db.table('activities').insert({
        'user_id': current_user['id'],
        'project_id': project_id,
        'action': 'rating_removed',
        'metadata': json.dumps({'project_name': project_name})
    }).execute()

    all_ratings = db.table('ratings').select('*').eq('project_id', project_id).execute().data or []
    public_ratings = [r for r in all_ratings if r['user_id'] != creator_id]
    return score_project_from_ratings(public_ratings)

@router.get("/{project_id}/ratings")
def get_ratings(project_id: str):
    db = get_supabase()
    users_map = {u['id']: u['nickname'] for u in (db.table('users').select('id, nickname').execute().data or [])}
    ratings_res = db.table('ratings').select('*').eq('project_id', project_id).execute()
    data = ratings_res.data or []
    for r in data:
        r['voter_nickname'] = users_map.get(r['user_id'], 'Unknown')
        r['is_updated'] = bool(r.get('created_at') and r.get('updated_at') and r.get('created_at') != r.get('updated_at'))
    return data

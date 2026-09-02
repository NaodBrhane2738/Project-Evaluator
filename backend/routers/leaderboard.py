from fastapi import APIRouter, Query
from database import get_supabase
from routers.projects import list_projects
from routers.users import get_people_leaderboard
from auth_deps import get_competition_state

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("")
def get_leaderboard(sort: str = Query('overall')):
    """
    Returns ranked projects.
    sort: overall | most_voted | demo | time | technical_depth |
          influence | authenticity | simplicity | market | scalability
    """
    projects = list_projects()

    if sort == 'overall':
        return projects
    elif sort == 'most_voted':
        return sorted(projects, key=lambda x: x.get('voter_count', 0), reverse=True)
    elif sort in ['demo', 'time', 'technical_depth', 'influence',
                  'authenticity', 'simplicity', 'market', 'scalability']:
        sort_key = f"{sort}_score"
        return sorted(projects, key=lambda x: x.get(sort_key, 0), reverse=True)

    return projects


@router.get("/comparison")
def compare_projects(ids: str = Query(..., description="Comma-separated project UUIDs (2–3)")):
    """Returns side-by-side comparison data for 2–3 projects."""
    id_list = [i.strip() for i in ids.split(',') if i.strip()]
    if not (2 <= len(id_list) <= 3):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Provide 2 or 3 project IDs")
    projects = list_projects()
    return [p for p in projects if p['id'] in id_list]


@router.get("/people")
def people_leaderboard():
    """People ranking with badges."""
    return get_people_leaderboard()


@router.get("/stats")
def competition_stats():
    """Dashboard overview statistics."""
    db = get_supabase()

    projects_count = db.table('projects').select('id', count='exact').eq('hidden', False).execute().count or 0
    users_count    = db.table('users').select('id', count='exact').execute().count or 0
    ratings_count  = db.table('ratings').select('id', count='exact').execute().count or 0

    comp_state = get_competition_state(db)

    # Most active evaluator
    ratings_res = db.table('ratings').select('user_id').execute()
    from collections import Counter
    user_rating_counts = Counter(r['user_id'] for r in (ratings_res.data or []))
    most_active_user_id = user_rating_counts.most_common(1)[0][0] if user_rating_counts else None
    most_active_nickname = None
    if most_active_user_id:
        u = db.table('users').select('nickname').eq('id', most_active_user_id).maybe_single().execute()
        most_active_nickname = u.data['nickname'] if u.data else None

    # Current #1 project
    projects = list_projects()
    top_project = projects[0] if projects else None

    return {
        "projects_submitted": projects_count,
        "total_participants": users_count,
        "total_ratings": ratings_count,
        "competition_status": comp_state.get('status', 'voting_open'),
        "most_active_evaluator": most_active_nickname,
        "top_project": top_project,
    }

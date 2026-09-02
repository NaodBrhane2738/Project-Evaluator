"""
services/scoring.py — CyberArena Scoring Engine

All scoring logic lives here. The UI never implements ranking logic.
The backend is the single source of truth.

Weights:
  Demo            22%
  Time            18%
  Technical Depth 15%
  Influence       14%
  Authenticity    12%
  Simplicity      10%
  Market           5%
  Scalability      4%
  Total          100%

Tie-breaking order (same as weight priority):
  demo > time > technical_depth > influence > authenticity > simplicity > market > scalability
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import TypedDict

WEIGHTS: dict[str, float] = {
    'demo':            0.22,
    'time':            0.18,
    'technical_depth': 0.15,
    'influence':       0.14,
    'authenticity':    0.12,
    'simplicity':      0.10,
    'market':          0.05,
    'scalability':     0.04,
}

TIEBREAK_ORDER: list[str] = [
    'demo', 'time', 'technical_depth', 'influence',
    'authenticity', 'simplicity', 'market', 'scalability'
]

assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-10, 'Weights must sum to 1.0'


def calculate_criterion_scores(ratings: list[dict]) -> dict[str, float]:
    """
    Given a list of rating dicts (each with keys: demo, time, technical_depth,
    influence, authenticity, simplicity, market, scalability),
    return the average score for each criterion.
    
    Returns a dict with criterion -> average (float, 2dp).
    If no ratings, returns all zeros.
    """
    if not ratings:
        return {k: 0.0 for k in WEIGHTS}
    
    sums = {k: 0.0 for k in WEIGHTS}
    count = len(ratings)
    for r in ratings:
        for k in WEIGHTS:
            sums[k] += float(r.get(k, 0))
    
    return {k: round(sums[k] / count, 2) for k in WEIGHTS}


def calculate_weighted_score(scores: dict[str, float]) -> float:
    """
    Given criterion averages, compute the weighted final score.
    Returns float rounded to 4 decimal places for internal use,
    display as 2dp.
    """
    total = sum(scores.get(k, 0.0) * w for k, w in WEIGHTS.items())
    return round(total, 4)


def resolve_tie(project_a: dict, project_b: dict) -> int:
    """
    Compare two projects by tiebreak criteria when final scores are equal.
    Returns:
      -1 if project_a wins (higher priority)
       0 if genuine tie (all 8 criteria identical)
      +1 if project_b wins
    
    Each project dict must have keys: final_score + all 8 criterion keys.
    """
    for criterion in TIEBREAK_ORDER:
        a_val = project_a.get(f'{criterion}_score', 0.0)
        b_val = project_b.get(f'{criterion}_score', 0.0)
        if a_val > b_val:
            return -1  # a wins
        if a_val < b_val:
            return +1  # b wins
    return 0  # genuine tie


def rank_projects(projects: list[dict]) -> list[dict]:
    """
    Sort a list of project dicts by final_score (desc), then tiebreak.
    Each dict must have: final_score + all 8 criterion_score keys.
    Returns the same list with 'rank' and 'is_tied' fields added.
    """
    from functools import cmp_to_key
    
    def compare(a: dict, b: dict) -> int:
        fa = a.get('final_score', 0.0)
        fb = b.get('final_score', 0.0)
        # Sort descending by final score
        if fa > fb:
            return -1
        if fa < fb:
            return +1
        # Equal final score — tiebreak
        return resolve_tie(a, b)
    
    sorted_projects = sorted(projects, key=cmp_to_key(compare))
    
    # Assign ranks (genuine ties get same rank)
    rank = 1
    for i, proj in enumerate(sorted_projects):
        if i == 0:
            proj['rank'] = 1
        else:
            prev = sorted_projects[i - 1]
            # Same rank only if genuine tie (all criteria equal)
            if resolve_tie(proj, prev) == 0 and proj['final_score'] == prev['final_score']:
                proj['rank'] = prev['rank']
                proj['is_tied'] = True
                sorted_projects[i - 1]['is_tied'] = True
            else:
                proj['rank'] = i + 1  # Use absolute position, not prev.rank + 1
        proj.setdefault('is_tied', False)
    
    return sorted_projects


def score_project_from_ratings(ratings: list[dict]) -> dict:
    """
    Given all ratings for a project, compute criterion averages + final score.
    Returns dict with all 8 criterion_score keys + final_score + voter_count.
    """
    scores = calculate_criterion_scores(ratings)
    final = calculate_weighted_score(scores)
    return {
        'demo_score':            scores['demo'],
        'time_score':            scores['time'],
        'technical_depth_score': scores['technical_depth'],
        'influence_score':       scores['influence'],
        'authenticity_score':    scores['authenticity'],
        'simplicity_score':      scores['simplicity'],
        'market_score':          scores['market'],
        'scalability_score':     scores['scalability'],
        'final_score':           final,
        'voter_count':           len(ratings),
    }


def get_voter_count_label(voter_count: int) -> str:
    """Returns informational sample size label."""
    if voter_count <= 4:
        return 'Early'
    elif voter_count <= 14:
        return 'Developing'
    elif voter_count <= 29:
        return 'Established'
    else:
        return 'Well-voted'


def calculate_weighted_contributions(scores: dict[str, float]) -> dict[str, float]:
    """Returns per-criterion weighted contribution for display."""
    return {
        k: round(scores.get(k, 0.0) * w, 4)
        for k, w in WEIGHTS.items()
    }

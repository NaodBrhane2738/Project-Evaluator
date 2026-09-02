"""
tests/test_scoring.py — CyberArena Scoring Engine Tests

Tests criterion averages, weighted scoring, tie-breaking, ranking.
All pure unit tests — no DB or HTTP calls.
"""
import pytest
from services.scoring import (
    calculate_criterion_scores,
    calculate_weighted_score,
    resolve_tie,
    rank_projects,
    score_project_from_ratings,
    get_voter_count_label,
    WEIGHTS, TIEBREAK_ORDER
)

def test_weights_sum_to_one():
    assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-10

def test_tiebreak_order_has_eight_entries():
    assert len(TIEBREAK_ORDER) == 8
    assert set(TIEBREAK_ORDER) == set(WEIGHTS.keys())

def test_criterion_scores_empty_ratings():
    res = calculate_criterion_scores([])
    for k in WEIGHTS:
        assert res[k] == 0.0

def test_criterion_scores_single_rating():
    rating = {
        'demo': 90, 'time': 80, 'technical_depth': 70, 'influence': 60,
        'authenticity': 50, 'simplicity': 40, 'market': 30, 'scalability': 20
    }
    res = calculate_criterion_scores([rating])
    for k, v in rating.items():
        assert res[k] == float(v)

def test_criterion_scores_multiple_ratings():
    r1 = {'demo': 100, 'time': 80, 'technical_depth': 0, 'influence': 0, 'authenticity': 0, 'simplicity': 0, 'market': 0, 'scalability': 0}
    r2 = {'demo': 50, 'time': 40, 'technical_depth': 0, 'influence': 0, 'authenticity': 0, 'simplicity': 0, 'market': 0, 'scalability': 0}
    r3 = {'demo': 0, 'time': 0, 'technical_depth': 0, 'influence': 0, 'authenticity': 0, 'simplicity': 0, 'market': 0, 'scalability': 0}
    res = calculate_criterion_scores([r1, r2, r3])
    assert res['demo'] == 50.0
    assert res['time'] == 40.0
    
def test_weighted_score_all_100():
    scores = {k: 100.0 for k in WEIGHTS}
    assert calculate_weighted_score(scores) == 100.0
    
def test_weighted_score_all_zero():
    scores = {k: 0.0 for k in WEIGHTS}
    assert calculate_weighted_score(scores) == 0.0
    
def test_weighted_score_mixed():
    scores = {k: 100.0 for k in WEIGHTS}
    scores['demo'] = 50.0  # 100 * 1.0 - 50 * 0.22 = 100 - 11 = 89
    assert abs(calculate_weighted_score(scores) - 89.0) < 1e-4

def test_weighted_score_precision():
    scores = {k: 33.33 for k in WEIGHTS}
    res = calculate_weighted_score(scores)
    assert res == 33.3300
    
def test_resolve_tie_a_wins_demo():
    a = {'demo_score': 92}
    b = {'demo_score': 88}
    assert resolve_tie(a, b) == -1
    
def test_resolve_tie_b_wins_demo():
    a = {'demo_score': 90}
    b = {'demo_score': 95}
    assert resolve_tie(a, b) == +1
    
def test_resolve_tie_demo_equal_time_decides():
    a = {'demo_score': 90, 'time_score': 82}
    b = {'demo_score': 90, 'time_score': 87}
    assert resolve_tie(a, b) == +1

def test_resolve_tie_multilevel():
    a = {'demo_score': 90, 'time_score': 85, 'technical_depth_score': 70}
    b = {'demo_score': 90, 'time_score': 85, 'technical_depth_score': 80}
    assert resolve_tie(a, b) == +1

def test_resolve_tie_genuine_tie():
    a = {f'{k}_score': 50.0 for k in WEIGHTS}
    b = {f'{k}_score': 50.0 for k in WEIGHTS}
    assert resolve_tie(a, b) == 0

def test_rank_projects_basic():
    p1 = {'id': 1, 'final_score': 90.0}
    p2 = {'id': 2, 'final_score': 80.0}
    p3 = {'id': 3, 'final_score': 95.0}
    ranked = rank_projects([p1, p2, p3])
    assert ranked[0]['id'] == 3
    assert ranked[0]['rank'] == 1
    assert ranked[1]['id'] == 1
    assert ranked[1]['rank'] == 2
    assert ranked[2]['id'] == 2
    assert ranked[2]['rank'] == 3

def test_rank_projects_tiebreak_demo():
    p1 = {'id': 1, 'final_score': 90.0, 'demo_score': 80.0}
    p2 = {'id': 2, 'final_score': 90.0, 'demo_score': 90.0}
    ranked = rank_projects([p1, p2])
    assert ranked[0]['id'] == 2
    assert ranked[0]['rank'] == 1
    assert ranked[1]['id'] == 1
    assert ranked[1]['rank'] == 2

def test_rank_projects_genuine_tie_same_rank():
    p1 = {'id': 1, 'final_score': 90.0, **{f'{k}_score': 50.0 for k in WEIGHTS}}
    p2 = {'id': 2, 'final_score': 90.0, **{f'{k}_score': 50.0 for k in WEIGHTS}}
    ranked = rank_projects([p1, p2])
    assert ranked[0]['rank'] == 1
    assert ranked[1]['rank'] == 1
    assert ranked[0]['is_tied'] is True
    assert ranked[1]['is_tied'] is True

def test_rank_projects_single():
    p = {'id': 1, 'final_score': 90.0}
    ranked = rank_projects([p])
    assert ranked[0]['rank'] == 1

def test_rank_projects_empty():
    assert rank_projects([]) == []

def test_voter_count_label_early():
    assert get_voter_count_label(1) == 'Early'
    assert get_voter_count_label(4) == 'Early'

def test_voter_count_label_developing():
    assert get_voter_count_label(5) == 'Developing'
    assert get_voter_count_label(14) == 'Developing'

def test_voter_count_label_established():
    assert get_voter_count_label(15) == 'Established'
    assert get_voter_count_label(29) == 'Established'

def test_voter_count_label_well_voted():
    assert get_voter_count_label(30) == 'Well-voted'
    assert get_voter_count_label(50) == 'Well-voted'

def test_score_project_from_ratings():
    r1 = {k: 100 for k in WEIGHTS}
    r2 = {k: 50 for k in WEIGHTS}
    res = score_project_from_ratings([r1, r2])
    assert res['final_score'] == 75.0
    assert res['demo_score'] == 75.0
    assert res['voter_count'] == 2

def test_floating_point_precision():
    r1 = {'demo': 100, 'time': 80, 'technical_depth': 70, 'influence': 60, 'authenticity': 50, 'simplicity': 40, 'market': 30, 'scalability': 20}
    res = score_project_from_ratings([r1])
    assert type(res['final_score']) == float

import pytest
import os
import sys
import hashlib
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database import get_supabase, TableQuery, validate_ident
from routers.users import hash_password, verify_password

client = TestClient(app)

def test_password_hashing_salted_pbkdf2():
    pw = "SuperSecretPassword123!"
    h1 = hash_password(pw)
    h2 = hash_password(pw)
    
    # Must use PBKDF2 format
    assert h1.startswith("pbkdf2_sha256$100000$")
    assert h2.startswith("pbkdf2_sha256$100000$")
    # Salts must be unique
    assert h1 != h2
    
    # Must verify successfully
    valid1, upgrade1 = verify_password(pw, h1)
    assert valid1 is True
    assert upgrade1 is False
    
    # Wrong password must fail
    wrong_valid, _ = verify_password("WrongPassword", h1)
    assert wrong_valid is False

def test_legacy_sha256_verification_and_upgrade():
    pw = "LegacyPass123"
    legacy_hash = hashlib.sha256(pw.encode('utf-8')).hexdigest()
    
    valid, needs_upgrade = verify_password(pw, legacy_hash)
    assert valid is True
    assert needs_upgrade is True
    
    # Wrong password on legacy hash fails
    wrong_valid, _ = verify_password("WrongPass", legacy_hash)
    assert wrong_valid is False

def test_sensitive_data_exposure_prevention():
    # Claim account with password
    nick = "sec_test_user"
    pw = "SecretP@ss99"
    res = client.post("/api/v1/users", json={"nickname": nick, "password": pw})
    assert res.status_code in (200, 400) # 200 if created, 400 if exists
    if res.status_code == 200:
        data = res.json()
        assert "password_hash" not in data
        user_id = data["id"]
    else:
        # Sign in
        res_login = client.post("/api/v1/users", json={"nickname": nick, "password": pw})
        assert res_login.status_code == 200
        data = res_login.json()
        assert "password_hash" not in data
        user_id = data["id"]

    # Check profile endpoint does not leak password_hash
    prof_res = client.get(f"/api/v1/users/{user_id}")
    assert prof_res.status_code == 200
    prof_data = prof_res.json()
    assert "password_hash" not in prof_data

    # Check people leaderboard does not leak password_hash for any user
    lead_res = client.get("/api/v1/users")
    assert lead_res.status_code == 200
    for u in lead_res.json():
        assert "password_hash" not in u

def test_path_traversal_protection():
    # Attempting to escape frontend dist to read backend files
    traversal_paths = [
        "/../../backend/config.py",
        "/..%2f..%2fbackend%2fconfig.py",
        "/....//....//backend/main.py",
        "/../../.env",
    ]
    for path in traversal_paths:
        res = client.get(path)
        # Should not serve config or source code contents; either serves SPA index.html or 404
        content = res.text
        assert "Settings(BaseSettings)" not in content
        assert "SECRET_KEY" not in content

def test_sql_identifier_validation():
    # Valid identifiers
    assert validate_ident("users") == "users"
    assert validate_ident("admin_audit_log") == "admin_audit_log"
    assert validate_ident("created_at") == "created_at"

    # Malicious or invalid identifiers must raise ValueError
    with pytest.raises(ValueError):
        validate_ident("users; DROP TABLE users;--")
    with pytest.raises(ValueError):
        validate_ident("users!foreign_key")
    with pytest.raises(ValueError):
        validate_ident("column name with spaces")

def test_admin_audit_log_sqlite_compatibility():
    # First ensure admin user exists
    db = get_supabase()
    admin_user = db.table('users').select('*').eq('nickname_lower', 'admin').maybe_single().execute()
    if not admin_user.data:
        admin_data = db.table('users').insert({
            'nickname': 'Admin',
            'nickname_lower': 'admin',
        }).execute().data[0]
        admin_id = admin_data['id']
    else:
        admin_id = admin_user.data['id']

    # Log an action
    client.post("/api/v1/admin/competition/unlock", headers={"X-User-Id": admin_id})

    # Test audit-log endpoint does NOT crash with SQLite syntax error
    res = client.get("/api/v1/admin/audit-log", headers={"X-User-Id": admin_id})
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)
    if logs:
        assert "admin_nickname" in logs[0]
        assert "created_at" in logs[0]
        assert logs[0]["created_at"] != "now()"

def test_project_input_validation():
    # Test valid user id
    db = get_supabase()
    user = db.table('users').select('id').maybe_single().execute().data
    assert user is not None
    user_id = user['id']

    # Project name too short
    res1 = client.post(
        "/api/v1/projects",
        json={"name": "   "},
        headers={"X-User-Id": user_id}
    )
    assert res1.status_code == 422

    # Project with dangerous image_url scheme (javascript:)
    res2 = client.post(
        "/api/v1/projects",
        json={"name": "Valid Name", "image_url": "javascript:alert(1)"},
        headers={"X-User-Id": user_id}
    )
    assert res2.status_code == 422

    # Valid project creation
    res3 = client.post(
        "/api/v1/projects",
        json={
            "name": "Secure Project Test",
            "tagline": "Safe tagline",
            "image_url": "https://example.com/image.png"
        },
        headers={"X-User-Id": user_id}
    )
    assert res3.status_code == 200
    proj = res3.json()
    assert proj["name"] == "Secure Project Test"

def test_creator_self_rating_excluded_from_public_score():
    db = get_supabase()
    users = db.table('users').select('id, nickname').execute().data
    assert len(users) >= 2
    creator_id = users[0]['id']
    voter_id = users[1]['id']

    # Create project as creator
    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Self Rating Fairness Project"},
        headers={"X-User-Id": creator_id}
    )
    assert proj_res.status_code == 200
    project_id = proj_res.json()["id"]

    rating_payload_100 = {
        "demo": 100, "time": 100, "technical_depth": 100, "influence": 100,
        "authenticity": 100, "simplicity": 100, "market": 100, "scalability": 100
    }
    rating_payload_80 = {
        "demo": 80, "time": 80, "technical_depth": 80, "influence": 80,
        "authenticity": 80, "simplicity": 80, "market": 80, "scalability": 80
    }

    # Creator rates own project with perfect 100s
    res_rate_self = client.post(
        f"/api/v1/projects/{project_id}/ratings",
        json=rating_payload_100,
        headers={"X-User-Id": creator_id}
    )
    assert res_rate_self.status_code == 200

    # Check project details: public score should NOT be 100 because creator rating is filtered out
    detail_res = client.get(f"/api/v1/projects/{project_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["voter_count"] == 0
    assert detail["final_score"] == 0.0

    # Another participant rates project with 80s
    res_rate_voter = client.post(
        f"/api/v1/projects/{project_id}/ratings",
        json=rating_payload_80,
        headers={"X-User-Id": voter_id}
    )
    assert res_rate_voter.status_code == 200

    detail_after = client.get(f"/api/v1/projects/{project_id}").json()
    assert detail_after["voter_count"] == 1
    assert detail_after["final_score"] == 80.0

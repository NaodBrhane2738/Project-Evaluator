import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "cyberarena.db")

def init_sqlite_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    # competition_state
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS competition_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'voting_open',
      locked_at TEXT,
      finished_at TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("INSERT OR IGNORE INTO competition_state (id, status) VALUES (1, 'voting_open');")

    # users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      nickname_lower TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_active_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # projects
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      tagline TEXT,
      problem TEXT,
      solution TEXT,
      target_users TEXT,
      domain TEXT,
      features TEXT,
      tech_stack TEXT,
      mvp_plan TEXT,
      future_potential TEXT,
      image_url TEXT,
      hidden INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # ratings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      demo INTEGER NOT NULL,
      time INTEGER NOT NULL,
      technical_depth INTEGER NOT NULL,
      influence INTEGER NOT NULL,
      authenticity INTEGER NOT NULL,
      simplicity INTEGER NOT NULL,
      market INTEGER NOT NULL,
      scalability INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, project_id)
    );
    """)

    # score_snapshots
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS score_snapshots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      final_score REAL,
      demo_score REAL,
      time_score REAL,
      technical_depth_score REAL,
      influence_score REAL,
      authenticity_score REAL,
      simplicity_score REAL,
      market_score REAL,
      scalability_score REAL,
      rank INTEGER,
      voter_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # activities
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # admin_audit_log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id TEXT PRIMARY KEY,
      admin_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_sqlite_db()
    print("Local SQLite database initialized.")

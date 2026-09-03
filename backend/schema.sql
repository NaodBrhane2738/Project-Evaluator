-- competition_state (singleton)
CREATE TABLE competition_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'voting_open' 
    CHECK (status IN ('draft', 'voting_open', 'voting_locked', 'finished')),
  locked_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO competition_state (id, status) VALUES (1, 'voting_open');

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(20) NOT NULL,
  nickname_lower VARCHAR(20) NOT NULL UNIQUE,  -- for ci uniqueness
  password_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_nickname_lower ON users(nickname_lower);

-- projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  tagline VARCHAR(300),
  problem TEXT,
  solution TEXT,
  target_users TEXT,
  domain VARCHAR(100),
  features TEXT,
  tech_stack TEXT,
  mvp_plan TEXT,
  future_potential TEXT,
  image_url TEXT,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_creator_id ON projects(creator_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_hidden ON projects(hidden);

-- ratings (UNIQUE per user+project)
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  demo INTEGER NOT NULL CHECK (demo BETWEEN 0 AND 100),
  time INTEGER NOT NULL CHECK (time BETWEEN 0 AND 100),
  technical_depth INTEGER NOT NULL CHECK (technical_depth BETWEEN 0 AND 100),
  influence INTEGER NOT NULL CHECK (influence BETWEEN 0 AND 100),
  authenticity INTEGER NOT NULL CHECK (authenticity BETWEEN 0 AND 100),
  simplicity INTEGER NOT NULL CHECK (simplicity BETWEEN 0 AND 100),
  market INTEGER NOT NULL CHECK (market BETWEEN 0 AND 100),
  scalability INTEGER NOT NULL CHECK (scalability BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);
CREATE INDEX idx_ratings_project_id ON ratings(project_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);

-- score_snapshots
CREATE TABLE score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  final_score NUMERIC(6,4),
  demo_score NUMERIC(6,4),
  time_score NUMERIC(6,4),
  technical_depth_score NUMERIC(6,4),
  influence_score NUMERIC(6,4),
  authenticity_score NUMERIC(6,4),
  simplicity_score NUMERIC(6,4),
  market_score NUMERIC(6,4),
  scalability_score NUMERIC(6,4),
  rank INTEGER,
  voter_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_snapshots_project_id ON score_snapshots(project_id);
CREATE INDEX idx_snapshots_created_at ON score_snapshots(created_at);

-- activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_activities_project_id ON activities(project_id);

-- admin_audit_log
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

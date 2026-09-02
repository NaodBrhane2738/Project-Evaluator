# CyberArena — Project README

## Overview

A full-stack, transparent project-evaluation and ranking platform for a 5-week cybersecurity innovation competition.

Users submit cybersecurity projects, publicly evaluate them across 8 weighted criteria, and the system automatically ranks them using a deterministic server-side scoring engine with mathematical tie-breaking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind v4 + TypeScript |
| Backend | FastAPI + Uvicorn + Pydantic v2 |
| Database | Supabase (PostgreSQL) |
| Auth | Nickname-based (no email/password) |
| Rate Limiting | slowapi |

---

## Quick Start

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `backend/schema.sql`
3. Copy your **Project URL** and **Service Role Key** from Settings → API

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env:
#   SUPABASE_URL=https://xxxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
#   ADMIN_NICKNAMES=ADMIN,JUDGE,ROOT
```

### 3. Install Backend Dependencies

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### 4. Seed Demo Data

```bash
cd backend
python seed.py
```

This creates 6 users (NEXUS, ARES, ULTRON, CYBERFOX, ROOT, ZERO), 8 cybersecurity projects, and realistic ratings.

### 5. Start Backend

```bash
cd backend
.venv\Scripts\uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 6. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## Competition Criteria & Weights

| Criterion | Weight | Priority |
|---|---|---|
| Demo | 22% | 1 |
| Time | 18% | 2 |
| Technical Depth | 15% | 3 |
| Influence | 14% | 4 |
| Authenticity | 12% | 5 |
| Simplicity | 10% | 6 |
| Market | 5% | 7 |
| Scalability | 4% | 8 |

### Tie-Breaking

When two projects have identical weighted scores, the system compares criteria in priority order (Demo first, then Time, etc.). The first criterion where one project scores higher wins.

---

## Authentication

CyberArena uses lightweight **nickname-based identity**:

1. User picks a handle (e.g., `NEXUS`) on first visit
2. Backend creates a user row and returns a UUID
3. UUID stored in `localStorage`
4. All API requests include `X-User-Id: <uuid>` header
5. No passwords, no email verification

**Admin access**: Set `ADMIN_NICKNAMES` in your `.env` file. Users with those handles get admin controls.

---

## Routes

| Path | Description |
|---|---|
| `/` | Dashboard with leaderboard + activity feed |
| `/onboarding` | Nickname picker (first visit) |
| `/projects` | Browse all projects |
| `/projects/new` | Submit a project |
| `/projects/:id` | Full project detail + voting |
| `/leaderboard` | All ranking views |
| `/compare` | Side-by-side project comparison |
| `/judge` | Presentation-friendly judge view |
| `/admin` | Admin controls (admin nickname required) |

---

## Running Tests

```bash
cd backend
.venv\Scripts\python -m pytest tests/ -v
```

25 tests covering: criterion averages, weighted scoring, tie-breaking (all 8 levels), genuine ties, ranking, sample size labels, voting validation.

---

## Competition States

| State | Description |
|---|---|
| `draft` | Not yet open |
| `voting_open` | Participants can submit ratings |
| `voting_locked` | Results frozen, no new ratings |
| `finished` | Competition ended, final ranking permanent |

Admins control state from `/admin` → Competition Control.

---

## Project Structure

```
intelligent-darwin/
├── frontend/                  # React app
│   └── src/
│       ├── pages/             # Dashboard, ProjectDetail, Leaderboard, etc.
│       ├── components/        # ScoreRing, CriterionBar, VoterTable, etc.
│       ├── hooks/             # useUser, useLeaderboard, useActivity
│       ├── lib/               # api.ts, utils.ts
│       └── types/             # TypeScript types
│
└── backend/                   # FastAPI app
    ├── routers/               # users, projects, ratings, leaderboard, activity, admin
    ├── schemas/               # Pydantic request/response models
    ├── services/
    │   └── scoring.py         # THE scoring engine
    ├── tests/
    │   └── test_scoring.py    # 25 unit tests
    ├── schema.sql             # Supabase PostgreSQL schema
    ├── seed.py                # Demo data seeder
    └── main.py                # FastAPI entry point
```

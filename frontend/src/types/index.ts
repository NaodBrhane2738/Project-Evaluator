export interface User {
  id: string
  nickname: string
  created_at: string
  last_active_at: string
}

export interface Project {
  id: string
  creator_id: string
  creator_nickname?: string
  name: string
  tagline?: string
  problem?: string
  solution?: string
  target_users?: string
  domain?: string
  features?: string
  tech_stack?: string
  mvp_plan?: string
  future_potential?: string
  image_url?: string
  hidden: boolean
  created_at: string
  updated_at: string
  // Computed scores (from backend)
  demo_score?: number
  time_score?: number
  technical_depth_score?: number
  influence_score?: number
  authenticity_score?: number
  simplicity_score?: number
  market_score?: number
  scalability_score?: number
  final_score?: number
  voter_count?: number
  voter_count_label?: string
  rank?: number
  rank_change?: number
  is_tied?: boolean
}

export interface Rating {
  id: string
  user_id: string
  project_id: string
  voter_nickname?: string
  demo: number
  time: number
  technical_depth: number
  influence: number
  authenticity: number
  simplicity: number
  market: number
  scalability: number
  created_at: string
  updated_at: string
  is_updated?: boolean  // updated_at != created_at
}

export interface Activity {
  id: string
  user_id?: string
  project_id?: string
  action: string
  metadata: Record<string, any>
  created_at: string
  // Formatted fields from backend
  message?: string
  actor_nickname?: string
  project_name?: string
}

export interface ScoreSnapshot {
  id: string
  project_id: string
  final_score: number
  rank?: number
  voter_count: number
  created_at: string
}

export interface CompetitionState {
  id: number
  status: 'draft' | 'voting_open' | 'voting_locked' | 'finished'
  locked_at?: string
  finished_at?: string
}

export interface ScaleLevel {
  min: number
  max: number
  label: string
}

export interface CriterionDefinition {
  key: string
  label: string
  weight: number
  description: string
  higherIsBetter: boolean
  directionLabel: string
  levels: ScaleLevel[]
}

export const CRITERIA: CriterionDefinition[] = [
  { 
    key: 'demo', 
    label: 'Demo', 
    weight: 0.22,
    description: 'Working quality, clarity, live impact & reliability.',
    higherIsBetter: true,
    directionLabel: 'Higher Score = Better',
    levels: [
      { min: 0, max: 20, label: 'Concept / Broken' },
      { min: 21, max: 40, label: 'Basic Prototype' },
      { min: 41, max: 60, label: 'Working Demo' },
      { min: 61, max: 80, label: 'Impressive & Live' },
      { min: 81, max: 100, label: 'Flawless & Standout' },
    ]
  },
  { 
    key: 'time', 
    label: 'Time Feasibility', 
    weight: 0.18,
    description: 'Realism to deliver a working MVP within 5 weeks (Faster build = High confidence score).',
    higherIsBetter: true,
    directionLabel: 'Higher Score = Faster / More Feasible',
    levels: [
      { min: 0, max: 20, label: 'High Risk (Needs 5+ Wks)' },
      { min: 21, max: 40, label: 'Needs ~4 Weeks' },
      { min: 41, max: 60, label: 'Needs ~3 Weeks' },
      { min: 61, max: 80, label: 'Needs ~2 Weeks' },
      { min: 81, max: 100, label: 'Fast Build (1 Wk Feasible)' },
    ]
  },
  { 
    key: 'technical_depth', 
    label: 'Technical Depth', 
    weight: 0.15,
    description: 'Engineering rigor, algorithms & architecture difficulty.',
    higherIsBetter: true,
    directionLabel: 'Higher Score = More Technical',
    levels: [
      { min: 0, max: 20, label: 'Very Basic' },
      { min: 21, max: 40, label: 'Easy' },
      { min: 41, max: 60, label: 'Medium' },
      { min: 61, max: 80, label: 'Advanced' },
      { min: 81, max: 100, label: 'Difficult / Expert' },
    ]
  },
  { 
    key: 'influence', 
    label: 'Influence', 
    weight: 0.14,
    description: 'Cybersecurity impact & severity of problem solved.',
    higherIsBetter: true,
    directionLabel: 'Higher Score = Higher Impact',
    levels: [
      { min: 0, max: 20, label: 'Minor Utility' },
      { min: 21, max: 40, label: 'Moderate Value' },
      { min: 41, max: 60, label: 'Meaningful Impact' },
      { min: 61, max: 80, label: 'High Security Impact' },
      { min: 81, max: 100, label: 'Game Changer' },
    ]
  },
  { 
    key: 'authenticity', 
    label: 'Authenticity', 
    weight: 0.12,
    description: 'Originality, novel approach & differentiation.',
    higherIsBetter: true,
    directionLabel: 'Higher Score = More Original',
    levels: [
      { min: 0, max: 20, label: 'Standard / Copy' },
      { min: 21, max: 40, label: 'Slight Variation' },
      { min: 41, max: 60, label: 'Fresh Take' },
      { min: 61, max: 80, label: 'Highly Original' },
      { min: 81, max: 100, label: 'Pioneering / Novel' },
    ]
  },
  { 
    key: 'simplicity', 
    label: 'Simplicity (Ease of Use)', 
    weight: 0.10,
    description: 'How easy, intuitive, and frictionless it is for users to set up, operate, and adopt.',
    higherIsBetter: true,
    directionLabel: 'Higher Score = Easier for Users',
    levels: [
      { min: 0, max: 20, label: 'Very Difficult / Steep Learning Curve' },
      { min: 21, max: 40, label: 'Hard / Needs Extensive Effort' },
      { min: 41, max: 60, label: 'Moderate / Standard Usability' },
      { min: 61, max: 80, label: 'Intuitive / User-Friendly' },
      { min: 81, max: 100, label: 'Effortless / Seamless for Users' },
    ]
  },
  { 
    key: 'market', 
    label: 'Market', 
    weight: 0.05,
    description: 'Target demand, commercial viability & user adoption.',
    higherIsBetter: true,
    directionLabel: 'Higher Score = Higher Demand',
    levels: [
      { min: 0, max: 20, label: 'Niche / Unclear' },
      { min: 21, max: 40, label: 'Emerging Interest' },
      { min: 41, max: 60, label: 'Solid Demand' },
      { min: 61, max: 80, label: 'Strong Commercial Fit' },
      { min: 81, max: 100, label: 'High Enterprise Demand' },
    ]
  },
  { 
    key: 'scalability', 
    label: 'Scalability', 
    weight: 0.04,
    description: 'Ability to grow to enterprise data, users & environments.',
    higherIsBetter: true,
    directionLabel: 'Higher Score = More Scalable',
    levels: [
      { min: 0, max: 20, label: 'Single User / Local' },
      { min: 21, max: 40, label: 'Small Team' },
      { min: 41, max: 60, label: 'Medium Enterprise' },
      { min: 61, max: 80, label: 'Large Multi-Tenant' },
      { min: 81, max: 100, label: 'Global / Unlimited Scale' },
    ]
  },
]

export type CriterionKey = string

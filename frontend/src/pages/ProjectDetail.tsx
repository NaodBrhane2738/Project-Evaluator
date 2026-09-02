import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Edit3,
  FileText,
  Users,
  Target,
  CheckCircle,
  Layers,
  Calendar,
  Sparkles,
  HelpCircle,
} from 'lucide-react'
import { api } from '../lib/api'
import type { Project, Rating } from '../types'
import { useUser } from '../hooks/useUser'
import { useCompetitionState } from '../hooks/useCompetitionState'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScoreRing } from '../components/ScoreRing'
import { RankBadge } from '../components/RankBadge'
import { ScoreBreakdown } from '../components/ScoreBreakdown'
import { VoterTable } from '../components/VoterTable'
import { VotingPanel } from '../components/VotingPanel'
import { SubmitProject } from './SubmitProject'
import { timeAgo } from '../lib/utils'
import { useUIPreferences } from '../context/UIPreferencesContext'
import { ResizableSplitPane } from '../components/ui/ResizableSplitPane'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userId } = useUser()
  const { status } = useCompetitionState()
  const { cardScale } = useUIPreferences()

  const [project, setProject] = useState<Project | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [forceEditingVote, setForceEditingVote] = useState(false)
  const [activeMainTab, setActiveMainTab] = useState<'info' | 'voters'>(() => {
    return (localStorage.getItem('ca_project_detail_main_tab') as 'info' | 'voters') || 'info'
  })

  const fetchData = async () => {
    if (!id) return
    try {
      const p = await api.getProject(id)
      const r = await api.getProjectRatings(id)
      setProject(p as Project)
      setRatings(r as Rating[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    localStorage.setItem('ca_project_detail_main_tab', activeMainTab)
  }, [activeMainTab])

  if (loading && !project) {
    return (
      <div style={{ padding: 40 }}>
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    )
  }

  if (!project) {
    return <div style={{ padding: 40, color: 'rgba(255,255,255,0.5)' }}>Project not found.</div>
  }

  const isCreator = project.creator_id === userId
  const userRating = ratings.find(r => r.user_id === userId)
  const votingLocked = status === 'voting_locked' || status === 'finished'

  if (isEditing) {
    return (
      <div style={{ paddingBottom: 40 }}>
        <SubmitProject
          initialData={project}
          isEditing={true}
          onCancel={() => {
            setIsEditing(false)
            fetchData()
          }}
        />
      </div>
    )
  }

  const scale = cardScale / 100

  // Left Content: Project Info Scrollable or Voters
  const leftContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(18 * scale) }}>
      {/* Primary Tab Switcher: Project Details vs Who Voted */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255,255,255,0.03)',
          padding: 4,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setActiveMainTab('info')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: '0.82rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: activeMainTab === 'info' ? '#ffffff' : 'transparent',
            color: activeMainTab === 'info' ? '#000000' : 'rgba(255,255,255,0.5)',
            transition: 'all 0.18s ease',
          }}
        >
          <FileText size={15} />
          <span>Project Proposal & Details</span>
        </button>

        <button
          onClick={() => setActiveMainTab('voters')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: '0.82rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: activeMainTab === 'voters' ? '#ffffff' : 'transparent',
            color: activeMainTab === 'voters' ? '#000000' : 'rgba(255,255,255,0.5)',
            transition: 'all 0.18s ease',
          }}
        >
          <Users size={15} />
          <span>Who Voted</span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '1px 6px',
              borderRadius: 999,
              background: activeMainTab === 'voters' ? '#000' : 'rgba(255,255,255,0.12)',
              color: activeMainTab === 'voters' ? '#fff' : 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--font-family-mono)',
            }}
          >
            {ratings.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Scrollable Comprehensive Project Information */}
      {activeMainTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(18 * scale) }}>
          {/* Problem & Solution */}
          <Card padding={Math.round(24 * scale)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#f87171',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8,
                  }}
                >
                  <Target size={14} /> The Problem
                </div>
                <div style={{ fontSize: `${0.92 * scale}rem`, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                  {project.problem || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No problem statement specified.</span>}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#34d399',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8,
                  }}
                >
                  <CheckCircle size={14} /> The Solution
                </div>
                <div style={{ fontSize: `${0.92 * scale}rem`, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                  {project.solution || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No solution specified.</span>}
                </div>
              </div>
            </div>
          </Card>

          {/* Target Users & Features */}
          <Card padding={Math.round(24 * scale)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#818cf8',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8,
                  }}
                >
                  <Users size={14} /> Target Users
                </div>
                <div style={{ fontSize: `${0.92 * scale}rem`, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                  {project.target_users || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No target users specified.</span>}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#fbbf24',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8,
                  }}
                >
                  <Sparkles size={14} /> Key Features
                </div>
                <div style={{ fontSize: `${0.92 * scale}rem`, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                  {project.features || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No features listed.</span>}
                </div>
              </div>
            </div>
          </Card>

          {/* Architecture & Tech Stack */}
          <Card padding={Math.round(24 * scale)}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              <Layers size={14} /> Technical Stack & Architecture
            </div>
            <div style={{ fontSize: `${0.92 * scale}rem`, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
              {project.tech_stack || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No tech stack details specified.</span>}
            </div>
          </Card>

          {/* 5-Week MVP Execution & Future Potential */}
          <Card padding={Math.round(24 * scale)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#a78bfa',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8,
                  }}
                >
                  <Calendar size={14} /> 5-Week MVP Execution Plan
                </div>
                <div style={{ fontSize: `${0.92 * scale}rem`, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                  {project.mvp_plan || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No MVP plan outlined.</span>}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#f472b6',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8,
                  }}
                >
                  <Sparkles size={14} /> Future Potential & Scaling
                </div>
                <div style={{ fontSize: `${0.92 * scale}rem`, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                  {project.future_potential || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No future potential provided.</span>}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Evaluators & Who Voted */}
      {activeMainTab === 'voters' && (
        <Card padding={Math.round(24 * scale)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: `${1.1 * scale}rem`, fontWeight: 700, margin: '0 0 4px 0' }}>
                Evaluator Breakdown
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                Transparent scores across all 8 criteria submitted by competitors
              </div>
            </div>
          </div>
          <VoterTable
            ratings={ratings}
            currentUserId={userId}
            onEditRating={() => {
              setForceEditingVote(true)
              const el = document.getElementById('voting-panel-card')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </Card>
      )}
    </div>
  )

  // Right Content: Voting Panel & Score Breakdown
  const rightContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(24 * scale) }}>
      {/* Vote / Expectation Section */}
      <VotingPanel
        projectId={project.id}
        existingRating={userRating}
        votingLocked={votingLocked}
        isCreator={isCreator}
        forceEditing={forceEditingVote}
        onSubmit={() => {
          setForceEditingVote(false)
          fetchData()
        }}
      />

      {/* Breakdown Section */}
      <ScoreBreakdown project={project} />

      <Card padding={16} style={{ background: 'rgba(74,222,128,0.05)', borderColor: 'rgba(74,222,128,0.2)' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
          <HelpCircle size={14} /> Why does it rank here?
        </h4>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          {project.rank === 1
            ? `Ranked #1 because it has the highest weighted final score of ${(project.final_score || 0).toFixed(2)}.`
            : `Ranked #${project.rank} based on final score of ${(project.final_score || 0).toFixed(2)}.`}
        </p>
      </Card>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(24 * scale), paddingBottom: 40 }}>
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {userRating && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit3 size={14} />}
              onClick={() => {
                setForceEditingVote(true)
                const el = document.getElementById('voting-panel-card')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {isCreator ? 'Update Your Expectations' : 'Edit Your Vote'}
            </Button>
          )}
          {isCreator && (
            <Button variant="outline" size="sm" icon={<Edit3 size={14} />} onClick={() => setIsEditing(true)}>
              Edit Project Details
            </Button>
          )}
        </div>
      </div>

      {/* Header card */}
      <Card
        padding={Math.round(32 * scale)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {project.rank !== undefined && <RankBadge rank={project.rank} size="lg" />}
          <div>
            {project.domain && (
              <span
                style={{
                  fontSize: '0.7rem',
                  background: 'rgba(129, 140, 248, 0.15)',
                  color: '#818cf8',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  display: 'inline-block',
                }}
              >
                {project.domain}
              </span>
            )}
            <h1 style={{ fontSize: `${2 * scale}rem`, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              {project.name}
            </h1>
            <p style={{ fontSize: `${1 * scale}rem`, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px 0', whiteSpace: 'pre-wrap' }}>
              {project.tagline}
            </p>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', alignItems: 'center' }}>
              <span>
                Submitted by <span style={{ color: '#fff', fontWeight: 600 }}>{project.creator_nickname}</span>
              </span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {timeAgo(project.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <ScoreRing score={project.final_score || 0} size={Math.round(120 * scale)} strokeWidth={6} label="Final Score" />
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
            {project.voter_count_label || `${project.voter_count || 0} voters`}
          </div>
        </div>
      </Card>

      {/* Drag-resizable split pane between Left (Info & Voters) and Right (Voting & Scores) */}
      <ResizableSplitPane
        left={leftContent}
        right={rightContent}
        defaultSplitPercent={64}
        minLeftPx={360}
        minRightPx={300}
        storageKey="ca_project_detail_split_percent"
      />
    </div>
  )
}

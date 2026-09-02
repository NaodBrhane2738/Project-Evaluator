import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Users, Star, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { MetricCard, Card } from '../components/ui/Card'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useActivity } from '../hooks/useActivity'
import { ProjectCard } from '../components/ProjectCard'
import { ActivityFeed } from '../components/ActivityFeed'
import { ScoreRing } from '../components/ScoreRing'
import { CompetitionStatus } from '../components/CompetitionStatus'
import { useCompetitionState } from '../hooks/useCompetitionState'
import { useUIPreferences } from '../context/UIPreferencesContext'
import { api } from '../lib/api'
import { ResizableSplitPane } from '../components/ui/ResizableSplitPane'

export function Dashboard() {
  const navigate = useNavigate()
  const { projects, loading: ldLoading } = useLeaderboard('overall')
  const { activities } = useActivity()
  const { status } = useCompetitionState()
  const { cardScale } = useUIPreferences()

  const [stats, setStats] = useState<{ total_participants?: number; total_ratings?: number }>({})

  useEffect(() => {
    api
      .getStats()
      .then(data => {
        if (data) setStats(data as any)
      })
      .catch(() => {})
  }, [])

  const topProject = projects[0]
  const top10 = projects.slice(0, 10)
  const movers = [...projects]
    .filter(p => (p.rank_change || 0) !== 0)
    .sort((a, b) => Math.abs(b.rank_change || 0) - Math.abs(a.rank_change || 0))
    .slice(0, 3)

  const scale = cardScale / 100

  // Left Column: Top 10 Leaderboard & Movers
  const leaderboardColumn = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(16 * scale) }}>
      <h3 style={{ fontSize: `${1.1 * scale}rem`, fontWeight: 700, margin: 0 }}>Top 10 Leaderboard</h3>
      {ldLoading && projects.length === 0 ? (
        <div className="skeleton" style={{ height: 100 }} />
      ) : top10.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(12 * scale) }}>
          {top10.map(p => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <Card padding={40} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          No projects yet. Be the first to submit!
        </Card>
      )}

      {movers.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: `${1.1 * scale}rem`, fontWeight: 700, margin: '0 0 16px 0' }}>
            Biggest Movers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(12 * scale) }}>
            {movers.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Right Column: Activity Feed
  const activityColumn = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(16 * scale) }}>
      <h3 style={{ fontSize: `${1.1 * scale}rem`, fontWeight: 700, margin: 0 }}>Activity Feed</h3>
      <Card padding={16} style={{ maxHeight: 600, overflowY: 'auto' }}>
        <ActivityFeed activities={activities.slice(0, 20)} />
      </Card>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(24 * scale) }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: `${1.4 * scale}rem`, fontWeight: 800, margin: 0 }}>Project Evaluator</h1>
          <CompetitionStatus status={status} />
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/projects/new')}>
          Submit Project
        </Button>
      </div>

      {/* Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: Math.round(16 * scale),
        }}
      >
        <MetricCard
          icon={<Trophy size={Math.round(18 * scale)} color="#fff" />}
          label="Projects Submitted"
          value={projects.length}
        />
        <MetricCard
          icon={<Users size={Math.round(18 * scale)} color="#fff" />}
          label="Total Participants"
          value={stats.total_participants ?? '-'}
        />
        <MetricCard
          icon={<Star size={Math.round(18 * scale)} color="#fff" />}
          label="Total Ratings"
          value={stats.total_ratings ?? '-'}
        />
        <MetricCard
          icon={<Trophy size={Math.round(18 * scale)} color="#fbbf24" />}
          label="#1 Project Score"
          value={topProject ? topProject.final_score?.toFixed(2) || '0.00' : '0.00'}
        />
      </div>

      {/* Current Leader Spotlight Banner */}
      {topProject && (
        <Card
          hover
          onClick={() => navigate(`/projects/${topProject.id}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(255,255,255,0.02) 100%)',
            borderColor: 'rgba(251,191,36,0.25)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                color: '#fbbf24',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 6,
                letterSpacing: '0.06em',
              }}
            >
              Current Leader
            </div>
            <h2 style={{ fontSize: `${1.5 * scale}rem`, fontWeight: 800, margin: '0 0 4px 0' }}>
              {topProject.name}
            </h2>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>
              by {topProject.creator_nickname}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: `${2 * scale}rem`,
                  fontWeight: 800,
                  fontFamily: 'var(--font-family-mono)',
                  color: '#fff',
                }}
              >
                {topProject.final_score?.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                {topProject.voter_count_label}
              </div>
            </div>
            <ScoreRing
              score={topProject.final_score || 0}
              size={Math.round(80 * scale)}
              strokeWidth={5}
              showScore={false}
            />
          </div>
        </Card>
      )}

      {/* Edge-Draggable Split Pane between Leaderboard and Activity Feed */}
      <ResizableSplitPane
        left={leaderboardColumn}
        right={activityColumn}
        defaultSplitPercent={66}
        minLeftPx={360}
        minRightPx={260}
        storageKey="ca_dashboard_split_percent"
      />
    </div>
  )
}

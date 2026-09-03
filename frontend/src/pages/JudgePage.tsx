import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Project } from '../types'
import { useCompetitionState } from '../hooks/useCompetitionState'
import { CompetitionStatus } from '../components/CompetitionStatus'
import { ScoreBreakdown } from '../components/ScoreBreakdown'
import { RankBadge } from '../components/RankBadge'

export function JudgePage() {
  const { status } = useCompetitionState()
  const [projects, setProjects] = useState<Project[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    api.getLeaderboard('overall').then(data => setProjects((data as Project[]).slice(0, 10))).catch(console.error)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Live Judging Dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: '0.85rem' }}>Top 10 competition ranking & presentation view</p>
        </div>
        <CompetitionStatus status={status} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
            <div onClick={() => setExpanded(expanded === p.id ? null : p.id)} style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {p.rank !== undefined && <RankBadge rank={p.rank} size="lg" />}
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px' }}>{p.name}</h2>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>by {p.creator_nickname}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '2rem', fontWeight: 800 }}>{(p.final_score||0).toFixed(2)}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{p.voter_count_label}</div>
              </div>
            </div>
            {expanded === p.id && (
              <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                  <ScoreBreakdown project={p} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

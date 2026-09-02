import { useNavigate } from 'react-router-dom'
import type { Project } from '../types'
import { RankBadge } from './RankBadge'
import { RankMovement } from './RankMovement'
import { ScoreRing } from './ScoreRing'
import { useUIPreferences } from '../context/UIPreferencesContext'

interface Props {
  project: Project
  showRank?: boolean
}

export function ProjectCard({ project, showRank = true }: Props) {
  const navigate = useNavigate()
  const { cardDensity, cardScale, freeformResize } = useUIPreferences()

  const scale = cardScale / 100
  const isCompact = cardDensity === 'compact'
  const isLarge = cardDensity === 'large'

  const pad = isCompact ? Math.round(12 * scale) : isLarge ? Math.round(24 * scale) : Math.round(18 * scale)
  const ringSize = isCompact ? Math.round(52 * scale) : isLarge ? Math.round(76 * scale) : Math.round(64 * scale)

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="anim-fade-up glass-md"
      style={{
        borderRadius: isCompact ? 12 : isLarge ? 20 : 16,
        padding: pad,
        cursor: 'pointer',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: Math.round(16 * scale),
        resize: freeformResize ? 'both' : undefined,
        overflow: freeformResize ? 'auto' : 'hidden',
        minWidth: freeformResize ? 220 : undefined,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {showRank && project.rank !== undefined && (
        <div style={{ flexShrink: 0 }}>
          <RankBadge rank={project.rank} size={isCompact ? 'sm' : isLarge ? 'lg' : 'md'} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {project.domain && (
          <div
            style={{
              fontSize: `${0.65 * (isCompact ? 0.9 : 1.0)}rem`,
              color: '#818cf8',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            {project.domain}
          </div>
        )}
        <h3
          style={{
            fontSize: `${1.05 * scale * (isCompact ? 0.9 : 1.0)}rem`,
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 3px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {project.name}
        </h3>
        <div
          style={{
            fontSize: `${0.8 * (isCompact ? 0.9 : 1.0)}rem`,
            color: 'rgba(255,255,255,0.6)',
            margin: '0 0 6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {project.tagline || 'No tagline'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: `${0.75 * (isCompact ? 0.9 : 1.0)}rem`, color: 'rgba(255,255,255,0.4)' }}>
            by <span style={{ color: '#fff', fontWeight: 600 }}>{project.creator_nickname || 'Unknown'}</span>
          </span>
          {showRank && project.rank_change !== undefined && (
            <RankMovement change={project.rank_change} />
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
          <ScoreRing score={project.final_score || 0} size={ringSize} strokeWidth={isCompact ? 3 : 4} showScore={false} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-family-mono)',
              fontSize: `${1.05 * scale * (isCompact ? 0.85 : 1.0)}rem`,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {(project.final_score || 0).toFixed(1)}
          </div>
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: `${0.65 * (isCompact ? 0.9 : 1.0)}rem`,
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
          }}
        >
          {project.voter_count_label || `${project.voter_count || 0} votes`}
        </div>
      </div>

      {freeformResize && (
        <div
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 10,
            height: 10,
            opacity: 0.3,
            borderRight: '2px solid #fff',
            borderBottom: '2px solid #fff',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

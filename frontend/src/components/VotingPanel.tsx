import { useState, useEffect } from 'react'
import type { Rating } from '../types'
import { CRITERIA } from '../types'
import { api } from '../lib/api'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Info, Edit3, Trash2, CheckCircle2, RotateCcw } from 'lucide-react'
import { timeAgo } from '../lib/utils'

interface Props {
  projectId: string
  existingRating?: Rating | null
  onSubmit?: () => void
  votingLocked?: boolean
  isCreator?: boolean
  forceEditing?: boolean
}

export function VotingPanel({
  projectId,
  existingRating,
  onSubmit,
  votingLocked,
  isCreator,
  forceEditing,
}: Props) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [editing, setEditing] = useState(!existingRating)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (existingRating) {
      const s: Record<string, number> = {}
      CRITERIA.forEach(c => {
        s[c.key] = existingRating[c.key as keyof Rating] as number
      })
      setScores(s)
      if (forceEditing) {
        setEditing(true)
      } else {
        setEditing(false)
      }
    } else {
      const s: Record<string, number> = {}
      CRITERIA.forEach(c => {
        s[c.key] = 50
      })
      setScores(s)
      setEditing(true)
    }
  }, [existingRating, forceEditing])

  const getLevelLabel = (criterionKey: string, scoreVal: number) => {
    const crit = CRITERIA.find(c => c.key === criterionKey)
    if (!crit) return ''
    const lvl = crit.levels.find(l => scoreVal >= l.min && scoreVal <= l.max)
    return lvl ? lvl.label : ''
  }

  const currentFinalScore = CRITERIA.reduce((acc, c) => acc + (scores[c.key] || 0) * c.weight, 0)
  const existingFinalScore = existingRating
    ? CRITERIA.reduce((acc, c) => acc + ((existingRating[c.key as keyof Rating] as number) || 0) * c.weight, 0)
    : null

  const allSet = CRITERIA.every(c => scores[c.key] !== undefined)

  const handleSubmit = async () => {
    if (votingLocked || !allSet) return
    setLoading(true)
    setError(null)
    try {
      await api.submitRating(projectId, scores)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
      if (onSubmit) onSubmit()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRating = async () => {
    if (!window.confirm('Are you sure you want to retract / delete your vote?')) return
    setLoading(true)
    setError(null)
    try {
      await api.deleteRating(projectId)
      setEditing(true)
      const s: Record<string, number> = {}
      CRITERIA.forEach(c => {
        s[c.key] = 50
      })
      setScores(s)
      if (onSubmit) onSubmit()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (votingLocked) {
    return (
      <Card padding={24} style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 8px', color: '#fbbf24' }}>Voting is locked</h3>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
          The competition has ended or voting has been paused.
        </p>
        {!editing && existingRating && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-family-mono)', fontWeight: 700 }}>
              {isCreator ? 'Your Expectation Score: ' : 'Your Rating: '}
              {currentFinalScore.toFixed(2)}
            </div>
          </div>
        )}
      </Card>
    )
  }

  // Summary View when user has already voted and is not actively editing
  if (!editing && existingRating) {
    return (
      <Card padding={24} id="voting-panel-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <CheckCircle2 size={16} color="#34d399" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                {isCreator ? 'Your Project Expectations' : 'Your Submitted Vote'}
              </h3>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
              Last updated {timeAgo(existingRating.updated_at)} {existingRating.is_updated && '(edited)'}
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Edit3 size={13} />}
            onClick={() => setEditing(true)}
          >
            {isCreator ? 'Edit Expectations' : 'Edit Your Vote'}
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CRITERIA.map(c => {
            const scoreVal = scores[c.key] || 0
            const levelText = getLevelLabel(c.key, scoreVal)
            return (
              <div
                key={c.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '8px 12px',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {c.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 800, fontSize: '0.88rem' }}>
                    {scoreVal}
                  </span>
                </div>
                <span style={{ fontSize: '0.66rem', color: '#818cf8', fontWeight: 600 }}>
                  {levelText}
                </span>
              </div>
            )
          })}
        </div>

        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
              {isCreator ? 'Your Benchmark Score' : 'Your Overall Score'}
            </div>
            <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.35rem', fontWeight: 800 }}>
              {currentFinalScore.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleDeleteRating}
              title="Delete and retract your vote"
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(248,113,113,0.7)',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.7)')}
            >
              <Trash2 size={12} /> Delete Vote
            </button>
            <Button
              variant="outline"
              size="sm"
              icon={<Edit3 size={13} />}
              onClick={() => setEditing(true)}
            >
              Change Scores
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Active Voting / Editing Mode
  return (
    <Card padding={24} id="voting-panel-card">
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              {isCreator
                ? existingRating
                  ? 'Update Project Expectations'
                  : 'Rate Your Expectations'
                : existingRating
                ? 'Edit Your Vote'
                : 'Submit Your Evaluation'}
            </h3>
            {existingRating && (
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: '#fbbf24',
                  color: '#000',
                }}
              >
                EDIT MODE
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
            {isCreator
              ? 'Adjust your target benchmarks and expectations across all 8 criteria.'
              : existingRating
              ? 'Modify any score below to update your evaluation. Changes update the leaderboard immediately.'
              : 'Evaluate this project from 0 to 100 on each criterion.'}
          </p>
        </div>

        {existingRating && (
          <button
            onClick={() => {
              const s: Record<string, number> = {}
              CRITERIA.forEach(c => {
                s[c.key] = existingRating[c.key as keyof Rating] as number
              })
              setScores(s)
              setEditing(false)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <RotateCcw size={12} /> Cancel Edit
          </button>
        )}
      </div>

      {/* 8 Criteria Sliders & Scale Level Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CRITERIA.map(c => {
          const scoreVal = scores[c.key] || 0
          const levelText = getLevelLabel(c.key, scoreVal)
          return (
            <div
              key={c.key}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 400 }}>
                    ({(c.weight * 100).toFixed(0)}%)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#818cf8',
                      background: 'rgba(129,140,248,0.1)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    {levelText}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreVal}
                    onChange={e => {
                      const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                      setScores({ ...scores, [c.key]: val })
                    }}
                    style={{
                      width: 50,
                      padding: '2px 6px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 6,
                      color: '#fff',
                      textAlign: 'center',
                      fontFamily: 'var(--font-family-mono)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Criterion description & guidance */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.68rem',
                  color: 'rgba(255,255,255,0.45)',
                  marginBottom: 8,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Info size={11} /> {c.description}
                </span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>{c.directionLabel}</span>
              </div>

              {/* Scale Levels Milestone Chips */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                {c.levels.map(lvl => {
                  const isCurrent = scoreVal >= lvl.min && scoreVal <= lvl.max
                  return (
                    <button
                      key={lvl.label}
                      type="button"
                      onClick={() => {
                        const mid = Math.round((lvl.min + lvl.max) / 2)
                        setScores({ ...scores, [c.key]: mid })
                      }}
                      style={{
                        background: isCurrent ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isCurrent ? '#fff' : 'rgba(255,255,255,0.06)'}`,
                        color: isCurrent ? '#fff' : 'rgba(255,255,255,0.45)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: '0.62rem',
                        cursor: 'pointer',
                        fontWeight: isCurrent ? 700 : 400,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {lvl.label}
                    </button>
                  )
                })}
              </div>

              {/* Score Range Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={scoreVal}
                onChange={e => setScores({ ...scores, [c.key]: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#fff' }}
              />
            </div>
          )
        })}
      </div>

      {/* Footer Controls & Submit */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
            {existingFinalScore !== null
              ? `Score: ${existingFinalScore.toFixed(2)} → Updated: `
              : isCreator
              ? 'Expected Weighted Score'
              : 'Weighted Final Score'}
          </div>
          <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {currentFinalScore.toFixed(2)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {existingRating && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const s: Record<string, number> = {}
                CRITERIA.forEach(c => {
                  s[c.key] = existingRating[c.key as keyof Rating] as number
                })
                setScores(s)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
          )}

          <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!allSet}>
            {isCreator
              ? existingRating
                ? 'Save Updated Expectations'
                : 'Submit Expectations'
              : existingRating
              ? 'Save & Update Vote'
              : 'Submit Vote'}
          </Button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
            color: 'rgba(248,113,113,0.9)',
            fontSize: '0.8rem',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: 14,
            color: 'rgba(74,222,128,0.9)',
            fontSize: '0.8rem',
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={14} /> Vote updated successfully!
        </div>
      )}
    </Card>
  )
}

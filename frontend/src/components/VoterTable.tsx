import { useState, useEffect } from 'react'
import type { Rating } from '../types'
import { CRITERIA } from '../types'
import { timeAgo } from '../lib/utils'
import { Edit3, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/Button'

interface Props {
  ratings: Rating[]
  currentUserId?: string | null
  onEditRating?: () => void
}

export function VoterTable({ ratings, currentUserId, onEditRating }: Props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const userVote = currentUserId ? ratings.find(r => r.user_id === currentUserId) : null

  if (ratings.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
        No votes recorded yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Callout if current user has already voted */}
      {userVote && onEditRating && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} color="#fbbf24" />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                You have submitted a vote for this project
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                Last updated {timeAgo(userVote.updated_at)} {userVote.is_updated && '(edited)'}
              </div>
            </div>
          </div>
          <Button variant="primary" size="sm" icon={<Edit3 size={13} />} onClick={onEditRating}>
            Edit Your Vote
          </Button>
        </div>
      )}

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ratings.map(r => {
            const isMe = currentUserId && r.user_id === currentUserId
            return (
              <div
                key={r.id}
                className="glass-md"
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: isMe ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: isMe ? 'rgba(251,191,36,0.05)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 700, color: isMe ? '#fbbf24' : '#fff' }}>
                      {r.voter_nickname || 'Unknown'}
                    </div>
                    {isMe && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: '#fbbf24',
                          color: '#000',
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                      {timeAgo(r.updated_at)} {r.is_updated && '(edited)'}
                    </div>
                    {isMe && onEditRating && (
                      <button
                        onClick={onEditRating}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.75rem' }}>
                  {CRITERIA.map(c => (
                    <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
                      <span style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 700 }}>
                        {r[c.key as keyof Rating] as number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Voter</th>
                {CRITERIA.map(c => (
                  <th key={c.key} style={{ textAlign: 'right', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{c.label}</th>
                ))}
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Updated</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, width: 80 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map(r => {
                const isMe = currentUserId && r.user_id === currentUserId
                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.2s ease',
                      background: isMe ? 'rgba(251,191,36,0.06)' : 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = isMe ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isMe ? 'rgba(251,191,36,0.06)' : 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: isMe ? '#fbbf24' : '#fff' }}>{r.voter_nickname || 'Unknown'}</span>
                        {isMe && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: '#fbbf24',
                              color: '#000',
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    {CRITERIA.map(c => (
                      <td key={c.key} style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'var(--font-family-mono)', color: 'rgba(255,255,255,0.85)' }}>
                        {r[c.key as keyof Rating] as number}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                      {timeAgo(r.updated_at)} {r.is_updated && <span style={{ color: '#fbbf24' }}> (edited)</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 16px' }}>
                      {isMe && onEditRating ? (
                        <button
                          onClick={onEditRating}
                          title="Edit your vote"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#ffffff'
                            e.currentTarget.style.color = '#000000'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                            e.currentTarget.style.color = '#ffffff'
                          }}
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

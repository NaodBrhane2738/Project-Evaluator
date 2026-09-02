import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Project } from '../types'
import { CRITERIA } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Search, X, Trophy, Sparkles, ArrowRight } from 'lucide-react'

export function Comparison() {
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getProjects()
      .then(data => {
        const projs = (data as Project[]) || []
        setAllProjects(projs)
        // Automatically pre-select top 3 projects if none are selected yet
        if (projs.length >= 2 && selectedIds.length === 0) {
          setSelectedIds(projs.slice(0, 3).map(p => p.id))
        }
      })
      .catch(console.error)
  }, [])

  const selectedProjects = selectedIds
    .map(id => allProjects.find(p => p.id === id))
    .filter(Boolean) as Project[]

  const searchResults = allProjects
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && !selectedIds.includes(p.id))
    .slice(0, 6)

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id))
    } else {
      if (selectedIds.length >= 3) return
      setSelectedIds([...selectedIds, id])
    }
  }

  const selectPresetTop3 = () => {
    setSelectedIds(allProjects.slice(0, 3).map(p => p.id))
  }

  const getWinner = (key: string) => {
    if (selectedProjects.length < 2) return null
    let max = -1
    let winnerId: string | null = null
    selectedProjects.forEach(p => {
      const score = (p as any)[`${key}_score`] || (key === 'final' ? p.final_score : 0) || 0
      if (score > max) {
        max = score
        winnerId = p.id
      }
    })
    return winnerId
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Head-to-Head Project Comparison
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
            Compare up to 3 projects side-by-side across all 8 competition criteria.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {allProjects.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              icon={<Sparkles size={13} color="#fbbf24" />}
              onClick={selectPresetTop3}
            >
              Compare Top 3
            </Button>
          )}
          {selectedIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Clear Selection
            </Button>
          )}
        </div>
      </div>

      {/* Search & Quick-Select Chips */}
      <Card padding={16} style={{ position: 'relative', zIndex: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
              }}
            />
            <input
              type="text"
              className="input"
              placeholder={selectedIds.length >= 3 ? "Max 3 projects selected (remove one to add another)" : "Search projects to add to comparison..."}
              disabled={selectedIds.length >= 3}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          {/* Quick Select Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              Available Projects:
            </span>
            {allProjects.map(p => {
              const isSelected = selectedIds.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => toggleSelection(p.id)}
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.1)'}`,
                    color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)',
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{p.name.split(':')[0]}</span>
                  {isSelected && <X size={11} />}
                </button>
              )
            })}
          </div>

          {/* Autocomplete Dropdown */}
          {search && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                marginTop: 4,
                padding: 6,
                boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                zIndex: 9999,
              }}
            >
              {searchResults.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    toggleSelection(p.id)
                    setSearch('')
                  }}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
                      {p.domain} • by {p.creator_nickname}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {(p.final_score || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Side-by-Side Comparison Table */}
      {selectedProjects.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: '18px 20px',
                    textAlign: 'left',
                    width: 200,
                    background: 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                    Evaluation Criteria
                  </span>
                </th>
                {selectedProjects.map(p => {
                  const isOverallLeader = getWinner('final') === p.id && selectedProjects.length > 1
                  return (
                    <th
                      key={p.id}
                      style={{
                        padding: '18px 20px',
                        textAlign: 'center',
                        background: isOverallLeader ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        borderLeft: '1px solid rgba(255,255,255,0.06)',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ textAlign: 'left' }}>
                          {isOverallLeader && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                background: '#fbbf24',
                                color: '#000',
                                padding: '1px 6px',
                                borderRadius: 4,
                                textTransform: 'uppercase',
                                marginBottom: 4,
                              }}
                            >
                              <Trophy size={10} /> Overall Leader
                            </span>
                          )}
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                            {p.domain} • by <strong style={{ color: '#fff' }}>{p.creator_nickname}</strong>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSelection(p.id)}
                          title="Remove from comparison"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                            display: 'flex',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                        <Link
                          to={`/projects/${p.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.72rem',
                            color: '#818cf8',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          View Project <ArrowRight size={11} />
                        </Link>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {/* Final Score Row */}
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <td
                  style={{
                    padding: '16px 20px',
                    fontWeight: 800,
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={{ fontSize: '0.95rem' }}>Final Score</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
                    100% Weighted Total
                  </div>
                </td>
                {selectedProjects.map(p => {
                  const isWinner = getWinner('final') === p.id && selectedProjects.length > 1
                  return (
                    <td
                      key={p.id}
                      style={{
                        padding: '16px 20px',
                        textAlign: 'center',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '1.45rem',
                        fontWeight: isWinner ? 900 : 600,
                        color: isWinner ? '#fbbf24' : 'rgba(255,255,255,0.75)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        borderLeft: '1px solid rgba(255,255,255,0.06)',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        background: isWinner ? 'rgba(251,191,36,0.06)' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span>{(p.final_score || 0).toFixed(2)}</span>
                        {isWinner && <Trophy size={16} color="#fbbf24" />}
                      </div>
                    </td>
                  )
                })}
              </tr>

              {/* 8 Criteria Rows */}
              {CRITERIA.map(c => {
                const winnerId = getWinner(c.key)
                return (
                  <tr
                    key={c.key}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{c.label}</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                          ({(c.weight * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {c.description}
                      </div>
                    </td>

                    {selectedProjects.map(p => {
                      const score = (p as any)[`${c.key}_score`] || 0
                      const isWinner = winnerId === p.id && selectedProjects.length > 1
                      return (
                        <td
                          key={p.id}
                          style={{
                            padding: '14px 20px',
                            textAlign: 'center',
                            fontFamily: 'var(--font-family-mono)',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            borderLeft: '1px solid rgba(255,255,255,0.06)',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            background: isWinner ? 'rgba(251,191,36,0.04)' : undefined,
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  fontSize: '1rem',
                                  fontWeight: isWinner ? 800 : 500,
                                  color: isWinner ? '#fbbf24' : '#fff',
                                }}
                              >
                                {score.toFixed(2)}
                              </span>
                              {isWinner && (
                                <span
                                  style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: 'rgba(251,191,36,0.2)',
                                    color: '#fbbf24',
                                  }}
                                >
                                  BEST
                                </span>
                              )}
                            </div>

                            {/* Mini Visual Bar */}
                            <div
                              style={{
                                width: '80%',
                                height: 4,
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.08)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(0, score))}%`,
                                  height: '100%',
                                  background: isWinner ? '#fbbf24' : '#ffffff',
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Card padding={48} style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#fff', fontWeight: 600 }}>
            {allProjects.length < 2
              ? 'At least 2 projects are required for head-to-head comparison.'
              : 'No projects selected for comparison.'}
          </p>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            {allProjects.length < 2
              ? 'Submit more projects to compare their criteria and benchmarks side-by-side.'
              : 'Select up to 3 projects using the chips or search bar above.'}
          </p>
          {allProjects.length >= 2 && (
            <Button variant="primary" size="sm" onClick={selectPresetTop3}>
              Compare Top Projects Now
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}

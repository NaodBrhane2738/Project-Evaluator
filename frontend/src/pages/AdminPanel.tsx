import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useCompetitionState } from '../hooks/useCompetitionState'

export function AdminPanel() {
  const { state } = useCompetitionState()
  const [actionLoading, setActionLoading] = useState(false)
  const [stats, setStats] = useState<{ users?: number; projects?: number; ratings?: number } | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats()
      if (data) setStats(data as any)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleAction = async (action: 'lock' | 'unlock' | 'finish') => {
    setActionLoading(true)
    try {
      if (action === 'lock') await api.lockVoting()
      if (action === 'unlock') await api.unlockVoting()
      if (action === 'finish') await api.finishCompetition()
      window.location.reload()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Admin Panel</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <Card padding={24}>
          <h3 style={{ margin: '0 0 16px' }}>Competition Control</h3>
          <div style={{ marginBottom: 20, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
            Current State: <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{state?.status || 'Unknown'}</strong>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="primary" loading={actionLoading} onClick={() => handleAction('unlock')}>Open Voting</Button>
            <Button variant="danger" loading={actionLoading} onClick={() => handleAction('lock')}>Lock Voting</Button>
            <Button variant="outline" loading={actionLoading} onClick={() => handleAction('finish')}>Finish Competition</Button>
          </div>
        </Card>

        <Card padding={24}>
          <h3 style={{ margin: '0 0 16px' }}>Live Platform Stats</h3>
          {loadingStats ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Loading platform stats…</div>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Users</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', marginTop: 4 }}>
                  {stats.users ?? 0}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Projects</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', marginTop: 4 }}>
                  {stats.projects ?? 0}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Ratings</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', marginTop: 4, color: '#34d399' }}>
                  {stats.ratings ?? 0}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Failed to load stats.</div>
          )}
        </Card>
      </div>
    </div>
  )
}

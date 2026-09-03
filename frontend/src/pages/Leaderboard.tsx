import { useState, useEffect } from 'react'
import { Trophy, Star, Zap, Server, Share2, ShieldCheck, Minimize2, BarChart, Maximize, Clock, Users } from 'lucide-react'
import { api } from '../lib/api'
import { useLeaderboard } from '../hooks/useLeaderboard'
import type { User } from '../types'
import { Card } from '../components/ui/Card'
import { ProjectCard } from '../components/ProjectCard'
import { useUIPreferences } from '../context/UIPreferencesContext'

const TABS = [
  { id: 'overall', label: 'Overall', icon: Trophy },
  { id: 'most_voted', label: 'Most Voted', icon: Star },
  { id: 'demo', label: 'Best Demo', icon: Zap },
  { id: 'time', label: 'Best Time', icon: Clock },
  { id: 'technical_depth', label: 'Best Technical', icon: Server },
  { id: 'influence', label: 'Most Influential', icon: Share2 },
  { id: 'authenticity', label: 'Most Authentic', icon: ShieldCheck },
  { id: 'simplicity', label: 'Simplest', icon: Minimize2 },
  { id: 'market', label: 'Best Market', icon: BarChart },
  { id: 'scalability', label: 'Most Scalable', icon: Maximize },
  { id: 'people', label: 'People', icon: Users },
]

export function Leaderboard() {
  const { cardScale } = useUIPreferences()
  const [tab, setTab] = useState(() => localStorage.getItem('ca_leaderboard_tab') || 'overall')
  const { projects, loading } = useLeaderboard(tab !== 'people' ? tab : 'overall')
  const [people, setPeople] = useState<User[]>([])

  useEffect(() => {
    localStorage.setItem('ca_leaderboard_tab', tab)
    if (tab === 'people') {
      api.getPeopleLeaderboard().then(data => setPeople(data as User[])).catch(console.error)
    }
  }, [tab])

  const scale = cardScale / 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(24 * scale) }}>
      <h1 style={{ fontSize: `${1.4 * scale}rem`, fontWeight: 800, margin: 0 }}>Leaderboard</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: tab === id ? '#fff' : 'transparent',
              color: tab === id ? '#000' : 'rgba(255,255,255,0.5)',
              border: 'none', padding: '8px 16px', borderRadius: 12,
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 100 }} />
          <div className="skeleton" style={{ height: 100 }} />
        </div>
      ) : tab === 'people' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: Math.round(16 * scale) }}>
          {people.filter(u => u.nickname?.toUpperCase() !== 'ADMIN').map((u, i) => (
            <Card key={u.id} padding={20} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                #{i + 1}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{u.nickname}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  Active participant
                </div>
              </div>
            </Card>
          ))}
          {people.filter(u => u.nickname?.toUpperCase() !== 'ADMIN').length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)' }}>No participants to display.</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(12 * scale) }}>
          {projects.length > 0 ? projects.map(p => (
            <ProjectCard key={p.id} project={p} />
          )) : (
            <Card padding={40} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No projects to display.</Card>
          )}
        </div>
      )}
    </div>
  )
}

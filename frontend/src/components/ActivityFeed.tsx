import { timeAgo } from '../lib/utils'
import type { Activity } from '../types'

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  const visibleActivities = activities.filter(a => {
    const nick = (a.actor_nickname || '').toUpperCase()
    if (nick === 'ADMIN') return false
    const msg = a.message || ''
    if (msg.toLowerCase().startsWith('admin ')) return false
    return true
  })

  if (visibleActivities.length === 0) {
    return <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', padding: 20 }}>No activity yet.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {visibleActivities.map((a, i) => (
        <div key={a.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.action === 'rating_submitted' ? '#34d399' : '#818cf8', marginTop: 6, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.4 }}>
              {a.message || `${a.actor_nickname || 'Someone'} did ${a.action}`}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {timeAgo(a.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

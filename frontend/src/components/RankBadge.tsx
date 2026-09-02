interface Props {
  rank: number
  size?: 'sm' | 'md' | 'lg'
}

export function RankBadge({ rank, size = 'md' }: Props) {
  let color = 'rgba(255,255,255,0.3)'
  let bg = 'rgba(255,255,255,0.05)'
  let border = 'rgba(255,255,255,0.1)'

  if (rank === 1) { color = 'var(--color-rank-gold)'; bg = 'rgba(251,191,36,0.1)'; border = 'rgba(251,191,36,0.3)' }
  else if (rank === 2) { color = 'var(--color-rank-silver)'; bg = 'rgba(200,200,200,0.1)'; border = 'rgba(200,200,200,0.3)' }
  else if (rank === 3) { color = 'var(--color-rank-bronze)'; bg = 'rgba(180,100,40,0.1)'; border = 'rgba(180,100,40,0.3)' }

  const s = size === 'sm' ? 24 : size === 'md' ? 32 : 48
  const fs = size === 'sm' ? '0.7rem' : size === 'md' ? '0.9rem' : '1.3rem'

  return (
    <div style={{
      width: s, height: s, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: bg, border: `1px solid ${border}`, color,
      fontFamily: 'var(--font-family-mono)', fontWeight: 800, fontSize: fs,
      flexShrink: 0,
    }}>
      #{rank}
    </div>
  )
}

interface Props {
  change: number
}

export function RankMovement({ change }: Props) {
  if (change === 0) {
    return <span className="movement-none" style={{ fontSize: '0.8rem', fontWeight: 700 }}>—</span>
  }
  
  const isUp = change > 0
  const color = isUp ? 'var(--color-s-green)' : 'var(--color-s-red)'
  const text = isUp ? 'var(--color-voting-open)' : 'rgba(248,113,113,0.9)'
  const symbol = isUp ? '↑' : '↓'
  
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: 2,
      color: text, fontSize: '0.75rem', fontWeight: 700,
      background: color, padding: '2px 6px', borderRadius: 6
    }}>
      {symbol} {Math.abs(change)}
    </span>
  )
}

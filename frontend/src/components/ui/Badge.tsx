interface Props {
  status: string
  size?: 'sm' | 'md'
}

export function Badge({ status, size = 'sm' }: Props) {
  let bg, color, border
  switch (status?.toLowerCase()) {
    case 'voting_open':
    case 'open':
      bg = 'rgba(74,222,128,0.15)'
      color = 'var(--color-voting-open)'
      border = '1px solid rgba(74,222,128,0.3)'
      break
    case 'voting_locked':
    case 'locked':
      bg = 'rgba(251,191,36,0.15)'
      color = 'var(--color-voting-locked)'
      border = '1px solid rgba(251,191,36,0.3)'
      break
    case 'finished':
      bg = 'rgba(165,180,252,0.15)'
      color = 'var(--color-finished)'
      border = '1px solid rgba(165,180,252,0.3)'
      break
    default:
      bg = 'rgba(255,255,255,0.05)'
      color = 'rgba(255,255,255,0.6)'
      border = '1px solid rgba(255,255,255,0.1)'
  }

  const p = size === 'sm' ? '2px 8px' : '4px 12px'
  const fs = size === 'sm' ? '0.65rem' : '0.75rem'

  return (
    <span style={{
      background: bg, color, border,
      padding: p, fontSize: fs,
      borderRadius: 999, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      display: 'inline-flex', alignItems: 'center'
    }}>
      {status?.replace('_', ' ') || 'Unknown'}
    </span>
  )
}

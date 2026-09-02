interface Props {
  status: string
}

export function CompetitionStatus({ status }: Props) {
  const s = status?.toLowerCase()
  let bg, color, label, showDot = false

  switch (s) {
    case 'voting_open':
    case 'open':
      bg = 'rgba(74,222,128,0.15)'
      color = 'var(--color-voting-open)'
      label = 'Voting Open'
      showDot = true
      break
    case 'voting_locked':
    case 'locked':
      bg = 'rgba(251,191,36,0.15)'
      color = 'var(--color-voting-locked)'
      label = 'Voting Locked'
      break
    case 'finished':
      bg = 'rgba(165,180,252,0.15)'
      color = 'var(--color-finished)'
      label = 'Finished'
      break
    default:
      bg = 'rgba(255,255,255,0.05)'
      color = 'rgba(255,255,255,0.6)'
      label = 'Draft'
  }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, border: `1px solid ${color.replace('1)', '0.3)')}`,
      padding: '4px 12px', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color
    }}>
      {showDot && <span className="anim-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
      {label}
    </div>
  )
}

interface Props {
  label: string
  weight: number
  score: number
  showContribution?: boolean
  highlight?: boolean
}

export function CriterionBar({ label, weight, score, showContribution, highlight }: Props) {
  const percentage = Math.min(Math.max(score, 0), 100)
  const contribution = score * weight
  
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-family-mono)', color: highlight ? '#fff' : 'rgba(255,255,255,0.9)', fontWeight: highlight ? 700 : 500 }}>
          {score.toFixed(2)} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>/ 100</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8, fontSize: '0.75rem' }}>{(weight * 100).toFixed(0)}%</span>
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${percentage}%`, 
            background: highlight ? '#fff' : 'rgba(255,255,255,0.8)',
            borderRadius: 4,
            transition: 'width 0.5s ease-out'
          }} 
        />
      </div>
      {showContribution && (
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right', fontFamily: 'var(--font-family-mono)' }}>
          {score.toFixed(2)} × {weight} = <span style={{ color: 'rgba(255,255,255,0.7)' }}>{contribution.toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

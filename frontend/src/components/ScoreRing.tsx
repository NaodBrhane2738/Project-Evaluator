import { useEffect, useState } from 'react'

interface Props {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  showScore?: boolean
}

export function ScoreRing({ score, size = 80, strokeWidth = 6, label, showScore = true }: Props) {
  const [offset, setOffset] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(Math.max(score, 0), 100)
  
  useEffect(() => {
    // Animate on mount
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage, circumference])

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="anim-scale-in">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          className="score-ring-track"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="score-ring-fill"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset === 0 ? circumference : offset}
        />
      </svg>
      {showScore && (
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: size * 0.28, fontWeight: 700, fontFamily: 'var(--font-family-mono)' }}>
            {score.toFixed(1)}
          </span>
          {label && (
            <span style={{ fontSize: size * 0.12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: -2 }}>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  data: Array<{ created_at: string; final_score: number }>
  width?: number
  height?: number
  color?: string
}

export function SparkLine({ data, width = 200, height = 40, color = '#ffffff' }: Props) {
  if (data.length < 2) return null

  const min = Math.min(...data.map(d => d.final_score))
  const max = Math.max(...data.map(d => d.final_score))
  const range = max - min || 1 // Avoid div by zero

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d.final_score - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

// src/components/ui/Card.tsx — Adjustable & Resizable Cards

import type { CSSProperties, ReactNode } from 'react'
import { useUIPreferences } from '../../context/UIPreferencesContext'

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  padding?: number | string
  hover?: boolean
  onClick?: () => void
  selected?: boolean
  resizable?: boolean
  id?: string
}

export function Card({
  children,
  style,
  padding,
  hover = false,
  onClick,
  selected = false,
  resizable,
  id,
}: CardProps) {
  const { cardDensity, cardScale, freeformResize } = useUIPreferences()
  const isResizable = resizable ?? freeformResize

  // Derive responsive padding based on density if not explicitly passed
  let resolvedPadding = padding
  if (resolvedPadding === undefined) {
    if (cardDensity === 'compact') resolvedPadding = 14
    else if (cardDensity === 'large') resolvedPadding = 28
    else resolvedPadding = 20
  }

  // Scale padding by cardScale
  if (typeof resolvedPadding === 'number') {
    resolvedPadding = Math.round(resolvedPadding * (cardScale / 100))
  }

  return (
    <div
      id={id}
      onClick={onClick}
      className={`glass-md ${isResizable ? 'card-resizable' : ''}`}
      style={{
        borderRadius: cardDensity === 'compact' ? 14 : cardDensity === 'large' ? 22 : 18,
        padding: resolvedPadding,
        transition: hover ? 'all 0.2s ease' : undefined,
        cursor: onClick ? 'pointer' : undefined,
        border: selected
          ? '1px solid rgba(255,255,255,0.35)'
          : '1px solid rgba(255,255,255,0.08)',
        background: selected ? 'rgba(255,255,255,0.07)' : undefined,
        position: 'relative',
        resize: isResizable ? 'both' : undefined,
        overflow: isResizable ? 'auto' : undefined,
        minWidth: isResizable ? 200 : undefined,
        minHeight: isResizable ? 80 : undefined,
        ...style,
      }}
      onMouseEnter={
        hover && onClick
          ? e => {
              const el = e.currentTarget
              el.style.borderColor = 'rgba(255,255,255,0.25)'
              el.style.transform = 'translateY(-2px) scale(1.005)'
            }
          : undefined
      }
      onMouseLeave={
        hover && onClick
          ? e => {
              const el = e.currentTarget
              el.style.borderColor = selected
                ? 'rgba(255,255,255,0.35)'
                : '1px solid rgba(255,255,255,0.08)'
              el.style.transform = 'none'
            }
          : undefined
      }
    >
      {children}
      {isResizable && (
        <div
          title="Drag to resize card"
          style={{
            position: 'absolute',
            bottom: 3,
            right: 3,
            width: 12,
            height: 12,
            pointerEvents: 'none',
            opacity: 0.35,
            borderRight: '2px solid #fff',
            borderBottom: '2px solid #fff',
            borderBottomRightRadius: 2,
          }}
        />
      )}
    </div>
  )
}

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string | number
  style?: CSSProperties
}

export function MetricCard({ icon, label, value, style }: MetricCardProps) {
  const { cardDensity, cardScale } = useUIPreferences()

  const scale = cardScale / 100
  const pad = cardDensity === 'compact' ? '12px 14px' : cardDensity === 'large' ? '20px 24px' : '16px 20px'
  const iconSize = Math.round(40 * scale)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: cardDensity === 'compact' ? 12 : 16,
        padding: pad,
        display: 'flex',
        alignItems: 'center',
        gap: Math.round(14 * scale),
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: Math.round(12 * scale),
          flexShrink: 0,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: `${0.67 * (cardDensity === 'compact' ? 0.9 : 1.0)}rem`,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            fontWeight: 700,
            marginBottom: 3,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: `${1.1 * scale}rem`,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'var(--font-family-mono)',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

// src/components/ui/ResizableSplitPane.tsx — Edge-draggable split panel between adjacent cards

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  left: React.ReactNode
  right: React.ReactNode
  defaultSplitPercent?: number
  minLeftPx?: number
  minRightPx?: number
  storageKey?: string
  className?: string
  style?: React.CSSProperties
}

export function ResizableSplitPane({
  left,
  right,
  defaultSplitPercent = 65,
  minLeftPx = 320,
  minRightPx = 300,
  storageKey,
  style,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [splitPercent, setSplitPercent] = useState<number>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) return parseFloat(saved)
      } catch {}
    }
    return defaultSplitPercent
  })

  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    isDraggingRef.current = true

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const totalWidth = rect.width
      const offsetX = moveEvent.clientX - rect.left

      const clampedLeft = Math.max(minLeftPx, Math.min(totalWidth - minRightPx, offsetX))
      const newPercent = (clampedLeft / totalWidth) * 100

      setSplitPercent(newPercent)
    }

    const onMouseUp = () => {
      setIsDragging(false)
      isDraggingRef.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [minLeftPx, minRightPx])

  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, splitPercent.toString())
      } catch {}
    }
  }, [splitPercent, storageKey])

  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleReset = () => {
    setSplitPercent(defaultSplitPercent)
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', ...style }}>
        <div style={{ width: '100%' }}>{left}</div>
        <div style={{ width: '100%' }}>{right}</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'stretch',
        position: 'relative',
        userSelect: isDragging ? 'none' : 'auto',
        ...style,
      }}
    >
      {/* Left Card / Component */}
      <div
        style={{
          width: `calc(${splitPercent}% - 8px)`,
          flexShrink: 0,
          minWidth: minLeftPx,
          transition: isDragging ? 'none' : 'width 0.1s ease',
        }}
      >
        {left}
      </div>

      {/* Interactive Drag Divider Bar on Edge */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleReset}
        title="Drag edge to resize adjacent cards (Double-click to reset)"
        style={{
          width: 16,
          flexShrink: 0,
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          margin: '0 2px',
        }}
      >
        <div
          style={{
            width: isDragging ? 3 : 2,
            height: '100%',
            background: isDragging
              ? '#ffffff'
              : 'rgba(255, 255, 255, 0.12)',
            borderRadius: 2,
            transition: 'background 0.15s ease, width 0.15s ease',
            boxShadow: isDragging ? '0 0 10px rgba(255,255,255,0.6)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Subtle center grip indicator */}
          <div
            style={{
              width: 6,
              height: 28,
              borderRadius: 3,
              background: isDragging ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
              boxShadow: isDragging ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Right Card / Component (Adjusts automatically to fill) */}
      <div
        style={{
          flex: 1,
          minWidth: minRightPx,
          transition: isDragging ? 'none' : 'all 0.1s ease',
        }}
      >
        {right}
      </div>
    </div>
  )
}

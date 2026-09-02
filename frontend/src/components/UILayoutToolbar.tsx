// src/components/UILayoutToolbar.tsx — Header Controls for Card Sizing, Density & Cache Status

import { useState, useEffect } from 'react'
import { Sliders, Database, Trash2, CheckCircle2, RotateCcw, X, Layers, Maximize2 } from 'lucide-react'
import { useUIPreferences, CardDensity } from '../context/UIPreferencesContext'
import { appCache, ProcessLogEntry } from '../lib/cache'
import { Button } from './ui/Button'

export function UILayoutToolbar() {
  const {
    sidebarWidth,
    setSidebarWidth,
    cardDensity,
    setCardDensity,
    cardScale,
    setCardScale,
    freeformResize,
    setFreeformResize,
    resetToDefaults,
  } = useUIPreferences()

  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const [showCacheModal, setShowCacheModal] = useState(false)
  const [cacheStats, setCacheStats] = useState(appCache.getStats())
  const [processLogs, setProcessLogs] = useState<ProcessLogEntry[]>([])

  useEffect(() => {
    const updateStats = () => {
      setCacheStats(appCache.getStats())
      setProcessLogs(appCache.getProcessLogs())
    }
    updateStats()

    window.addEventListener('ca_cache_updated', updateStats)
    window.addEventListener('ca_process_logged', updateStats)
    return () => {
      window.removeEventListener('ca_cache_updated', updateStats)
      window.removeEventListener('ca_process_logged', updateStats)
    }
  }, [])

  const handleClearCache = () => {
    appCache.clearAll()
    setCacheStats(appCache.getStats())
    setProcessLogs([])
    window.location.reload()
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Sizing Controller Button */}
        <button
          onClick={() => setShowSizeMenu(!showSizeMenu)}
          title="Adjust component & card sizes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: showSizeMenu ? '#fff' : 'rgba(255,255,255,0.06)',
            color: showSizeMenu ? '#000' : 'rgba(255,255,255,0.7)',
            border: `1px solid ${showSizeMenu ? '#fff' : 'rgba(255,255,255,0.12)'}`,
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Sliders size={13} />
          <span>Size & Scale</span>
          <span
            style={{
              fontSize: '0.66rem',
              background: showSizeMenu ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)',
              padding: '1px 5px',
              borderRadius: 4,
              fontFamily: 'var(--font-family-mono)',
            }}
          >
            {cardScale}%
          </span>
        </button>

        {/* Cache Status Button */}
        <button
          onClick={() => setShowCacheModal(true)}
          title="View cached processes and data"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
        >
          <Database size={13} color="#34d399" />
          <span>Cached</span>
          <span
            style={{
              fontSize: '0.66rem',
              color: '#34d399',
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.2)',
              padding: '1px 5px',
              borderRadius: 4,
              fontFamily: 'var(--font-family-mono)',
            }}
          >
            {cacheStats.kb} KB
          </span>
        </button>
      </div>

      {/* Sizing Popover Menu */}
      {showSizeMenu && (
        <>
          <div
            onClick={() => setShowSizeMenu(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
            }}
          />
          <div
            className="anim-scale-in"
            style={{
              position: 'fixed',
              top: 58,
              right: 170,
              width: 320,
              padding: 20,
              borderRadius: 16,
              zIndex: 9999,
              background: '#141414',
              boxShadow: '0 24px 64px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}>
              <Sliders size={14} /> Adjust Component Sizing
            </div>
            <button
              onClick={() => setShowSizeMenu(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Density Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>
              Card Density
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {(['compact', 'normal', 'large'] as CardDensity[]).map(d => (
                <button
                  key={d}
                  onClick={() => setCardDensity(d)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: '1px solid',
                    borderColor: cardDensity === d ? '#fff' : 'rgba(255,255,255,0.1)',
                    background: cardDensity === d ? '#fff' : 'rgba(255,255,255,0.04)',
                    color: cardDensity === d ? '#000' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Slider */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              <span>Card Scale Zoom</span>
              <span style={{ fontFamily: 'var(--font-family-mono)', color: '#fff', fontWeight: 700 }}>{cardScale}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="130"
              step="5"
              value={cardScale}
              onChange={e => setCardScale(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#fff' }}
            />
          </div>

          {/* Sidebar Width Quick Presets */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              <span>Sidebar Width</span>
              <span style={{ fontFamily: 'var(--font-family-mono)', color: '#fff' }}>{sidebarWidth}px</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { label: 'Slim', w: 190 },
                { label: 'Default', w: 232 },
                { label: 'Wide', w: 320 },
              ].map(p => (
                <button
                  key={p.w}
                  onClick={() => setSidebarWidth(p.w)}
                  style={{
                    padding: '4px 6px',
                    borderRadius: 6,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: sidebarWidth === p.w ? '#fff' : 'rgba(255,255,255,0.1)',
                    background: sidebarWidth === p.w ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                    color: sidebarWidth === p.w ? '#fff' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Freeform Card Drag Resize Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Maximize2 size={13} color={freeformResize ? '#34d399' : 'rgba(255,255,255,0.4)'} />
              <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Corner Drag Resize
              </span>
            </div>
            <input
              type="checkbox"
              checked={freeformResize}
              onChange={e => setFreeformResize(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#34d399' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={resetToDefaults}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              <RotateCcw size={12} /> Reset to Defaults
            </button>
          </div>
          </div>
        </>
      )}

      {/* Cache & Process Manager Modal */}
      {showCacheModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
          }}
          onClick={() => setShowCacheModal(false)}
        >
          <div
            className="glass-card anim-scale-in"
            style={{
              width: '100%',
              maxWidth: 580,
              padding: 24,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={16} color="#34d399" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Data & Process Cache Manager</h3>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                    Persistent zero-latency caching for every action & record
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCacheModal(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Cache Summary Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Cached Entries</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', marginTop: 4 }}>
                  {cacheStats.entries}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Storage Footprint</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', marginTop: 4, color: '#34d399' }}>
                  {cacheStats.kb} KB
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Tracked Processes</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-family-mono)', marginTop: 4 }}>
                  {cacheStats.processLogsCount}
                </div>
              </div>
            </div>

            {/* Recent Process Logs */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={13} /> Process & Action Audit History
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {processLogs.length > 0 ? (
                  processLogs.map(log => (
                    <div
                      key={log.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2
                          size={13}
                          color={log.status === 'success' ? '#34d399' : log.status === 'pending' ? '#fbbf24' : '#f87171'}
                        />
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{log.action}</div>
                          {log.details && (
                            <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-family-mono)' }}>
                              {JSON.stringify(log.details)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-family-mono)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                    No processes logged yet. Actions like submissions, evaluations and edits will appear here.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleClearCache}
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  color: '#f87171',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} /> Clear Cache & Refresh
              </button>
              <Button variant="ghost" size="sm" onClick={() => setShowCacheModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

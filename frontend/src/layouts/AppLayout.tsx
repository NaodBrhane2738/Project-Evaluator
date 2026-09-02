// src/layouts/AppLayout.tsx — Resizable Sidebar, Dynamic Header & Layout Provider

import { useState, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Shield,
  Trophy,
  GitCompare,
  Star,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useUser } from '../hooks/useUser'
import { useCompetitionState } from '../hooks/useCompetitionState'
import { CompetitionStatus } from '../components/CompetitionStatus'
import { useUIPreferences } from '../context/UIPreferencesContext'
import { UILayoutToolbar } from '../components/UILayoutToolbar'

export function AppLayout() {
  const { nickname, isAdmin } = useUser()
  const { status } = useCompetitionState()
  const navigate = useNavigate()

  const {
    sidebarWidth,
    setSidebarWidth,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    cardScale,
  } = useUIPreferences()

  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false)
  const dragStartXRef = useRef(0)
  const startWidthRef = useRef(sidebarWidth)

  const handleSignOut = () => {
    localStorage.removeItem('project_evaluator_user_id')
    localStorage.removeItem('project_evaluator_nickname')
    localStorage.removeItem('cyberarena_user_id')
    localStorage.removeItem('cyberarena_nickname')
    navigate('/onboarding', { replace: true })
  }

  const initials = nickname?.[0]?.toUpperCase() ?? 'U'

  const NAV = [
    { to: '/', label: 'Dashboard', icon: LayoutGrid },
    { to: '/projects', label: 'Projects', icon: Shield },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/compare', label: 'Compare', icon: GitCompare },
    { to: '/judge', label: 'Judge Mode', icon: Star },
  ]

  if (isAdmin()) {
    NAV.push({ to: '/admin', label: 'Admin', icon: ShieldCheck })
  }

  // Sidebar drag-to-resize handler
  const handleMouseDownResizer = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingSidebar(true)
    dragStartXRef.current = e.clientX
    startWidthRef.current = sidebarWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartXRef.current
      const newWidth = startWidthRef.current + deltaX
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDraggingSidebar(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const currentSidebarWidth = isSidebarCollapsed ? 68 : sidebarWidth

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#050505',
        userSelect: isDraggingSidebar ? 'none' : 'auto',
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: currentSidebarWidth,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(24px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: isDraggingSidebar ? 'none' : 'width 0.2s ease',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: isSidebarCollapsed ? '20px 14px' : '22px 18px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                flexShrink: 0,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={17} color="#000" strokeWidth={2.5} />
            </div>
            {!isSidebarCollapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '-0.02em', color: '#fff' }}>
                  Project Evaluator
                </div>
                <div
                  style={{
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.3)',
                    marginTop: 1,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Competition Platform
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!isSidebarCollapsed && (
            <div
              style={{
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.2)',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '6px 10px 8px',
              }}
            >
              Navigation
            </div>
          )}
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={isSidebarCollapsed ? label : undefined}
              className={({ isActive }) => (isActive ? 'nav-active' : '')}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                gap: 10,
                padding: isSidebarCollapsed ? '10px 0' : '9px 12px',
                borderRadius: 12,
                fontSize: '0.84rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#000' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
                transition: 'all 0.18s ease',
                background: isActive ? '#fff' : 'transparent',
              })}
              onMouseEnter={e => {
                const el = e.currentTarget
                if (!el.classList.contains('nav-active')) {
                  el.style.background = 'rgba(255,255,255,0.05)'
                  el.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                if (!el.classList.contains('nav-active')) {
                  el.style.background = 'transparent'
                  el.style.color = 'rgba(255,255,255,0.45)'
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                  {!isSidebarCollapsed && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div
          style={{
            padding: isSidebarCollapsed ? '12px 6px' : '12px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              flexShrink: 0,
              background: '#fff',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
            title={nickname || undefined}
          >
            {initials}
          </div>
          {!isSidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {nickname}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 2,
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                COMPETITOR
              </div>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                color: 'rgba(255,255,255,0.25)',
                borderRadius: 8,
                transition: 'color 0.15s',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.25)'
              }}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>

        {/* Sidebar Collapse Toggle Icon Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            position: 'absolute',
            top: 24,
            right: -11,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Draggable Sidebar Divider Handle */}
        {!isSidebarCollapsed && (
          <div
            onMouseDown={handleMouseDownResizer}
            onDoubleClick={() => setSidebarWidth(232)}
            title="Drag to resize sidebar, double-click to reset"
            style={{
              position: 'absolute',
              top: 0,
              right: -3,
              width: 6,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 9,
              background: isDraggingSidebar ? 'rgba(255,255,255,0.4)' : 'transparent',
              transition: 'background 0.15s',
            }}
          />
        )}
      </aside>

      {/* ── Main Layout Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header
          style={{
            height: 54,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(24px)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            flexShrink: 0,
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <span
              className="anim-pulse-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(74,222,128,0.7)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 600 }}>Active Workspace</span>
          </div>

          {/* Right Header Toolbar: Size Controller + Cache Manager + Competition Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UILayoutToolbar />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <CompetitionStatus status={status} />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {nickname}
            </div>
          </div>
        </header>

        {/* Scrollable Page Container with adjustable scaling */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: `${Math.round(28 * (cardScale / 100))}px`,
            zoom: cardScale !== 100 ? undefined : undefined,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

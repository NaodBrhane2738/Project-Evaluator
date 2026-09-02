import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, Grid3X3, StretchHorizontal } from 'lucide-react'
import { api } from '../lib/api'
import type { Project } from '../types'
import { Button } from '../components/ui/Button'
import { ProjectCard } from '../components/ProjectCard'
import { Card } from '../components/ui/Card'
import { CYBER_DOMAINS } from '../types/domains'
import { useUIPreferences } from '../context/UIPreferencesContext'

const FILTER_DOMAINS = ['All', ...CYBER_DOMAINS]

type GridDensity = 'compact' | 'standard' | 'large'

export function Projects() {
  const navigate = useNavigate()
  const { cardScale } = useUIPreferences()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => localStorage.getItem('ca_projects_search') || '')
  const [domainFilter, setDomainFilter] = useState(() => localStorage.getItem('ca_projects_domain') || 'All')
  const [gridDensity, setGridDensity] = useState<GridDensity>(() => (localStorage.getItem('ca_projects_grid_density') as GridDensity) || 'standard')

  useEffect(() => {
    api.getProjects().then(data => {
      setProjects(data as Project[])
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [])

  // Cache filter preferences
  useEffect(() => {
    localStorage.setItem('ca_projects_search', search)
  }, [search])

  useEffect(() => {
    localStorage.setItem('ca_projects_domain', domainFilter)
  }, [domainFilter])

  useEffect(() => {
    localStorage.setItem('ca_projects_grid_density', gridDensity)
  }, [gridDensity])

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.tagline || '').toLowerCase().includes(search.toLowerCase())
    const matchDomain = domainFilter === 'All' || p.domain === domainFilter
    return matchSearch && matchDomain
  })

  const scale = cardScale / 100

  const getGridColumns = () => {
    if (gridDensity === 'compact') return 'repeat(auto-fill, minmax(280px, 1fr))'
    if (gridDensity === 'large') return 'repeat(auto-fill, minmax(460px, 1fr))'
    return 'repeat(auto-fill, minmax(360px, 1fr))'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(24 * scale) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: `${1.4 * scale}rem`, fontWeight: 800, margin: 0 }}>All Projects</h1>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/projects/new')}>
          Submit Your Project
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 340, maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Search projects..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          {/* Grid Layout Density Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Grid Density:</span>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { id: 'compact', label: 'Compact', icon: Grid3X3 },
                { id: 'standard', label: 'Standard', icon: LayoutGrid },
                { id: 'large', label: 'Spacious', icon: StretchHorizontal },
              ].map(mode => {
                const Icon = mode.icon
                const isActive = gridDensity === mode.id
                return (
                  <button
                    key={mode.id}
                    onClick={() => setGridDensity(mode.id as GridDensity)}
                    title={`${mode.label} Card Layout`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? '#fff' : 'transparent',
                      color: isActive ? '#000' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={12} />
                    <span>{mode.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              style={{
                background: domainFilter === d ? '#fff' : 'rgba(255,255,255,0.05)',
                color: domainFilter === d ? '#000' : 'rgba(255,255,255,0.6)',
                border: `1px solid ${domainFilter === d ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 100 }} />
          <div className="skeleton" style={{ height: 100 }} />
          <div className="skeleton" style={{ height: 100 }} />
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: getGridColumns(), gap: Math.round(16 * scale) }}>
          {filtered.map(p => <ProjectCard key={p.id} project={p} showRank={false} />)}
        </div>
      ) : (
        <Card padding={40} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          No projects found matching your criteria.
        </Card>
      )}
    </div>
  )
}

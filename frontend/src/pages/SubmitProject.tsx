import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CYBER_DOMAINS } from '../types/domains'
import { useUIPreferences } from '../context/UIPreferencesContext'

const DRAFT_KEY = 'ca_project_form_draft'

interface Props {
  initialData?: any
  isEditing?: boolean
  onCancel?: () => void
}

export function SubmitProject({ initialData, isEditing, onCancel }: Props) {
  const navigate = useNavigate()
  const { cardScale } = useUIPreferences()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)

  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        name: initialData.name || '',
        tagline: initialData.tagline || '',
        domain: initialData.domain || CYBER_DOMAINS[0],
        problem: initialData.problem || '',
        solution: initialData.solution || '',
        target_users: initialData.target_users || '',
        features: initialData.features || '',
        tech_stack: initialData.tech_stack || '',
        mvp_plan: initialData.mvp_plan || '',
        future_potential: initialData.future_potential || '',
        image_url: initialData.image_url || ''
      }
    }
    // Check if draft exists in cache
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {}

    return {
      name: '',
      tagline: '',
      domain: CYBER_DOMAINS[0],
      problem: '',
      solution: '',
      target_users: '',
      features: '',
      tech_stack: '',
      mvp_plan: '',
      future_potential: '',
      image_url: ''
    }
  })

  useEffect(() => {
    if (!isEditing && localStorage.getItem(DRAFT_KEY)) {
      setHasRestoredDraft(true)
    }
  }, [isEditing])

  // Automatically cache form state as user types
  useEffect(() => {
    if (!isEditing) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      } catch {}
    }
  }, [form, isEditing])

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setHasRestoredDraft(false)
    setForm({
      name: '',
      tagline: '',
      domain: CYBER_DOMAINS[0],
      problem: '',
      solution: '',
      target_users: '',
      features: '',
      tech_stack: '',
      mvp_plan: '',
      future_potential: '',
      image_url: ''
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isEditing && initialData?.id) {
        await api.updateProject(initialData.id, form)
        if (onCancel) onCancel()
        else navigate(`/projects/${initialData.id}`)
      } else {
        const res = await api.createProject(form)
        localStorage.removeItem(DRAFT_KEY)
        navigate(`/projects/${(res as any).id}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const scale = cardScale / 100

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: Math.round(24 * scale) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: `${1.8 * scale}rem`, fontWeight: 800, margin: '0 0 8px' }}>
            {isEditing ? 'Edit Your Project' : 'Submit Your Project'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.9rem' }}>
            {isEditing ? 'Update any details for your project.' : 'Fill out the details below. All inputs are automatically cached.'}
          </p>
        </div>

        {hasRestoredDraft && !isEditing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', padding: '6px 12px', borderRadius: 8 }}>
            <Sparkles size={14} color="#34d399" />
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>Draft restored from cache</span>
            <button
              onClick={clearDraft}
              title="Discard draft"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 4 }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {error && <div style={{ color: 'rgba(248,113,113,0.9)', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '12px 16px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: Math.round(24 * scale) }}>
        <Card padding={Math.round(24 * scale)}>
          <h3 style={{ margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>1. Basic Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Project Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input" placeholder="e.g. SentinelX" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Tagline *</label>
              <textarea name="tagline" value={form.tagline} onChange={handleChange} required className="input" style={{ minHeight: 60, resize: 'vertical' }} placeholder="Short catchy overview of what your project does..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Domain</label>
              <select name="domain" value={form.domain} onChange={handleChange} className="input">
                {CYBER_DOMAINS.map(d => <option key={d} value={d} style={{ background: '#111' }}>{d}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card padding={Math.round(24 * scale)}>
          <h3 style={{ margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>2. The Problem & Solution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>The Problem</label>
              <textarea name="problem" value={form.problem} onChange={handleChange} className="input" style={{ minHeight: 120, resize: 'vertical' }} placeholder="What specific problem are you solving?" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>The Solution</label>
              <textarea name="solution" value={form.solution} onChange={handleChange} className="input" style={{ minHeight: 120, resize: 'vertical' }} placeholder="How does your project solve this problem?" />
            </div>
          </div>
        </Card>

        <Card padding={Math.round(24 * scale)}>
          <h3 style={{ margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>3. Details & Tech</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Target Users</label>
              <textarea name="target_users" value={form.target_users} onChange={handleChange} className="input" style={{ minHeight: 60, resize: 'vertical' }} placeholder="Who is this for?" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Key Features</label>
              <textarea name="features" value={form.features} onChange={handleChange} className="input" style={{ minHeight: 100, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Tech Stack</label>
              <textarea name="tech_stack" value={form.tech_stack} onChange={handleChange} className="input" style={{ minHeight: 80, resize: 'vertical' }} placeholder="Languages, frameworks, tools..." />
            </div>
          </div>
        </Card>

        <Card padding={Math.round(24 * scale)}>
          <h3 style={{ margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>4. Execution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>MVP Plan</label>
              <textarea name="mvp_plan" value={form.mvp_plan} onChange={handleChange} className="input" style={{ minHeight: 100, resize: 'vertical' }} placeholder="What will be built for the demo?" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Future Potential</label>
              <textarea name="future_potential" value={form.future_potential} onChange={handleChange} className="input" style={{ minHeight: 100, resize: 'vertical' }} placeholder="Where could this go after the competition?" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Image URL (optional)</label>
              <input name="image_url" value={form.image_url} onChange={handleChange} className="input" placeholder="https://..." />
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button type="button" variant="ghost" onClick={onCancel || (() => navigate(-1))}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading} icon={<ArrowRight size={14} />}>
            {isEditing ? 'Save Changes' : 'Submit Project'}
          </Button>
        </div>
      </form>
    </div>
  )
}

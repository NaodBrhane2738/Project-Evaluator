import { CRITERIA, type Project } from '../types'
import { CriterionBar } from './CriterionBar'
import { Card } from './ui/Card'

interface Props {
  project: Project
}

export function ScoreBreakdown({ project }: Props) {
  return (
    <Card padding={24}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0' }}>Competition Score</h3>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {project.voter_count_label || `${project.voter_count || 0} voters`}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {CRITERIA.map(c => (
          <CriterionBar 
            key={c.key} 
            label={c.label} 
            weight={c.weight} 
            score={project[`${c.key}_score` as keyof Project] as number || 0} 
            showContribution
          />
        ))}
      </div>

      <div style={{ 
        marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
      }}>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Final Weighted Score</div>
        <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.6rem', fontWeight: 800 }}>
          {(project.final_score || 0).toFixed(2)}
        </div>
      </div>
    </Card>
  )
}

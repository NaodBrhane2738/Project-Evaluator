import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { CompetitionState } from '../types'

export function useCompetitionState() {
  const [state, setState] = useState<CompetitionState | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchState = async () => {
      try {
        setLoading(true)
        const data = await api.getCompetitionState()
        if (mounted) {
          setState(data as CompetitionState)
        }
      } catch (e) {
        console.error('Failed to fetch competition state', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchState()
    const interval = setInterval(fetchState, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { state, status: state?.status || 'draft', loading }
}

import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Activity } from '../types'

export function useActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const data = await api.getActivity()
        if (mounted) {
          setActivities(data as Activity[])
          setLastUpdated(new Date())
        }
      } catch (e) {
        console.error('Failed to fetch activity', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchActivities()
    const interval = setInterval(fetchActivities, 30000) // Poll every 30s
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { activities, loading, lastUpdated }
}

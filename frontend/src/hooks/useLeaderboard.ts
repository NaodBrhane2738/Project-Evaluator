import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Project } from '../types'

export function useLeaderboard(sort: string = 'overall') {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const data = await api.getLeaderboard(sort)
        if (mounted) {
          setProjects(data as Project[])
          setLastUpdated(new Date())
        }
      } catch (e) {
        console.error('Failed to fetch leaderboard', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [sort])

  return { projects, loading, lastUpdated }
}

// src/lib/api.ts — Typed fetch client with multi-level caching & process tracking

import { appCache } from './cache'

const rawBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const BASE = rawBase ? (rawBase.endsWith('/api/v1') ? rawBase : `${rawBase}/api/v1`) : '/api/v1'

function getHeaders(): HeadersInit {
  const userId = localStorage.getItem('cyberarena_user_id')
  return {
    'Content-Type': 'application/json',
    ...(userId ? { 'X-User-Id': userId } : {}),
  }
}

interface RequestOptions extends RequestInit {
  cacheKey?: string
  skipCache?: boolean
  ttlMs?: number
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { cacheKey, skipCache = false, ttlMs, ...fetchOptions } = options
  const method = (fetchOptions.method || 'GET').toUpperCase()

  // 1. Read from cache for GET requests if available
  if (method === 'GET' && cacheKey && !skipCache) {
    const cached = appCache.get<T>(cacheKey)
    if (cached) {
      // Trigger background revalidation (stale-while-revalidate)
      fetch(`${BASE}${path}`, {
        ...fetchOptions,
        headers: { ...getHeaders(), ...(fetchOptions.headers ?? {}) },
      })
        .then(res => (res.ok ? res.json() : null))
        .then(freshData => {
          if (freshData) {
            appCache.set(cacheKey, freshData, ttlMs)
            window.dispatchEvent(new CustomEvent('ca_cache_updated', { detail: { cacheKey, data: freshData } }))
          }
        })
        .catch(() => {})

      return cached
    }
  }

  // 2. Perform network request
  const res = await fetch(`${BASE}${path}`, {
    ...fetchOptions,
    headers: { ...getHeaders(), ...(fetchOptions.headers ?? {}) },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }

  const data: T = await res.json()

  // 3. Cache response if cacheKey is provided
  if (cacheKey) {
    appCache.set(cacheKey, data, ttlMs)
  }

  return data
}

export const api = {
  // ── Users ──
  checkNickname: (nickname: string) =>
    request<{ exists: boolean; has_password: boolean; nickname: string }>('/users/check', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
      skipCache: true,
    }),

  claimNickname: async (nickname: string, password?: string) => {
    appCache.logProcess('Claim / Login Handle', { nickname }, 'pending')
    try {
      const res = await request('/users', {
        method: 'POST',
        body: JSON.stringify({ nickname, ...(password ? { password } : {}) }),
      })
      appCache.logProcess('Claim / Login Handle', { nickname }, 'success')
      appCache.invalidatePattern('users|people')
      return res
    } catch (e: any) {
      appCache.logProcess('Claim / Login Handle', { nickname, error: e.message }, 'failed')
      throw e
    }
  },

  getUser: (id: string) =>
    request(`/users/${id}`, { cacheKey: `user_${id}` }),

  getPeople: () =>
    request('/users', { cacheKey: 'users_all' }),

  // ── Projects ──
  createProject: async (data: any) => {
    appCache.logProcess('Submit Project', { name: data.name, domain: data.domain }, 'pending')
    try {
      const res = await request('/projects', { method: 'POST', body: JSON.stringify(data) })
      appCache.logProcess('Submit Project', { id: (res as any)?.id, name: data.name }, 'success')
      appCache.invalidatePattern('projects|leaderboard|activity|stats')
      return res
    } catch (e: any) {
      appCache.logProcess('Submit Project', { name: data.name, error: e.message }, 'failed')
      throw e
    }
  },

  getProjects: () =>
    request('/projects', { cacheKey: 'projects_list' }),

  getProject: (id: string) =>
    request(`/projects/${id}`, { cacheKey: `project_${id}` }),

  updateProject: async (id: string, data: any) => {
    appCache.logProcess('Edit Project', { id, name: data.name }, 'pending')
    try {
      const res = await request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
      appCache.logProcess('Edit Project', { id }, 'success')
      appCache.invalidatePattern(`project_${id}|projects|leaderboard`)
      return res
    } catch (e: any) {
      appCache.logProcess('Edit Project', { id, error: e.message }, 'failed')
      throw e
    }
  },

  // ── Ratings ──
  submitRating: async (projectId: string, data: any) => {
    appCache.logProcess('Submit Evaluation', { projectId }, 'pending')
    try {
      const res = await request(`/projects/${projectId}/ratings`, { method: 'POST', body: JSON.stringify(data) })
      appCache.logProcess('Submit Evaluation', { projectId }, 'success')
      appCache.invalidatePattern(`project_${projectId}|ratings_${projectId}|projects|leaderboard|activity|stats`)
      return res
    } catch (e: any) {
      appCache.logProcess('Submit Evaluation', { projectId, error: e.message }, 'failed')
      throw e
    }
  },

  getProjectRatings: (projectId: string) =>
    request(`/projects/${projectId}/ratings`, { cacheKey: `ratings_${projectId}` }),

  deleteRating: async (projectId: string) => {
    appCache.logProcess('Delete Rating', { projectId }, 'pending')
    try {
      const res = await request(`/projects/${projectId}/ratings`, { method: 'DELETE' })
      appCache.logProcess('Delete Rating', { projectId }, 'success')
      appCache.invalidatePattern(`project_${projectId}|ratings_${projectId}|projects|leaderboard|activity|stats`)
      return res
    } catch (e: any) {
      appCache.logProcess('Delete Rating', { projectId, error: e.message }, 'failed')
      throw e
    }
  },

  // ── Leaderboard ──
  getLeaderboard: (sort = 'overall') =>
    request(`/leaderboard?sort=${sort}`, { cacheKey: `leaderboard_${sort}` }),

  getComparison: (ids: string[]) =>
    request(`/leaderboard/comparison?ids=${ids.join(',')}`, { cacheKey: `comparison_${ids.sort().join('_')}` }),

  getPeopleLeaderboard: () =>
    request('/leaderboard/people', { cacheKey: 'people_leaderboard' }),

  getStats: () =>
    request('/leaderboard/stats', { cacheKey: 'competition_stats' }),

  // ── Activity ──
  getActivity: () =>
    request('/activity', { cacheKey: 'activity_stream' }),

  // ── Admin ──
  hideProject: async (id: string) => {
    appCache.logProcess('Admin: Hide Project', { id }, 'pending')
    const res = await request(`/admin/projects/${id}/hide`, { method: 'POST' })
    appCache.logProcess('Admin: Hide Project', { id }, 'success')
    appCache.invalidatePattern('projects|leaderboard')
    return res
  },

  showProject: async (id: string) => {
    appCache.logProcess('Admin: Show Project', { id }, 'pending')
    const res = await request(`/admin/projects/${id}/show`, { method: 'POST' })
    appCache.logProcess('Admin: Show Project', { id }, 'success')
    appCache.invalidatePattern('projects|leaderboard')
    return res
  },

  deleteProject: async (id: string) => {
    appCache.logProcess('Admin: Delete Project', { id }, 'pending')
    const res = await request(`/admin/projects/${id}`, { method: 'DELETE' })
    appCache.logProcess('Admin: Delete Project', { id }, 'success')
    appCache.invalidatePattern('projects|leaderboard|activity|stats')
    return res
  },

  removeRating: async (id: string) => {
    appCache.logProcess('Admin: Remove Rating', { id }, 'pending')
    const res = await request(`/admin/ratings/${id}`, { method: 'DELETE' })
    appCache.logProcess('Admin: Remove Rating', { id }, 'success')
    appCache.invalidatePattern('projects|leaderboard|ratings|stats')
    return res
  },

  lockVoting: async () => {
    appCache.logProcess('Admin: Lock Voting', {}, 'pending')
    const res = await request('/admin/competition/lock', { method: 'POST' })
    appCache.logProcess('Admin: Lock Voting', {}, 'success')
    appCache.invalidatePattern('comp_state|competition_stats')
    return res
  },

  unlockVoting: async () => {
    appCache.logProcess('Admin: Unlock Voting', {}, 'pending')
    const res = await request('/admin/competition/unlock', { method: 'POST' })
    appCache.logProcess('Admin: Unlock Voting', {}, 'success')
    appCache.invalidatePattern('comp_state|competition_stats')
    return res
  },

  finishCompetition: async () => {
    appCache.logProcess('Admin: Finish Competition', {}, 'pending')
    const res = await request('/admin/competition/finish', { method: 'POST' })
    appCache.logProcess('Admin: Finish Competition', {}, 'success')
    appCache.invalidatePattern('comp_state|competition_stats')
    return res
  },

  getAuditLog: () => request('/admin/audit-log', { cacheKey: 'admin_audit_log' }),
  getAdminStats: () => request('/admin/stats', { cacheKey: 'admin_stats' }),
  getCompetitionState: () => request('/health', { cacheKey: 'comp_state' }),
}

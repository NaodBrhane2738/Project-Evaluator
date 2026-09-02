// src/lib/cache.ts — Comprehensive client-side cache & process tracking engine

export interface ProcessLogEntry {
  id: string
  action: string
  status: 'pending' | 'success' | 'failed'
  timestamp: string
  details?: any
}

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl?: number
}

const STORAGE_PREFIX = 'ca_cache_'
const PROCESS_LOG_KEY = 'ca_process_logs'

class CacheManager {
  private memCache = new Map<string, CacheItem<any>>()

  constructor() {
    this.hydrateFromStorage()
  }

  private hydrateFromStorage() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const raw = localStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw)
            const cleanKey = key.replace(STORAGE_PREFIX, '')
            this.memCache.set(cleanKey, parsed)
          }
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate cache from storage', e)
    }
  }

  public get<T>(key: string, maxAgeMs?: number): T | null {
    // 1. Memory check
    const item = this.memCache.get(key) as CacheItem<T> | undefined
    if (item) {
      if (maxAgeMs && Date.now() - item.timestamp > maxAgeMs) {
        return item.data // Can still return stale data
      }
      return item.data
    }

    // 2. LocalStorage check
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key)
      if (raw) {
        const parsed: CacheItem<T> = JSON.parse(raw)
        this.memCache.set(key, parsed)
        return parsed.data
      }
    } catch (e) {
      // ignore
    }

    return null
  }

  public set<T>(key: string, data: T, ttlMs?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    }

    this.memCache.set(key, item)

    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(item))
    } catch (e) {
      // Storage might be full, prune oldest items if needed
      this.pruneOldest()
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(item))
      } catch (err) {
        console.warn('Storage quota exceeded for cache', err)
      }
    }
  }

  public remove(key: string): void {
    this.memCache.delete(key)
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch (e) {
      // ignore
    }
  }

  public invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const keysToRemove: string[] = []

    this.memCache.forEach((_, key) => {
      if (regex.test(key)) keysToRemove.push(key)
    })

    keysToRemove.forEach(k => this.remove(k))

    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const cleanKey = key.replace(STORAGE_PREFIX, '')
          if (regex.test(cleanKey)) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  private pruneOldest() {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    this.memCache.forEach((item, key) => {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.remove(oldestKey)
    }
  }

  // ── Process Logging ──
  public logProcess(action: string, details?: any, status: 'pending' | 'success' | 'failed' = 'success'): void {
    try {
      const existing = this.getProcessLogs()
      const newEntry: ProcessLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        action,
        status,
        timestamp: new Date().toISOString(),
        details,
      }
      const updated = [newEntry, ...existing].slice(0, 100) // Keep last 100 processes
      localStorage.setItem(PROCESS_LOG_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('ca_process_logged', { detail: newEntry }))
    } catch (e) {
      console.warn('Failed to log process', e)
    }
  }

  public getProcessLogs(): ProcessLogEntry[] {
    try {
      const raw = localStorage.getItem(PROCESS_LOG_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  }

  public clearAll(): void {
    this.memCache.clear()
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith(STORAGE_PREFIX) || key === PROCESS_LOG_KEY)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  }

  public getStats() {
    let totalEntries = 0
    let totalBytes = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        totalEntries++
        const val = localStorage.getItem(key) || ''
        totalBytes += key.length + val.length
      }
    }
    return {
      entries: totalEntries,
      bytes: totalBytes,
      kb: (totalBytes / 1024).toFixed(1),
      processLogsCount: this.getProcessLogs().length,
    }
  }
}

export const appCache = new CacheManager()

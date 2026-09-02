// src/context/UIPreferencesContext.tsx — Universal Layout Sizing & Preferences Context

import React, { createContext, useContext, useState, useEffect } from 'react'

export type CardDensity = 'compact' | 'normal' | 'large'

interface UIPreferencesContextType {
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (collapsed: boolean) => void
  cardDensity: CardDensity
  setCardDensity: (density: CardDensity) => void
  cardScale: number // 80 - 130 (%)
  setCardScale: (scale: number) => void
  freeformResize: boolean
  setFreeformResize: (enabled: boolean) => void
  dashboardSplit: number // 40 - 80 (%)
  setDashboardSplit: (split: number) => void
  resetToDefaults: () => void
}

const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(undefined)

const STORAGE_KEY = 'ca_ui_preferences'

interface StoredPrefs {
  sidebarWidth: number
  isSidebarCollapsed: boolean
  cardDensity: CardDensity
  cardScale: number
  freeformResize: boolean
  dashboardSplit: number
}

const DEFAULT_PREFS: StoredPrefs = {
  sidebarWidth: 232,
  isSidebarCollapsed: false,
  cardDensity: 'normal',
  cardScale: 100,
  freeformResize: false,
  dashboardSplit: 68,
}

export function UIPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<StoredPrefs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS
    } catch {
      return DEFAULT_PREFS
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {}

    // Apply CSS root variables for global scaling
    const root = document.documentElement
    const scaleFactor = prefs.cardScale / 100

    let basePadding = '20px'
    let fontMultiplier = 1.0

    if (prefs.cardDensity === 'compact') {
      basePadding = '12px'
      fontMultiplier = 0.9
    } else if (prefs.cardDensity === 'large') {
      basePadding = '28px'
      fontMultiplier = 1.12
    }

    root.style.setProperty('--ui-scale', `${scaleFactor}`)
    root.style.setProperty('--ui-card-padding', basePadding)
    root.style.setProperty('--ui-font-scale', `${fontMultiplier}`)
  }, [prefs])

  const setSidebarWidth = (sidebarWidth: number) =>
    setPrefs(p => ({ ...p, sidebarWidth: Math.max(170, Math.min(480, sidebarWidth)) }))

  const setIsSidebarCollapsed = (isSidebarCollapsed: boolean) =>
    setPrefs(p => ({ ...p, isSidebarCollapsed }))

  const setCardDensity = (cardDensity: CardDensity) =>
    setPrefs(p => ({ ...p, cardDensity }))

  const setCardScale = (cardScale: number) =>
    setPrefs(p => ({ ...p, cardScale: Math.max(75, Math.min(135, cardScale)) }))

  const setFreeformResize = (freeformResize: boolean) =>
    setPrefs(p => ({ ...p, freeformResize }))

  const setDashboardSplit = (dashboardSplit: number) =>
    setPrefs(p => ({ ...p, dashboardSplit: Math.max(40, Math.min(80, dashboardSplit)) }))

  const resetToDefaults = () => setPrefs(DEFAULT_PREFS)

  return (
    <UIPreferencesContext.Provider
      value={{
        ...prefs,
        setSidebarWidth,
        setIsSidebarCollapsed,
        setCardDensity,
        setCardScale,
        setFreeformResize,
        setDashboardSplit,
        resetToDefaults,
      }}
    >
      {children}
    </UIPreferencesContext.Provider>
  )
}

export function useUIPreferences() {
  const ctx = useContext(UIPreferencesContext)
  if (!ctx) {
    throw new Error('useUIPreferences must be used within UIPreferencesProvider')
  }
  return ctx
}

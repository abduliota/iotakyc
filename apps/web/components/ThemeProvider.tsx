'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    // Read saved preference
    const saved = localStorage.getItem('kyc-theme') as Theme | null
    const preferred = saved ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    setTheme(preferred)
    document.documentElement.setAttribute('data-theme', preferred)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('kyc-theme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// ── Reusable toggle button ────────────────────────────────────────────────────
export function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={style}
    >
      <span style={{ fontSize: 14 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
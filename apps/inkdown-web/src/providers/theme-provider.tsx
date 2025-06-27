import { createContext, useContext, useEffect, useState } from 'react'
import type { Theme, ThemeProviderProps, ThemeProviderState } from '@/themes/themes'

const initialState: ThemeProviderState = {
  theme: { mode: 'system', color: 'default-dark' },
  setTheme: () => null
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = { mode: 'system', color: 'default-dark' },
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : defaultTheme;
      } catch (error) {
        console.error("Failed to parse theme from localStorage", error);
        return defaultTheme;
      }
    }
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme.mode === 'dark' || (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else if (theme.mode === 'light' || (theme.mode === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('light');
    }
    
    root.setAttribute('data-theme', theme.color)
    localStorage.setItem(storageKey, JSON.stringify(theme))
  }, [theme, storageKey])

  const value = {
    theme,
    setTheme
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
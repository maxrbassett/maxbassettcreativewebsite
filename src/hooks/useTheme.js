import { useState, useEffect } from 'react'

// Reads the initial theme from the <html data-theme> attribute that's
// set by the inline script in index.html (so refreshes don't flash),
// then syncs state changes back to the attribute and localStorage.
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'light'
    return document.documentElement.getAttribute('data-theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // localStorage unavailable (private mode, etc.) — just skip persistence.
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return { theme, toggle }
}

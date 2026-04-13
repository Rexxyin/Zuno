'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark'
    setDark(current)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('zuno-theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      className="h-10 w-10 rounded-full border app-card inline-flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

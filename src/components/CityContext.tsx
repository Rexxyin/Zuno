'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_LAUNCH_CITY } from '@/lib/cities'

type CityContextValue = {
  selectedCity: string
  setSelectedCity: (city: string) => void
}

const CityContext = createContext<CityContextValue | null>(null)

const CITY_STORAGE_KEY = 'zuno:selected-city'

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCity] = useState(DEFAULT_LAUNCH_CITY)

  useEffect(() => {
    const savedCity = window.localStorage.getItem(CITY_STORAGE_KEY)
    if (savedCity) setSelectedCity(savedCity)
  }, [])

  const updateCity = (city: string) => {
    setSelectedCity(city)
    window.localStorage.setItem(CITY_STORAGE_KEY, city)
  }

  return <CityContext.Provider value={{ selectedCity, setSelectedCity: updateCity }}>{children}</CityContext.Provider>
}

export function useCity() {
  const context = useContext(CityContext)
  if (!context) throw new Error('useCity must be used inside CityProvider')
  return context
}

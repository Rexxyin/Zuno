'use client'

import { MapPin } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { INDIA_HIGH_POTENTIAL_CITIES } from '@/lib/cities'
import { useCity } from '@/components/CityContext'

const HIDE_TOP_NAV_ROUTES = ['/settings']

export function TopNav() {
  const pathname = usePathname()
  const { selectedCity, setSelectedCity } = useCity()

  if (HIDE_TOP_NAV_ROUTES.includes(pathname)) return null

  return (
    <div className="sticky top-0 z-20 border-b app-card backdrop-blur-md">
      <div className="mx-auto max-w-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] app-muted">Zuno</p>
            <p className="text-sm font-semibold text-[#1a1410]">City plans</p>
          </div>

          <label className="inline-flex max-w-[60%] items-center gap-1.5 rounded-full border-[1.5px] app-card px-2.5 py-1.5 text-xs text-[#1a1410]">
            <MapPin className="h-3.5 w-3.5" />
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-[#1a1410] outline-none">
              {INDIA_HIGH_POTENTIAL_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}

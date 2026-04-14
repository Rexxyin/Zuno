'use client'

import Link from 'next/link'
import { LogIn, MapPin, UserCircle2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { INDIA_HIGH_POTENTIAL_CITIES } from '@/lib/cities'
import { useCity } from '@/components/CityContext'
import { createClient } from '@/lib/supabase/client'

const HIDE_TOP_NAV_ROUTES = ['/settings']

export function TopNav() {
  const pathname = usePathname()
  const { selectedCity, setSelectedCity } = useCity()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
  }, [])

  if (HIDE_TOP_NAV_ROUTES.includes(pathname)) return null

  return (
    <div className="sticky top-0 z-20 border-b app-card backdrop-blur-md">
      <div className="mx-auto max-w-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] app-muted">Zuno</p>
            <p className="text-sm font-semibold text-[#1a1410]">City plans</p>
          </div>

          <div className="flex max-w-[70%] items-center gap-2">
            <label className="inline-flex min-w-0 items-center gap-1.5 rounded-full border-[1.5px] app-card px-2.5 py-1.5 text-xs text-[#1a1410]">
              <MapPin className="h-3.5 w-3.5" />
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full min-w-0 bg-transparent text-sm font-semibold text-[#1a1410] outline-none">
                {INDIA_HIGH_POTENTIAL_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>

            {userId ? (
              <Link
                href={`/profile/${userId}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] app-card text-[#1a1410]"
                aria-label="Open profile"
              >
                <UserCircle2 className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(pathname || '/feed')}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] app-card text-[#1a1410]"
                aria-label="Sign in"
              >
                <LogIn className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

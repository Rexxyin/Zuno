'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import { Search, Clock3, MapPin } from 'lucide-react'
import type { Plan, PlanCategory } from '@/lib/types'
import { CATEGORY_META } from '@/lib/categories'
import { CategoryIcon } from '@/components/CategoryIcon'
import { DEFAULT_LAUNCH_CITY, INDIA_HIGH_POTENTIAL_CITIES } from '@/lib/cities'

export default function FeedPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>(DEFAULT_LAUNCH_CITY)
  const [query, setQuery] = useState('')

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plans')
      const data = await response.json()
      setPlans(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const categories = Object.keys(CATEGORY_META) as PlanCategory[]

  const filteredPlans = useMemo(
    () =>
      plans
        .filter((p) => (selectedCategory ? p.category === selectedCategory : true))
        .filter((p) => {
          const city = (p.city || '').toLowerCase().trim()
          const target = selectedCity.toLowerCase()
          return city === target
        })
        .filter((p) => {
          const hay = `${p.title} ${p.description || ''} ${p.location_name}`.toLowerCase()
          return hay.includes(query.toLowerCase())
        })
        .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime)),
    [plans, selectedCategory, selectedCity, query]
  )

  const nextPlan = filteredPlans.find((p) => +new Date(p.datetime) > Date.now())
  const minutesToNext = nextPlan ? Math.max(1, Math.round((+new Date(nextPlan.datetime) - Date.now()) / 60000)) : null

  const toggleFavorite = async (plan: Plan) => {
    const method = plan.is_favorite ? 'DELETE' : 'POST'
    const res = await fetch(`/api/plans/${plan.id}/favorite`, { method })
    if (res.ok) {
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, is_favorite: !p.is_favorite } : p)))
    }
  }

  return (
    <div className="pb-24 pt-2">
      <div className="sticky top-0 z-10 border-b app-card backdrop-blur-md">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] app-muted">Zuno</p>
              <h1 className="text-lg font-bold">Discover</h1>
            </div>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-xl border app-card px-2 py-1.5 flex-1">
              <label className="inline-flex w-full items-center gap-2 text-xs app-muted">
                <MapPin className="h-3.5 w-3.5" />
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full bg-transparent text-sm font-medium outline-none">
                  {INDIA_HIGH_POTENTIAL_CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="rounded-xl border app-card px-2 py-1.5 flex-1 inline-flex items-center gap-2">
              <Search className="h-3.5 w-3.5 app-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelectedCategory(null)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${selectedCategory === null ? 'bg-black text-white' : 'app-card'}`}>All Activities</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border inline-flex items-center gap-1 ${selectedCategory === cat ? 'bg-orange-500 text-white border-orange-500' : 'app-card'}`}>
                <CategoryIcon icon={CATEGORY_META[cat].icon} className="h-3 w-3" /> {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4">
        {nextPlan && minutesToNext && (
          <div className="mb-3 rounded-2xl border app-card p-3 text-xs app-muted">
            <p className="inline-flex items-center gap-1 font-semibold"><Clock3 className="h-3 w-3" /> Happening next in {minutesToNext} min</p>
            <p className="mt-1 text-sm font-medium">{nextPlan.title}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-64 rounded-3xl app-card border" />)}</div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="mb-1 text-base font-semibold">No plans in {selectedCity}</h3>
            <p className="mb-5 text-sm app-muted">Create one for this city now.</p>
            <a href="/plans/create" className="inline-block rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-2 text-sm font-semibold text-white">Create Plan</a>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onToggleFavorite={() => toggleFavorite(plan)} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

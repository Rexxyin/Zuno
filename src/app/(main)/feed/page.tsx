'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import { Lock, MapPin, Search } from 'lucide-react'
import type { Plan, PlanCategory } from '@/lib/types'
import { CATEGORY_META } from '@/lib/categories'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useCity } from '@/components/CityContext'
import { normalizeCityKey } from '@/lib/cities'
import { createClient } from '@/lib/supabase/client'

export default function FeedPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAuthed, setIsAuthed] = useState(false)
  const { selectedCity } = useCity()

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
    createClient().auth.getUser().then(({ data }) => setIsAuthed(!!data.user))
  }, [])

  const categories = Object.keys(CATEGORY_META) as PlanCategory[]

  const filteredPlans = useMemo(
    () =>
      plans
        .filter((p) => (selectedCategory ? p.category === selectedCategory : true))
        .filter((p) => {
          const city = normalizeCityKey(p.city)
          const target = normalizeCityKey(selectedCity)
          return city === target
        })
        .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime)),
    [plans, selectedCategory, selectedCity, searchQuery]
  )

  const visiblePlans = isAuthed ? filteredPlans : filteredPlans.slice(0, 5)

  const toggleFavorite = async (plan: Plan) => {
    if (!isAuthed) return
    const method = plan.is_favorite ? 'DELETE' : 'POST'
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, is_favorite: !p.is_favorite } : p)))
    const res = await fetch(`/api/plans/${plan.id}/favorite`, { method })
    if (!res.ok) {
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, is_favorite: !!plan.is_favorite } : p)))
    }
  }

  return (
    <div className="pb-24 min-h-screen">
      <div className="sticky top-0 z-40 app-surface border-b app-card pt-4 pb-3">
        <div className="mx-auto max-w-md px-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-[#1a1410]">Discover</h1>
            <div className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] app-card px-2.5 py-1.5 text-xs font-semibold text-[#1a1410]">
              <MapPin className="h-3.5 w-3.5" />
              {selectedCity}
            </div>
          </div>

          {!isAuthed && <p className="mb-3 text-xs font-semibold text-[#d4522a]">Hurry! 5 live plans unlocked. Sign up to unlock the full feed and join.</p>}

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-[#8f8272] -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plans, people, places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border app-card bg-[#f5efe5] py-2.5 pl-9 pr-3 text-sm text-[#1a1410] placeholder:text-[#8f8272] focus:outline-none focus:ring-1 focus:ring-[#1a1410]"
            />
          </div>
        </div>
      </div>

      <div className="border-b app-card">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => setSelectedCategory(null)} className={`flex flex-col items-center justify-center rounded-xl p-3 transition-all text-xs font-semibold ${selectedCategory === null ? 'bg-[#1a1410] text-[#faf8f4] border-[1.5px] border-[#1a1410]' : 'border-[1.5px] app-card text-[#5a4e42]'}`}>
              <span className="text-lg mb-1">🎯</span>
              All
            </button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex flex-col items-center justify-center rounded-xl p-3 transition-all text-xs font-semibold ${selectedCategory === cat ? 'bg-[#d4522a] text-[#faf8f4] border-[1.5px] border-[#d4522a]' : 'border-[1.5px] app-card text-[#5a4e42]'}`}>
                <span className="text-lg mb-1">
                  <CategoryIcon icon={CATEGORY_META[cat].icon} className="h-5 w-5" />
                </span>
                {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-lg app-card animate-pulse" />)}</div>
        ) : visiblePlans.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-[#1a1410] mb-1">No plans yet</p>
            <p className="text-xs app-muted mb-6">Be the first to create one</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {visiblePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onToggleFavorite={() => toggleFavorite(plan)} isAuthed={isAuthed} />
            ))}
          </div>
        )}

        {!isAuthed && filteredPlans.length > 5 && (
          <a href="/login?next=/feed" className="mt-4 block rounded-xl border border-dashed app-card p-4 text-center text-sm font-semibold text-[#1a1410]">
            <Lock className="mx-auto mb-1 h-4 w-4" /> {filteredPlans.length - 5} more plans are locked. Sign up to unlock.
          </a>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

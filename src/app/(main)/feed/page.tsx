'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import { Lock, MapPin, Search, X } from 'lucide-react'
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
  const [showAuthDialog, setShowAuthDialog] = useState(false)
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
        .filter((p) => normalizeCityKey(p.city) === normalizeCityKey(selectedCity))
        .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime)),
    [plans, selectedCategory, selectedCity, searchQuery]
  )

  const visiblePlans = isAuthed ? filteredPlans : filteredPlans.slice(0, 5)
  const lockedCount = Math.max(filteredPlans.length - 5, 0)

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
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 border-b app-card app-surface pb-3 pt-4">
        <div className="mx-auto max-w-md px-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-[#1a1410]">Discover</h1>
            <div className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] app-card px-2.5 py-1.5 text-xs font-semibold text-[#1a1410]">
              <MapPin className="h-3.5 w-3.5" />
              {selectedCity}
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8272]" />
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
            <button onClick={() => setSelectedCategory(null)} className={`flex flex-col items-center justify-center rounded-xl p-3 text-xs font-semibold transition-all ${selectedCategory === null ? 'border-[1.5px] border-[#1a1410] bg-[#1a1410] text-[#faf8f4]' : 'border-[1.5px] app-card text-[#5a4e42]'}`}>
              <span className="mb-1 text-lg">🎯</span>
              All
            </button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex flex-col items-center justify-center rounded-xl p-3 text-xs font-semibold transition-all ${selectedCategory === cat ? 'border-[1.5px] border-[#d4522a] bg-[#d4522a] text-[#faf8f4]' : 'border-[1.5px] app-card text-[#5a4e42]'}`}>
                <span className="mb-1 text-lg">
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
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-lg app-card" />)}</div>
        ) : visiblePlans.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-1 text-lg font-semibold text-[#1a1410]">No plans yet</p>
            <p className="mb-6 text-xs app-muted">Be the first to create one</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {visiblePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onToggleFavorite={() => toggleFavorite(plan)} isAuthed={isAuthed} />
            ))}
          </div>
        )}

        {!isAuthed && filteredPlans.length > 5 && (
          <div className="relative mt-4 overflow-hidden rounded-2xl border app-card">
            <div className="h-32 bg-gradient-to-b from-[#f6efe4] to-[#e7dbc8]" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="rounded-xl bg-white/95 p-3 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-[#1a1410]">Unlock {lockedCount} more plans</p>
                <p className="mt-0.5 text-xs text-[#6d6052]">Sign in to view full feed and join plans.</p>
                <button
                  type="button"
                  onClick={() => setShowAuthDialog(true)}
                  className="mt-2 w-full rounded-lg bg-[#1a1410] py-2 text-sm font-semibold text-[#faf8f4]"
                >
                  <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Unlock full feed</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAuthDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border app-card p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-[#1a1410]">Sign in to continue</p>
              <button onClick={() => setShowAuthDialog(false)} className="rounded-md p-1 text-[#8f8272]"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-[#5a4e42]">Join plans, request approvals, and manage your own hosted plans.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href="/login?next=/feed" className="rounded-lg border app-card px-3 py-2 text-center text-sm font-semibold text-[#1a1410]">Sign in</a>
              <a href="/login?next=/feed" className="rounded-lg bg-[#1a1410] px-3 py-2 text-center text-sm font-semibold text-[#faf8f4]">Sign up</a>
            </div>
          </div>
        </div>
      )}

      {isAuthed && <BottomNav />}
    </div>
  )
}

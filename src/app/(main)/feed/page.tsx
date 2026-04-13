'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import { MapPin, Search } from 'lucide-react'
import type { Plan, PlanCategory } from '@/lib/types'
import { CATEGORY_META } from '@/lib/categories'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useCity } from '@/components/CityContext'
import { normalizeCityKey } from '@/lib/cities'

export default function FeedPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
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

  // Plans happening in next 30 mins
  const upcomingPlans = useMemo(() => {
    const now = new Date()
    const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60000)
    return filteredPlans.filter((p) => {
      const planTime = new Date(p.datetime)
      return planTime > now && planTime <= thirtyMinsFromNow
    })
  }, [filteredPlans])

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
    <div className="pb-24 min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-4 pb-3">
        <div className="mx-auto max-w-md px-4">
          {/* Title & Location */}
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 border border-teal-200">
              <MapPin className="h-3.5 w-3.5" />
              {selectedCity}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plans, people, places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 border border-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex flex-col items-center justify-center rounded-xl p-3 transition-all text-xs font-semibold ${
                selectedCategory === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="text-lg mb-1">🎯</span>
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-center justify-center rounded-xl p-3 transition-all text-xs font-semibold ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white border border-teal-600'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="text-lg mb-1">
                  <CategoryIcon icon={CATEGORY_META[cat].icon} className="h-5 w-5" />
                </span>
                {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md px-4 py-4">
        {/* Upcoming in 30 mins Section */}
        {upcomingPlans.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-500"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <h2 className="text-xs font-bold text-red-700 uppercase tracking-wide">Happening soon (Next 30 mins)</h2>
            </div>
            <div className="grid gap-3 mb-6">
              {upcomingPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onToggleFavorite={() => toggleFavorite(plan)}
                />
              ))}
            </div>
            <div className="h-px bg-gray-200 mb-6" />
          </div>
        )}

        {/* Happening Soon Alert */}
        {nextPlan && minutesToNext && !upcomingPlans.length && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">⏰</span>
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase">Starting in {minutesToNext} min</p>
                <p className="text-sm font-medium text-amber-900 mt-0.5">{nextPlan.title}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-1">No plans yet</p>
            <p className="text-xs text-gray-600 mb-6">Be the first to create one</p>
            <a
              href="/plans/create"
              className="inline-block rounded-lg bg-teal-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Create a Plan
            </a>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onToggleFavorite={() => toggleFavorite(plan)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

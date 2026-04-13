'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import { Search, Clock3 } from 'lucide-react'
import type { Plan, PlanCategory } from '@/lib/types'
import { CATEGORY_META } from '@/lib/categories'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CategoryIcon } from '@/components/CategoryIcon'

export default function FeedPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>('All')

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/plans')
        if (!response.ok) throw new Error(`API error: ${response.status}`)
        const data = await response.json()
        setPlans(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch plans:', error)
        setPlans([])
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const categories = Object.keys(CATEGORY_META) as PlanCategory[]
  const cities = useMemo(() => ['All', ...Array.from(new Set(plans.map((p) => p.city || 'General')))], [plans])

  const filteredPlans = plans
    .filter((p) => (selectedCategory ? p.category === selectedCategory : true))
    .filter((p) => (selectedCity === 'All' ? true : (p.city || 'General') === selectedCity))
    .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime))

  const nextPlan = filteredPlans.find((p) => +new Date(p.datetime) > Date.now())

  return (
    <div className="pb-24 pt-2">
      <div className="sticky top-0 z-10 border-b app-card backdrop-blur-md">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] app-muted">Zuno</p>
              <h1 className="text-lg font-bold">City plans</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center">
                <Search className="h-3.5 w-3.5" />
              </button>
              <ThemeToggle />
            </div>
          </div>

          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {cities.map((city) => (
              <button key={city} onClick={() => setSelectedCity(city)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ${selectedCity === city ? 'bg-black text-white' : 'app-card'}`}>
                {city}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelectedCategory(null)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${selectedCategory === null ? 'bg-black text-white' : 'app-card'}`}>All</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border inline-flex items-center gap-1 ${selectedCategory === cat ? 'bg-orange-500 text-white border-orange-500' : 'app-card'}`}>
                <CategoryIcon icon={CATEGORY_META[cat].icon} className="h-3 w-3" /> {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4">
        {nextPlan && (
          <div className="mb-3 rounded-2xl border app-card p-3 text-xs app-muted">
            <p className="inline-flex items-center gap-1 font-semibold "><Clock3 className="h-3 w-3" /> Happening next</p>
            <p className="mt-1 text-sm font-medium">{nextPlan.title} · {new Date(nextPlan.datetime).toLocaleString()}</p>
          </div>
        )}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-64 rounded-3xl app-card border" />)}</div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="mb-1 text-base font-semibold">No plans yet</h3>
            <p className="mb-5 text-sm app-muted">Try another city or category.</p>
            <a href="/plans/create" className="inline-block rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-2 text-sm font-semibold text-white">Create Plan</a>
          </div>
        ) : (
          <div className="grid gap-3">{filteredPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}</div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

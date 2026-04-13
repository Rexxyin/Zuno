'use client'

import { useEffect, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import { Search } from 'lucide-react'
import type { Plan, PlanCategory } from '@/lib/types'
import { CATEGORY_META } from '@/lib/categories'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function FeedPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory | null>(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/plans')
        if (!response.ok) throw new Error(`API error: ${response.status}`)
        const data = await response.json()
        const plansArray = Array.isArray(data) ? data : []
        setPlans(plansArray)
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
  const filteredPlans = selectedCategory ? plans.filter(p => p.category === selectedCategory) : plans

  return (
    <div className="pb-28 pt-2">
      <div className="sticky top-0 z-10 border-b app-card backdrop-blur-md">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] app-muted">Zuno</p>
              <h1 className="text-2xl font-black">Discover vibes</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-10 w-10 rounded-full border app-card inline-flex items-center justify-center">
                <Search className="h-4 w-4" />
              </button>
              <ThemeToggle />
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-1">
              <button onClick={() => setSelectedCategory(null)} className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap border ${selectedCategory === null ? 'bg-black text-white' : 'app-card'}`}>
                All Plans
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap border ${selectedCategory === cat ? 'bg-orange-500 text-white border-orange-500' : 'app-card'}`}
                >
                  {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-6">
        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-72 rounded-3xl app-card border" />)}</div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-4xl mb-3">🌈</div>
            <h3 className="text-lg font-bold mb-1">No plans in this vibe yet</h3>
            <p className="text-sm app-muted mb-6">Start one and invite your people.</p>
            <a href="/plans/create" className="inline-block bg-gradient-to-r from-orange-400 to-pink-500 text-white font-semibold px-6 py-2.5 rounded-full">
              Create Plan
            </a>
          </div>
        ) : (
          <div className="grid gap-4">{filteredPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}</div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

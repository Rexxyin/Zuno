'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import type { Plan } from '@/lib/types'
import { useCity } from '@/components/CityContext'
import { normalizeCityKey } from '@/lib/cities'

type PlanView = 'upcoming' | 'past' | 'favorites'

export default function MyPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<PlanView>('upcoming')
  const { selectedCity } = useCity()

  useEffect(() => {
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

    fetchPlans()
  }, [])

  const cityPlans = useMemo(
    () => plans.filter((plan) => normalizeCityKey(plan.city) === normalizeCityKey(selectedCity)),
    [plans, selectedCity]
  )

  const now = Date.now()
  const upcomingPlans = cityPlans
    .filter((p) => p.is_joined && +new Date(p.datetime) >= now)
    .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime))
  const pastPlans = cityPlans
    .filter((p) => p.is_joined && +new Date(p.datetime) < now)
    .sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime))
  const favoritePlans = cityPlans
    .filter((p) => p.is_favorite)
    .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime))

  const plansByView: Record<PlanView, Plan[]> = {
    upcoming: upcomingPlans,
    past: pastPlans,
    favorites: favoritePlans,
  }

  const activePlans = plansByView[view]

  return (
    <div className="pb-24 pt-4">
      <div className="mx-auto mb-4 max-w-md px-4">
        <h1 className="text-xl font-bold text-[#1a1410]">My plans</h1>
        <p className="text-sm app-muted">Track upcoming, past and favourites in one place.</p>
      </div>

      <div className="mx-auto mb-4 max-w-md px-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'upcoming', label: 'Upcoming', count: upcomingPlans.length },
            { key: 'past', label: 'Past', count: pastPlans.length },
            { key: 'favorites', label: 'Favorites', count: favoritePlans.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as PlanView)}
              className={`rounded-xl border-[1.5px] px-2 py-2 text-xs font-semibold transition ${
                view === tab.key ? 'bg-[#1a1410] text-[#faf8f4] border-[#1a1410]' : 'app-card text-[#5a4e42]'
              }`}
            >
              {tab.label}
              <span className={`ml-1 text-[10px] ${view === tab.key ? 'text-[#d4c8b8]' : 'app-muted'}`}>({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md px-4">
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-64 rounded-2xl border app-card" />)}</div>
        ) : activePlans.length === 0 ? (
          <div className="rounded-2xl border app-card p-6 text-center">
            <p className="font-semibold text-[#1a1410]">No {view} plans in {selectedCity}</p>
            <p className="mt-1 text-sm app-muted">Switch city from the top bar or join/save plans in this city.</p>
          </div>
        ) : (
          <div className="grid gap-3">{activePlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}</div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

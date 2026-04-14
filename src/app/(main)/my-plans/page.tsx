'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import type { Plan } from '@/lib/types'
import { useCity } from '@/components/CityContext'
import { normalizeCityKey } from '@/lib/cities'
import { createClient } from '@/lib/supabase/client'

type PlanView = 'upcoming' | 'past' | 'favorites' | 'hosted'

type PendingRequest = {
  user_id: string
  user?: { name?: string | null }
}

export default function MyPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<PlanView>('upcoming')
  const [userId, setUserId] = useState<string | null>(null)
  const [requestsByPlan, setRequestsByPlan] = useState<Record<string, PendingRequest[]>>({})
  const { selectedCity } = useCity()

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/plans')
        const data = await response.json()
        const list = Array.isArray(data) ? data : []
        setPlans(list)

        const { data: auth } = await createClient().auth.getUser()
        setUserId(auth.user?.id || null)
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
  const hostedPlans = cityPlans.filter((p) => p.host_id === userId)

  const plansByView: Record<PlanView, Plan[]> = {
    upcoming: upcomingPlans,
    past: pastPlans,
    favorites: favoritePlans,
    hosted: hostedPlans,
  }

  const loadRequests = async (planId: string) => {
    const res = await fetch(`/api/plans/${planId}/requests`)
    const data = await res.json()
    if (!res.ok) return alert(data.error || 'Unable to load requests')
    setRequestsByPlan((prev) => ({ ...prev, [planId]: data || [] }))
  }

  const handleRequest = async (planId: string, requestUserId: string, action: 'approve' | 'decline') => {
    const res = await fetch(`/api/plans/${planId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestUserId }),
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error || `Unable to ${action}`)
    await loadRequests(planId)
  }

  const activePlans = plansByView[view]

  return (
    <div className="pb-24 pt-4">
      <div className="mx-auto mb-4 max-w-md px-4">
        <h1 className="text-xl font-bold text-[#1a1410]">My plans</h1>
        <p className="text-sm app-muted">Track, host, edit and manage approvals.</p>
      </div>

      <div className="mx-auto mb-4 max-w-md px-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'upcoming', label: 'Upcoming', count: upcomingPlans.length },
            { key: 'past', label: 'Past', count: pastPlans.length },
            { key: 'favorites', label: 'Favorites', count: favoritePlans.length },
            { key: 'hosted', label: 'Hosted', count: hostedPlans.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as PlanView)}
              className={`rounded-xl border-[1.5px] px-2 py-2 text-xs font-semibold transition ${
                view === tab.key ? 'border-[#1a1410] bg-[#1a1410] text-[#faf8f4]' : 'app-card text-[#5a4e42]'
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
          <div className="grid gap-3">
            {activePlans.map((plan) => (
              <div key={plan.id} className="space-y-2">
                <PlanCard plan={plan} />
                {view === 'hosted' && (
                  <div className="rounded-xl border app-card p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <a href={`/plans/${plan.id}/edit`} className="rounded-lg border app-card px-3 py-2 text-center text-sm font-semibold">Edit plan</a>
                      <button onClick={() => loadRequests(plan.id)} className="rounded-lg bg-[#1a1410] px-3 py-2 text-sm font-semibold text-[#faf8f4]">Manage requests</button>
                    </div>

                    {!!requestsByPlan[plan.id]?.length && (
                      <div className="mt-2 space-y-2 text-sm">
                        {requestsByPlan[plan.id].map((req) => (
                          <div key={req.user_id} className="flex items-center justify-between rounded-lg border app-card px-2 py-1.5">
                            <span>{req.user?.name || 'User'}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleRequest(plan.id, req.user_id, 'approve')} className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">Approve</button>
                              <button onClick={() => handleRequest(plan.id, req.user_id, 'decline')} className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

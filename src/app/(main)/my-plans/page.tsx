'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import type { Plan } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toast'
import { computeEffectivePlanStatus } from '@/lib/plan'
import { PlanCardSkeleton } from '@/components/PlanCardSkeleton'

type PlanView = 'upcoming' | 'past' | 'favorites' | 'hosted'

export default function MyPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<PlanView>('upcoming')
  const [userId, setUserId] = useState<string | null>(null)
  const [requestsByPlan, setRequestsByPlan] = useState<Record<string, any[]>>({})

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data: auth } = await createClient().auth.getUser()
        setUserId(auth.user?.id || null)
        setLoading(true)
        const response = await fetch('/api/plans?includeMine=1', { cache: 'no-store' })
        const data = await response.json()
        setPlans(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch plans:', error)
        setPlans([])
      } finally { setLoading(false) }
    }
    fetchPlans()
  }, [])

  const now = Date.now()
  const hostedPlans = useMemo(() => plans.filter((p) => p.host_id === userId), [plans, userId])
  const upcomingPlans = useMemo(() => plans.filter((p) => (p.is_joined || p.host_id === userId) && +new Date(p.datetime) > now && computeEffectivePlanStatus(p as any) !== 'expired'), [plans, now, userId])
  const pastPlans = useMemo(() => plans.filter((p) => (p.is_joined || p.host_id === userId) && (+new Date(p.datetime) < now || computeEffectivePlanStatus(p as any) === 'expired')), [plans, now, userId])
  const favoritePlans = useMemo(() => plans.filter((p) => p.is_favorite), [plans])

  const pendingHostedRequests = hostedPlans.reduce((sum, plan) => sum + (plan.participants || []).filter((p: any) => p.status === 'pending').length, 0)
  const plansByView: Record<PlanView, Plan[]> = { upcoming: upcomingPlans, past: pastPlans, favorites: favoritePlans, hosted: hostedPlans }

  const loadRequests = async (planId: string) => {
    const res = await fetch(`/api/plans/${planId}/requests`)
    const data = await res.json()
    if (!res.ok) return toast.error('Unable to load requests', { description: data.error || 'Please try again.' })
    setRequestsByPlan((prev) => ({ ...prev, [planId]: data || [] }))
  }

  const handleRequest = async (planId: string, requestUserId: string, action: 'approve' | 'decline') => {
    const res = await fetch(`/api/plans/${planId}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestUserId }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(`Unable to ${action}`, { description: data.error || 'Please try again.' })
    await loadRequests(planId)
  }

  const activePlans = plansByView[view]

  return (
    <div className="pb-24 pt-4">
      <div className="mx-auto mb-4 max-w-md px-4"><h1 className="text-xl font-bold text-[#1a1410]">My plans</h1><p className="text-sm app-muted">Track, host, edit and manage approvals.</p></div>
      <div className="mx-auto mb-4 max-w-md px-4"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[{ key: 'upcoming', label: 'Upcoming', count: upcomingPlans.length }, { key: 'past', label: 'Past', count: pastPlans.length }, { key: 'favorites', label: 'Favorites', count: favoritePlans.length }, { key: 'hosted', label: 'Hosted', count: hostedPlans.length, pending: pendingHostedRequests }].map((tab: any) => <button key={tab.key} onClick={() => setView(tab.key)} className={`min-h-[46px] rounded-xl border-[1.5px] px-2 py-1.5 text-[11px] font-semibold leading-tight transition ${view === tab.key ? 'border-[#1a1410] bg-[#1a1410] text-[#faf8f4]' : 'app-card text-[#5a4e42]'}`}>{tab.label}<span className={`ml-1 text-[10px] ${view === tab.key ? 'text-[#d4c8b8]' : 'app-muted'}`}>({tab.count})</span>{!!tab.pending && <span className="ml-1 rounded-full bg-[#d4522a] px-1.5 py-0.5 text-[10px] text-white">{tab.pending}</span>}</button>)}</div></div>

      <div className="mx-auto max-w-md px-4">
        {loading ? <div className="space-y-3">{[1, 2, 3].map((i) => <PlanCardSkeleton key={i} />)}</div> : activePlans.length === 0 ? <div className="rounded-2xl border app-card p-6 text-center"><p className="text-sm font-medium text-[#1a1410]">No {view} plans found</p></div> : <div className="grid gap-3">{activePlans.map((plan) => <div key={plan.id} className="space-y-1.5"><PlanCard plan={plan} />{view === 'hosted' && <div className="rounded-xl border app-card p-2.5"><div className="grid grid-cols-2 gap-2"><a href={`/plans/${plan.id}/edit`} className="rounded-lg border app-card px-2.5 py-2 text-center text-xs font-semibold">Edit</a><button onClick={() => loadRequests(plan.id)} className="rounded-lg bg-[#1a1410] px-2.5 py-2 text-xs font-semibold text-[#faf8f4]">Manage ({requestsByPlan[plan.id]?.length || 0})</button></div>{!!requestsByPlan[plan.id]?.length && <div className="mt-2 space-y-1.5 text-sm">{requestsByPlan[plan.id].map((req: any) => <div key={req.user_id} className="flex items-center justify-between rounded-lg border app-card px-2 py-1.5"><span className="text-xs font-medium text-[#2b221c]">{req.user?.name || 'User'}</span><div className="flex items-center gap-1"><button onClick={() => handleRequest(plan.id, req.user_id, 'approve')} className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white">Approve</button><button onClick={() => handleRequest(plan.id, req.user_id, 'decline')} className="rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white">Decline</button></div></div>)}</div>}</div>}</div>)}</div>}
      </div>
      <BottomNav pendingRequestsCount={pendingHostedRequests} />
    </div>
  )
}

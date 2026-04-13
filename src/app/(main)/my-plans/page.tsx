'use client'

import { useEffect, useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import { BottomNav } from '@/components/BottomNav'
import type { Plan } from '@/lib/types'

export default function MyPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/favorites')
        const data = await response.json()
        setPlans(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch saved plans:', error)
        setPlans([])
      } finally {
        setLoading(false)
      }
    }

    fetchSaved()
  }, [])

  return (
    <div className="pb-24 pt-4">
      <div className="mx-auto mb-4 max-w-md px-4">
        <h1 className="text-xl font-bold">Saved plans</h1>
        <p className="text-sm app-muted">Your favourites in one place</p>
      </div>

      <div className="mx-auto max-w-md px-4">
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-64 rounded-2xl border app-card" />)}</div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border app-card p-6 text-center">
            <p className="font-semibold">No saved plans yet</p>
            <p className="mt-1 text-sm app-muted">Tap heart on any plan to save it.</p>
          </div>
        ) : (
          <div className="grid gap-3">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}</div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

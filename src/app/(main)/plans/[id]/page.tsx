'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {  Users, Calendar, Heart, ChevronLeft, Info, Instagram } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { BottomNav } from '@/components/BottomNav'
import { LocationLink } from '@/components/LocationLink'
import { TrustBadge } from '@/components/TrustBadge'
import type { Plan } from '@/lib/types'

export default function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const response = await fetch(`/api/plans/${id}`)
    if (response.ok) {
      const data = await response.json()
      setPlan(data)
      setLoadError(null)
      const mine = (data.participants || []).some((p: any) => p.user_id === data.current_user_id && p.status === 'joined')
      setIsJoined(mine)
    } else {
      const err = await response.json().catch(() => ({ error: 'Plan not found' }))
      setLoadError(err.error || 'Plan not found')
    }

    const favResp = await fetch('/api/favorites')
    if (favResp.ok) {
      const favs = await favResp.json()
      setIsSaved((favs || []).some((p: Plan) => p.id === id))
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  const participantCount = useMemo(() => ((plan?.participants || []).filter((p: any) => p.status === 'joined').length || 0) + 1, [plan])
  const isHost = (plan as any)?.current_user_id && (plan as any).current_user_id === plan?.host_id
  const isExpired = useMemo(() => plan && new Date(plan.datetime) < new Date(), [plan])

  const join = async () => {
    const resp = await fetch(`/api/plans/${id}/join`, { method: 'POST' })
    if (resp.ok) {
      setIsJoined(true)
      load()
    } else {
      const err = await resp.json()
      if (resp.status === 401) return router.push(`/login?next=/plans/${id}`)
      alert(err.error || 'Unable to join')
    }
  }

  const leave = async () => {
    const resp = await fetch(`/api/plans/${id}/leave`, { method: 'POST' })
    if (resp.ok) {
      setIsJoined(false)
      load()
    }
  }

  const toggleSave = async () => {
    const method = isSaved ? 'DELETE' : 'POST'
    const resp = await fetch(`/api/plans/${id}/favorite`, { method })
    if (resp.status === 401) return router.push(`/login?next=/plans/${id}`)
    if (resp.ok) setIsSaved(!isSaved)
  }

  if (loading) return <div className="min-h-screen pb-24" />

  if (!plan) {
    return (
      <div className="min-h-screen px-4 py-20 text-center">
        <p className="text-base font-semibold">{loadError || 'Plan not found'}</p>
        <button onClick={load} className="mt-4 rounded-xl border app-card px-4 py-2 text-sm font-medium">Retry</button>
      </div>
    )
  }

  const planDate = new Date(plan.datetime)

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b app-card p-3">
        <button onClick={() => router.back()} className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
        <p className="text-sm font-semibold">Plan</p>
        <button onClick={toggleSave} className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center">
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-[#d4522a] text-[#d4522a]' : ''}`} />
        </button>
      </div>

      <div className="relative h-72 w-full overflow-hidden">
        <Image src={plan.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200'} alt={plan.title} fill className="object-cover" />
      </div>

      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-bold">{plan.title}</h1>
            {isExpired && (
              <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">Expired</span>
            )}
          </div>
          <p className="text-sm app-muted">{plan.location_name}</p>
        </div>

        <div className="rounded-2xl border app-card p-3 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Organizer</span>
            <TrustBadge score={plan.host?.reliability_score ?? 100} />
          </div>
          <p className="font-medium">{plan.host?.name || 'Host'}</p>
          {plan.host?.instagram_url && (
            <a href={plan.host.instagram_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-pink-500 text-xs">
              <Instagram className="h-3 w-3" /> Instagram profile
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border app-card p-3"><p className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {planDate.toLocaleString()}</p></div>
          <div className="rounded-xl border app-card p-3"><p className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {participantCount}/{plan.max_people}</p></div>
          <div className="rounded-xl border app-card p-3"><LocationLink location={plan.location_name} googleMapsLink={plan.google_maps_link} /></div>
          <div className="rounded-xl border app-card p-3"><p className="inline-flex items-center gap-1"><Info className="h-4 w-4" /> Host included in count</p></div>
        </div>

        {plan.show_payment_options && plan.host?.gpay_link && (
          <a href={plan.host.gpay_link} target="_blank" rel="noreferrer" className="block rounded-xl border app-card p-3 text-sm font-medium">
            Pay organizer (GPay)
          </a>
        )}

        {plan.whatsapp_link && isJoined && !isExpired && (
          <a href={plan.whatsapp_link} target="_blank" rel="noreferrer" className="block rounded-xl bg-green-500 px-4 py-3 text-center text-sm font-semibold text-white">
            Open WhatsApp group
          </a>
        )}



        {(plan.participants || []).length > 0 && (
          <div className="rounded-2xl border app-card p-3 text-sm">
            <p className="mb-2 font-semibold">People joining</p>
            <div className="space-y-2">
              {(plan.participants || []).filter((p: any) => p.status === 'joined').map((p: any) => (
                <Link key={p.id} href={`/profile/${p.user_id}`} className="flex items-center justify-between rounded-lg bg-black/5 px-2 py-1.5">
                  <span>{p.user?.name || 'User'}</span>
                  <span className="text-xs app-muted">View profile</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {isExpired ? (
            <button disabled className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 cursor-not-allowed opacity-50">This plan has ended</button>
          ) : isHost ? (
            <button disabled className="rounded-xl border app-card px-4 py-2.5 text-sm font-semibold app-muted">You are the organizer</button>
          ) : !isJoined ? (
            <button onClick={join} className="rounded-xl bg-[#1a1410] px-4 py-2.5 text-sm font-semibold text-[#faf8f4]">Join plan</button>
          ) : (
            <button onClick={leave} className="rounded-xl border app-card px-4 py-2.5 text-sm font-semibold">Leave anytime</button>
          )}
          <button onClick={() => router.push('/feed')} className="rounded-xl border app-card px-4 py-2.5 text-sm font-semibold">Back to feed</button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toast'
import { Users, Calendar, Heart, ChevronLeft, Info, Instagram, Lock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { BottomNav } from '@/components/BottomNav'
import { LocationLink } from '@/components/LocationLink'
import { TrustBadge } from '@/components/TrustBadge'
import type { Plan } from '@/lib/types'
import { generateUpiLink, isMobileDevice, normalizeUpiId } from '@/lib/upi'

type JoinedParticipant = {
  id: string
  user_id: string
  user?: {
    name?: string | null
  }
}

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

  const joinedParticipants = useMemo(
    () => ((plan?.participants || []).filter((p: any) => p.status === 'joined') as JoinedParticipant[]),
    [plan?.participants],
  )
  const participantCount = useMemo(() => joinedParticipants.length + 1, [joinedParticipants.length])
  const isHost = (plan as any)?.current_user_id && (plan as any).current_user_id === plan?.host_id
  const isExpired = useMemo(() => plan && new Date(plan.datetime) < new Date(), [plan])

  const normalizedUpiId = useMemo(() => normalizeUpiId(plan?.host?.gpay_link), [plan?.host?.gpay_link])
  const splitAmount = useMemo(() => {
    if (!plan) return null

    if (typeof plan.per_person_amount === 'number' && Number.isFinite(plan.per_person_amount) && plan.per_person_amount > 0) {
      return Number(plan.per_person_amount)
    }

    if (typeof plan.total_amount === 'number' && Number.isFinite(plan.total_amount) && plan.total_amount > 0 && participantCount > 0) {
      return Number(plan.total_amount) / participantCount
    }

    return null
  }, [participantCount, plan])

  const paymentRows = useMemo(() => {
    if (!plan || !splitAmount || !normalizedUpiId) return []
    const note = `${plan.title} split`

    return joinedParticipants
      .filter((participant) => participant.user_id !== plan.host_id)
      .map((participant) => ({
        userId: participant.user_id,
        name: participant.user?.name || 'Participant',
        amount: splitAmount,
        intent: generateUpiLink({
          upiId: normalizedUpiId,
          amount: splitAmount,
          note,
        }),
      }))
  }, [joinedParticipants, normalizedUpiId, plan, splitAmount])

  const launchPayment = (intentLink: string) => {
    if (!intentLink) {
      toast.error('Payment link not available', {
        description: 'Organizer has not set a valid UPI ID yet.',
      })
      return
    }

    if (!isMobileDevice()) {
      toast.error('Open on mobile to pay', {
        description: 'UPI apps open directly on a phone. You can still copy this link manually.',
      })
      return
    }

    window.location.href = intentLink
  }

  const join = async () => {
    const resp = await fetch(`/api/plans/${id}/join`, { method: 'POST' })
    if (resp.ok) {
      setIsJoined(true)
      load()
    } else {
      const err = await resp.json()
      if (resp.status === 401) return router.push(`/login?next=/plans/${id}`)
      toast.error('Unable to join', { description: err.error || 'Please try again.' })
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
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-xl font-bold">{plan.title}</h1>
            {plan.visibility === 'private' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1410] px-2 py-1 text-[10px] font-semibold text-[#faf8f4]"><Lock className="h-3 w-3" /> Private</span>
            )}
            {isExpired && (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">Expired</span>
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
            <a href={plan.host.instagram_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-pink-500">
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

        {plan.show_payment_options && splitAmount && paymentRows.length > 0 && (
          <section className="space-y-2 rounded-2xl border app-card p-3 text-sm">
            <div>
              <p className="font-semibold text-[#1a1410]">Split payments</p>
              <p className="text-xs app-muted">
                {plan.per_person_amount ? 'Per person split set by organizer.' : 'Auto split from total amount.'} Each share: ₹{splitAmount.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              {paymentRows.map((row) => (
                <div key={row.userId} className="flex items-center justify-between rounded-lg border app-card px-2.5 py-2">
                  <div>
                    <p className="text-sm font-medium text-[#1a1410]">{row.name}</p>
                    <p className="text-xs app-muted">₹{row.amount.toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => launchPayment(row.intent)}
                    className="rounded-lg bg-[#1a1410] px-3 py-1.5 text-xs font-semibold text-[#faf8f4]"
                  >
                    Pay now
                  </button>
                </div>
              ))}
            </div>
          </section>
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
            <button disabled className="cursor-not-allowed rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 opacity-50">This plan has ended</button>
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

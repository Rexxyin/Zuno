'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronLeft, Heart, Info, Instagram, Users } from 'lucide-react'
import Image from 'next/image'
import { BottomNav } from '@/components/BottomNav'
import { LocationLink } from '@/components/LocationLink'
import { TrustBadge } from '@/components/TrustBadge'
import type { Plan } from '@/lib/types'

export default function PlanPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const load = async () => {
    setLoading(true)
    const response = await fetch(`/api/plans/${params.id}`)
    if (response.ok) {
      const data = await response.json()
      setPlan(data)
      const mine = (data.participants || []).some((p: any) => p.user_id === data.current_user_id && p.status === 'joined')
      setIsJoined(mine)
    }

    const favResp = await fetch('/api/favorites')
    if (favResp.ok) {
      const favs = await favResp.json()
      setIsSaved((favs || []).some((p: Plan) => p.id === params.id))
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [params.id])

  const participantCount = useMemo(() => ((plan?.participants || []).filter((p: any) => p.status === 'joined').length || 0) + 1, [plan])
  const isHost = (plan as any)?.current_user_id && (plan as any).current_user_id === plan.host_id

  const join = async () => {
    const resp = await fetch(`/api/plans/${params.id}/join`, { method: 'POST' })
    if (resp.ok) {
      setIsJoined(true)
      load()
    } else {
      const err = await resp.json()
      alert(err.error || 'Unable to join')
    }
  }

  const leave = async () => {
    const resp = await fetch(`/api/plans/${params.id}/leave`, { method: 'POST' })
    if (resp.ok) {
      setIsJoined(false)
      load()
    }
  }

  const toggleSave = async () => {
    const method = isSaved ? 'DELETE' : 'POST'
    const resp = await fetch(`/api/plans/${params.id}/favorite`, { method })
    if (resp.ok) setIsSaved(!isSaved)
  }

  if (loading || !plan) return <div className="min-h-screen pb-24" />

  const planDate = new Date(plan.datetime)

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b app-card p-3">
        <button onClick={() => router.back()} className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
        <p className="text-sm font-semibold">Plan</p>
        <button onClick={toggleSave} className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center">
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      <div className="relative h-72 w-full overflow-hidden">
        <Image src={plan.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200'} alt={plan.title} fill className="object-cover" />
      </div>

      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-bold">{plan.title}</h1>
          <p className="text-sm app-muted">{plan.city || 'General'} · {plan.location_name}</p>
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

        {plan.whatsapp_link && (
          <a href={plan.whatsapp_link} target="_blank" rel="noreferrer" className="block rounded-xl bg-green-500 px-4 py-3 text-center text-sm font-semibold text-white">
            Open WhatsApp group
          </a>
        )}

        <div className="grid grid-cols-2 gap-2">
          {isHost ? (
            <button disabled className="rounded-xl border app-card px-4 py-2.5 text-sm font-semibold app-muted">You are the organizer</button>
          ) : !isJoined ? (
            <button onClick={join} className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white">Join plan</button>
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

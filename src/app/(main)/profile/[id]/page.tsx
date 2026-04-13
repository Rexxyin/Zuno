'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Instagram, ShieldCheck } from 'lucide-react'
import { TrustBadge } from '@/components/TrustBadge'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isOwnProfile = params.id === 'me'

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const targetId = isOwnProfile ? authUser.id : params.id
      const { data } = await supabase.from('users').select('*').eq('id', targetId).single()
      setUser(data)
      setLoading(false)
    }

    load()
  }, [params.id, isOwnProfile, router, supabase])

  if (loading) return <div className="min-h-screen pb-24" />

  if (!user) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-24 text-center">
        <p className="text-lg font-semibold">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b app-card p-3">
        <button onClick={() => router.back()} className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold">Profile</p>
        <div className="h-8 w-8" />
      </div>

      <div className="mx-auto max-w-md space-y-4 px-4 py-5">
        <div className="rounded-3xl border app-card p-4 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-pink-400 text-xl font-bold text-white">
            {user.name?.charAt(0) || 'U'}
          </div>
          <h1 className="text-lg font-semibold">{user.name}</h1>
          {user.instagram_url && (
            <a href={user.instagram_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-pink-500">
              <Instagram className="h-3 w-3" /> Instagram
            </a>
          )}
          {user.gpay_link && (
            <a href={user.gpay_link} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-emerald-500">GPay available</a>
          )}
          <div className="mt-3 flex justify-center">
            <TrustBadge score={user.reliability_score} />
          </div>
          {user.phone_verified && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
              <ShieldCheck className="h-3 w-3" /> Verified
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border app-card p-3">
            <p className="text-lg font-semibold">{user.reliability_score}%</p>
            <p className="text-[11px] app-muted">Reliable</p>
          </div>
          <div className="rounded-2xl border app-card p-3">
            <p className="text-lg font-semibold">{user.total_joined}</p>
            <p className="text-[11px] app-muted">Joined</p>
          </div>
          <div className="rounded-2xl border app-card p-3">
            <p className="text-lg font-semibold">{user.total_attended}</p>
            <p className="text-[11px] app-muted">Attended</p>
          </div>
        </div>

        {isOwnProfile && (
          <button onClick={() => router.push('/settings')} className="w-full rounded-2xl border app-card px-3 py-2 text-sm font-medium">
            Open Settings
          </button>
        )}

      </div>

      <BottomNav />
    </div>
  )
}

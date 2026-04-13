'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Instagram, LogOut, Settings } from 'lucide-react'
import Image from 'next/image'
import { TrustBadge } from '@/components/TrustBadge'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const isOwnProfile = id === 'me'

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      setSigningOut(false)
    }
  }

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

      const targetId = isOwnProfile ? authUser.id : id
      const { data } = await supabase.from('users').select('*').eq('id', targetId).single()
      setUser(data)
      setLoading(false)
    }

    load()
  }, [id, isOwnProfile, router, supabase])

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
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/98 p-4">
        <button onClick={() => router.back()} className="h-8 w-8 rounded-lg inline-flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-gray-900">Profile</p>
        <div className="h-8 w-8" />
      </div>

      <div className="mx-auto max-w-md space-y-4 px-4 py-5">
        {/* Hero Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          {/* Avatar */}
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-xl font-bold text-white">
            {user.avatar_url ? <Image src={user.avatar_url} alt={user.name} width={80} height={80} className="h-full w-full object-cover" /> : (user.name?.charAt(0).toUpperCase() || 'U')}
          </div>

          {/* Name */}
          <h1 className="text-xl font-semibold text-gray-900">{user.name}</h1>
          <p className="mt-1 text-xs text-gray-500">{user.phone_verified && '✓ Verified'}</p>
        </div>

        {/* Social Links - Horizontal */}
        <div className="flex gap-2">
          {user.instagram_url && (
            <a href={user.instagram_url} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 px-3 py-2 text-xs font-semibold text-white hover:shadow-md transition-all active:scale-95">
              <Instagram className="h-4 w-4" /> Instagram
            </a>
          )}
          {user.gpay_link && (
            <a href={user.gpay_link} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:shadow-md transition-all active:scale-95">
              💳 GPay
            </a>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-lg font-semibold text-gray-900">{user.reliability_score}%</p>
            <p className="mt-0.5 text-xs text-gray-600">Reliable</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-lg font-semibold text-gray-900">{user.total_joined}</p>
            <p className="mt-0.5 text-xs text-gray-600">Joined</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-lg font-semibold text-gray-900">{user.total_attended}</p>
            <p className="mt-0.5 text-xs text-gray-600">Completed</p>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">TRUST SCORE</p>
          <div className="flex justify-center">
            <TrustBadge score={user.reliability_score} />
          </div>
        </div>

        {isOwnProfile && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <a href="/settings" className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-xs font-semibold text-gray-700 inline-flex items-center justify-center gap-1.5"><Settings className="h-4 w-4" /> Manage profile</a>
            <button onClick={handleSignOut} disabled={signingOut} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-xs font-semibold text-gray-700 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"><LogOut className="h-4 w-4" /> {signingOut ? 'Signing...' : 'Sign Out'}</button>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Camera, ChevronLeft, Instagram, LogOut, Save, Sparkles } from 'lucide-react'
import { TrustBadge } from '@/components/TrustBadge'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import { generateAvatarSeed, getUserAvatarUrl } from '@/lib/avatar'
import { toast } from '@/components/ui/toast'
import { generateUpiLink, normalizeUpiId } from '@/lib/upi'

type EditableProfile = {
  name: string
  email: string
  avatarUrl: string
  instagramUrl: string
  gpayLink: string
  upiPayeeName: string
  avatarSeed: string
}

export default function ProfilePage() {
  const params = useParams<{ id: string }>()
  const id = params?.id || ''
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [edit, setEdit] = useState<EditableProfile>({
    name: '',
    avatarUrl: '',
    instagramUrl: '',
    gpayLink: '',
    upiPayeeName: '',
    email: '',
    avatarSeed: '',
  })
  const isOwnProfile = id === 'me' || !id

  const applyProfileToForm = (profile: User) => {
    setEdit({
      name: profile.name || '',
      avatarUrl: profile.avatar_url || '',
      instagramUrl: profile.instagram_url || '',
      gpayLink: profile.gpay_link || '',
      upiPayeeName: profile.upi_payee_name || '',
      email: (profile as any).email || '',
      avatarSeed: profile.avatar_seed || '',
    })
  }

  const loadProfile = async () => {
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
    if (data && isOwnProfile) (data as any).email = authUser.email || ''

    if (!data) {
      setUser(null)
      setLoading(false)
      return
    }

    let profile = data as User

    if (!profile.avatar_seed) {
      const nextSeed = generateAvatarSeed()
      profile = { ...profile, avatar_seed: nextSeed }

      const shouldPersistDefaultSeed = isOwnProfile || targetId === authUser.id
      if (shouldPersistDefaultSeed) {
        await supabase.from('users').update({ avatar_seed: nextSeed }).eq('id', targetId)
      }
    }

    setUser(profile)
    applyProfileToForm(profile)
    setLoading(false)
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOwnProfile])

  const displayedAvatar = useMemo(
    () =>
      getUserAvatarUrl({
        avatarUrl: edit.avatarUrl,
        avatarSeed: edit.avatarSeed,
        fallbackSeed: user?.id || user?.name,
      }),
    [edit.avatarSeed, edit.avatarUrl, user?.id, user?.name],
  )

  const handleAvatarRegenerate = () => {
    const nextSeed = generateAvatarSeed()
    setEdit((prev) => ({ ...prev, avatarSeed: nextSeed }))
    toast.success('Avatar refreshed', {
      description: 'A new Dicebear avatar is ready. Save to keep it.',
    })
  }

  const handleSave = async () => {
    if (!edit.name.trim()) {
      toast.error('Name is required', {
        description: 'Please add your name before saving profile changes.',
      })
      return
    }

    setSaving(true)

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      toast.error('Session expired', {
        description: 'Please log in again to update your profile.',
      })
      setSaving(false)
      router.replace('/login')
      return
    }

    const updates = {
      name: edit.name.trim(),
      avatar_url: edit.avatarUrl.trim() || null,
      avatar_seed: edit.avatarSeed.trim() || generateAvatarSeed(),
      instagram_url: edit.instagramUrl.trim() || null,
      gpay_link: edit.gpayLink.trim() || null,
      upi_payee_name: edit.upiPayeeName.trim() || null,
      instagram_handle: edit.instagramUrl.trim()
        ? edit.instagramUrl.split('/').filter(Boolean).pop() || null
        : null,
    }

    const { error } = await supabase.from('users').update(updates).eq('id', auth.user.id)

    if (error) {
      toast.error('Unable to save profile', {
        description: error.message,
      })
      setSaving(false)
      return
    }

    toast.success('Profile saved', {
      description: 'Your public profile and avatar are updated.',
    })

    const updatedUser = { ...user, ...updates } as User
    setUser(updatedUser)
    applyProfileToForm(updatedUser)
    setSaving(false)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Sign out failed', {
        description: 'Please try again.',
      })
      setSigningOut(false)
    }
  }

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
        <button onClick={() => router.back()} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-gray-900">Profile</p>
        <div className="h-8 w-8" />
      </div>

      <div className="mx-auto max-w-md space-y-4 px-4 py-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-[0_4px_20px_rgba(20,20,20,0.06)]">
          <div className="relative mx-auto mb-3 h-24 w-24">
            <img src={displayedAvatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
            {isOwnProfile && (
              <button
                onClick={handleAvatarRegenerate}
                className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-black text-white shadow"
                aria-label="Generate new avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{user.name}</h1>
          {user.phone_verified && <p className="mt-1 text-sm font-medium text-emerald-600">✓ Verified profile</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-2xl font-semibold text-gray-900">{user.reliability_score}%</p>
            <p className="mt-0.5 text-xs text-gray-600">Reliable</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-2xl font-semibold text-gray-900">{user.total_joined}</p>
            <p className="mt-0.5 text-xs text-gray-600">Joined</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-2xl font-semibold text-gray-900">{user.total_attended}</p>
            <p className="mt-0.5 text-xs text-gray-600">Completed</p>
          </div>
        </div>

        {isOwnProfile && (
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_4px_20px_rgba(20,20,20,0.06)]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Manage profile</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
                <Sparkles className="h-3.5 w-3.5" /> Public view
              </span>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Name</span>
              <input value={edit.name} onChange={(e) => setEdit((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border app-card px-3 py-2" />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Avatar URL (optional)</span>
              <input value={edit.avatarUrl} onChange={(e) => setEdit((prev) => ({ ...prev, avatarUrl: e.target.value }))} className="w-full rounded-xl border app-card px-3 py-2" placeholder="https://..." />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Instagram profile URL (optional)</span>
              <input value={edit.instagramUrl} onChange={(e) => setEdit((prev) => ({ ...prev, instagramUrl: e.target.value }))} className="w-full rounded-xl border app-card px-3 py-2" placeholder="https://instagram.com/username" />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Email</span>
              <input value={edit.email} readOnly className="w-full rounded-xl border app-card px-3 py-2 text-gray-500" />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">UPI ID (optional)</span>
              <input value={edit.gpayLink} onChange={(e) => setEdit((prev) => ({ ...prev, gpayLink: e.target.value }))} className="w-full rounded-xl border app-card px-3 py-2" placeholder="name@upi" />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Payee name</span>
              <input value={edit.upiPayeeName} onChange={(e) => setEdit((prev) => ({ ...prev, upiPayeeName: e.target.value }))} className="w-full rounded-xl border app-card px-3 py-2" placeholder="Name as shown in your UPI app" />
              <p className='mt-1 text-xs text-gray-500'>This name appears when someone pays you via UPI — make sure it matches exactly.</p>
            </label>

            <button onClick={handleSave} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save profile'}
            </button>

            <button onClick={handleSignOut} disabled={signingOut} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 disabled:opacity-50">
              <LogOut className="h-4 w-4" /> {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        )}

        {!isOwnProfile && (user.instagram_url || user.gpay_link) && (
          <div className="flex gap-2">
            {user.instagram_url && (
              <a href={user.instagram_url} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 px-3 py-2 text-xs font-semibold text-white transition-all hover:shadow-md active:scale-95">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            )}
            {user.gpay_link && (() => {
              const upiIntentLink = generateUpiLink({ upiId: normalizeUpiId(user.gpay_link) })
              if (!upiIntentLink) return null

              return (
                <a href={upiIntentLink} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:shadow-md active:scale-95">
                  💳 Pay via UPI
                </a>
              )
            })()}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

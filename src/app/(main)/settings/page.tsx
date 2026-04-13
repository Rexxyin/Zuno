'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, LogOut, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [gpayLink, setGpayLink] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const { data } = await supabase.from('users').select('name,avatar_url,instagram_url,gpay_link').eq('id', auth.user.id).single()
      setName(data?.name || '')
      setAvatarUrl(data?.avatar_url || '')
      setInstagramUrl(data?.instagram_url || '')
      setGpayLink(data?.gpay_link || '')
    }
    load()
  }, [supabase])

  const save = async () => {
    if (!instagramUrl) return alert('Instagram profile link is required.')
    if (!name.trim()) return alert('Name is required.')

    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    if (auth.user) {
      await supabase
        .from('users')
        .update({ name, avatar_url: avatarUrl || null, instagram_url: instagramUrl, gpay_link: gpayLink || null, instagram_handle: instagramUrl.split('/').filter(Boolean).pop() || null })
        .eq('id', auth.user.id)
    }
    setLoading(false)
    alert('Saved')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
          <h1 className="text-sm font-semibold">Settings</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="space-y-3 rounded-2xl border app-card p-3 text-sm">
          <label className="block"><span className="mb-1 block font-medium">Name</span><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border app-card px-3 py-2" /></label>
          <label className="block"><span className="mb-1 block font-medium">Profile photo URL</span><input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full rounded-xl border app-card px-3 py-2" /></label>
          <label className="block"><span className="mb-1 block font-medium">Instagram profile URL (required)</span><input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full rounded-xl border app-card px-3 py-2" /></label>
          <label className="block"><span className="mb-1 block font-medium">UPI / GPay link</span><input value={gpayLink} onChange={(e) => setGpayLink(e.target.value)} className="w-full rounded-xl border app-card px-3 py-2" /></label>
          <button onClick={save} disabled={loading} className="w-full rounded-xl bg-black px-3 py-2 text-white inline-flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Save</button>
          <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 font-medium text-red-500"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </div>
    </div>
  )
}

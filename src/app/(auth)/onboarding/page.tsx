'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.replace('/login')

      const { data: profile } = await supabase
        .from('users')
        .select('name,gender,age,phone_number,instagram_url')
        .eq('id', data.user.id)
        .single()

      if (profile?.name && profile?.gender && profile?.age) {
        router.replace('/feed')
        return
      }

      setName(profile?.name || data.user?.user_metadata?.name || '')
      setGender(profile?.gender || '')
      setAge(profile?.age ? String(profile.age) : '')
      setPhone(profile?.phone_number || '')
      setInstagram(profile?.instagram_url || '')
    })
  }, [router, supabase])

  const submit = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    if (!name || !gender || !age) return alert('Please fill name, gender and age.')

    await supabase
      .from('users')
      .update({
        name,
        gender,
        age: Number(age),
        phone_number: phone || null,
        instagram_url: instagram || null,
        instagram_handle: instagram ? instagram.split('/').filter(Boolean).pop() || null : null,
        phone_verified: !!phone,
      })
      .eq('id', data.user.id)

    router.replace('/feed')
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md space-y-3 rounded-2xl border app-card p-4">
        <h1 className="text-xl font-bold">Quick onboarding</h1>
        <p className="text-xs app-muted">One-time setup. We won&apos;t ask this again after you submit.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border app-card px-3 py-2" />
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border app-card px-3 py-2"><option value="">Gender</option><option>Female</option><option>Male</option><option>Other</option></select>
        <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" type="number" className="w-full rounded-xl border app-card px-3 py-2" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contact number (optional)" className="w-full rounded-xl border app-card px-3 py-2" />
        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram profile URL (optional)" className="w-full rounded-xl border app-card px-3 py-2" />
        <button onClick={submit} className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white">Continue to feed</button>
      </div>
    </div>
  )
}

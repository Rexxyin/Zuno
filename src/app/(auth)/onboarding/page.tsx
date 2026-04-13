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
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login')
      setName(data.user?.user_metadata?.name || '')
    })
  }, [router, supabase])

  const submit = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    if (!name || !gender || !age || !phone || !instagram) return alert('Please complete all required fields.')
    await supabase
      .from('users')
      .update({ name, gender, age: Number(age), phone_number: phone, instagram_url: instagram, instagram_handle: instagram.split('/').filter(Boolean).pop() || null, phone_verified: true })
      .eq('id', data.user.id)
    router.replace('/feed')
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl border app-card p-4 space-y-3">
        <h1 className="text-xl font-bold">Quick onboarding</h1>
        <p className="text-xs app-muted">30 seconds setup to unlock joining.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border app-card px-3 py-2" />
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border app-card px-3 py-2"><option value="">Gender</option><option>Female</option><option>Male</option><option>Other</option></select>
        <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" type="number" className="w-full rounded-xl border app-card px-3 py-2" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-xl border app-card px-3 py-2" />
        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram profile URL" className="w-full rounded-xl border app-card px-3 py-2" />
        <button onClick={submit} className="w-full rounded-xl bg-black text-white py-2.5 text-sm font-semibold">Continue to feed</button>
      </div>
    </div>
  )
}

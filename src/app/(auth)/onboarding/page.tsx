'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toast'

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

    if (!name || !gender || !age) {
      toast.error('Missing required fields', {
        description: 'Please fill name, gender and age.',
      })
      return
    }

    const { error } = await supabase
      .from('users')
      .update({
        name,
        gender,
        age: Number(age),
        phone_number: phone || null,
        instagram_url: instagram || null,
        instagram_handle: instagram
          ? instagram.split('/').filter(Boolean).pop() || null
          : null,
        phone_verified: !!phone,
      })
      .eq('id', data.user.id)

    if (error) {
      toast.error('Unable to complete onboarding', {
        description: error.message,
      })
      return
    }

    toast.success('Profile saved', { description: 'Welcome to Zuno!' })
    router.replace('/feed')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ fontFamily: 'DM Sans, Inter, sans-serif' }}
    >
      <div className="w-full max-w-[360px] rounded-[26px] bg-[#F4EFEA] shadow-[0_18px_40px_rgba(0,0,0,0.15)] overflow-hidden">
        
        {/* HEADER */}
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-[20px] font-semibold text-[#3A2E2A] leading-tight tracking-[-0.01em]">
            Let’s get started
          </h1>
          <p className="mt-1.5 text-[13px] text-[#7A6A64] leading-[1.5]">
            Find people, make plans, enjoy the moment.
          </p>
        </div>

        {/* FORM */}
        <div className="px-5 pb-6 space-y-3">
          
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#9C8F88]"
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none text-[#3A2E2A]"
          >
            <option value="">Gender</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>

          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age"
            type="number"
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#9C8F88]"
          />

          {/* Optional divider */}
          <div className="pt-2" />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contact number (optional)"
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#9C8F88]"
          />

          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="Instagram profile (optional)"
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#9C8F88]"
          />

          <div className="pt-3" />

          {/* BUTTON */}
          <button
            onClick={submit}
            className="w-full rounded-full bg-[#5A3825] py-3 text-[13.5px] font-medium text-white shadow-[0_2px_0_rgba(0,0,0,0.1)] active:scale-[0.98]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
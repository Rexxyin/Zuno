'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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

  const [isAdult, setIsAdult] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [safetyAck, setSafetyAck] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.replace('/login')

      const { data: profile } = await supabase
        .from('users')
        .select('name,gender,age,phone_number,instagram_url')
        .eq('id', data.user.id)
        .single()

      const { data: consent } = await supabase
        .from('user_safety_consents')
        .select('is_adult,agreed_terms,acknowledged_safety_responsibility')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (profile?.name && profile?.age && consent?.is_adult && consent?.agreed_terms && consent?.acknowledged_safety_responsibility) {
        router.replace('/feed')
        return
      }

      setName(profile?.name || data.user?.user_metadata?.name || '')
      setGender(profile?.gender || '')
      setAge(profile?.age ? String(profile.age) : '')
      setPhone(profile?.phone_number || '')
      setInstagram(profile?.instagram_url || '')
      setIsAdult(!!consent?.is_adult)
      setAgreedTerms(!!consent?.agreed_terms)
      setSafetyAck(!!consent?.acknowledged_safety_responsibility)
    })
  }, [router, supabase])

  const submit = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return

    if (!name || !age) {
      toast.error('Missing required fields', {
        description: 'Please fill name and age.',
      })
      return
    }

    if (!isAdult || !agreedTerms || !safetyAck) {
      toast.error('Consent required', {
        description: 'Please complete all consent checkboxes before continuing.',
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
      })
      .eq('id', data.user.id)

    if (error) {
      toast.error('Unable to complete onboarding', {
        description: error.message,
      })
      return
    }

    const { error: consentError } = await supabase
      .from('user_safety_consents')
      .upsert({
        user_id: data.user.id,
        is_adult: isAdult,
        agreed_terms: agreedTerms,
        acknowledged_safety_responsibility: safetyAck,
        consented_at: new Date().toISOString(),
      })

    if (consentError) {
      toast.error('Unable to save consent', {
        description: consentError.message,
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
      <div className="w-full max-w-[380px] rounded-[26px] bg-[#F4EFEA] shadow-[0_18px_40px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-[20px] font-semibold text-[#3A2E2A] leading-tight tracking-[-0.01em]">
            Before you continue
          </h1>
          <p className="mt-1.5 text-[13px] text-[#7A6A64] leading-[1.5]">
            Zuno helps you discover and join plans. You decide what&apos;s right for you.
          </p>
        </div>

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
            <option value="">Gender (optional)</option>
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

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (optional)"
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#9C8F88]"
          />

          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="Instagram profile (optional)"
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#9C8F88]"
          />

          <div className="rounded-xl bg-[#efe5d8] p-3 text-[12px] text-[#5f5249] space-y-2">
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={isAdult} onChange={(e) => setIsAdult(e.target.checked)} className="mt-0.5" />
              <span>I am 18+</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="mt-0.5" />
              <span>
                I agree to <Link href="/terms" className="underline">Terms</Link>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={safetyAck} onChange={(e) => setSafetyAck(e.target.checked)} className="mt-0.5" />
              <span>I understand I am responsible for my safety</span>
            </label>
          </div>

          <button
            onClick={submit}
            className="w-full rounded-full bg-[#5A3825] py-3 text-[13.5px] font-medium text-white shadow-[0_2px_0_rgba(0,0,0,0.1)] active:scale-[0.98]"
          >
            Agree & Continue
          </button>
        </div>
      </div>
    </div>
  )
}

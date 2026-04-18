'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toast'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { CATEGORY_META } from '@/lib/categories'
import { CategoryIcon } from '@/components/CategoryIcon'
import type { PlanCategory } from '@/lib/types'
import { DEFAULT_LAUNCH_CITY, INDIA_HIGH_POTENTIAL_CITIES } from '@/lib/cities'
import { useCity } from '@/components/CityContext'

const steps = ['Details', 'Meetup', 'Settings', 'Review']

export default function CreatePlanPage() {
  const router = useRouter()
  const { selectedCity, setSelectedCity } = useCity()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'other' as PlanCategory, city: DEFAULT_LAUNCH_CITY,
    location_name: '', google_maps_link: '', datetime: '', max_people: '0', whatsapp_link: '',
    requireApproval: false, female_only: false, visibility: 'public', image_url: '',
    cost_mode: 'per_person' as 'per_person' | 'total', cost_amount: '',
  })

  useEffect(() => { setFormData((prev) => ({ ...prev, city: selectedCity || DEFAULT_LAUNCH_CITY })) }, [selectedCity])
  const handleChange = (e: any) => { const { name, value, type, checked } = e.target; setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); if (name === 'city') setSelectedCity(value) }
  const canProceedToNextStep = () => (currentStep === 0 ? !!(formData.title.trim() && formData.description.trim()) : currentStep === 1 ? !!(formData.location_name.trim() && formData.datetime) : true)

  const previewRows = useMemo(() => {
    const rows: string[] = []
    rows.push(formData.title)
    rows.push(`${new Date(formData.datetime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}`)
    rows.push(`📍 ${formData.location_name}${formData.city ? `, ${formData.city}` : ''}`)
    rows.push(`👥 Up to ${formData.max_people} people · ${formData.visibility === 'public' ? 'Public' : 'Invite-only'}`)
    if (formData.cost_amount) rows.push(`💰 ₹${formData.cost_amount} ${formData.cost_mode === 'per_person' ? 'per person' : 'total'} (est.)`)
    if (formData.visibility === 'public') rows.push(`🔒 ${formData.requireApproval ? 'Host manages requests' : 'Open to everyone'}`)
    return rows
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (currentStep < steps.length - 1) return setCurrentStep((prev) => prev + 1)
    try {
      setLoading(true)
      const response = await fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      if (response.ok) { const data = await response.json(); router.push(`/plans/${data.id}`) }
      else { const error = await response.json(); toast.error('Failed to create plan', { description: error.error || 'Please try again.' }) }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="sticky top-0 z-10 border-b app-card"><div className="mx-auto max-w-md px-4 py-4"><div className="mb-3 flex items-center justify-between"><button onClick={() => (currentStep ? setCurrentStep((prev) => prev - 1) : router.back())} className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button><p className="text-sm font-semibold">Create Plan</p><div className="text-xs app-muted">{currentStep + 1}/{steps.length}</div></div><div className="h-1.5 rounded-full bg-black/10"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} /></div></div></div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 px-4 py-5">
        {currentStep === 0 && <div className="space-y-3 rounded-2xl border app-card p-4"><input name="title" value={formData.title} onChange={handleChange} placeholder="Plan title" className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" required /><textarea name="description" value={formData.description} onChange={handleChange} placeholder="Plan details" className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" rows={3} required /><select name="city" value={formData.city} onChange={handleChange} className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" required>{INDIA_HIGH_POTENTIAL_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select><div className="grid grid-cols-2 gap-2">{(Object.keys(CATEGORY_META) as PlanCategory[]).map((cat) => <button key={cat} type="button" onClick={() => setFormData((prev) => ({ ...prev, category: cat }))} className={`rounded-xl border px-3 py-2 text-left text-xs ${formData.category === cat ? 'bg-orange-500 text-white border-orange-500' : 'app-card'}`}><span className="inline-flex items-center gap-1"><CategoryIcon icon={CATEGORY_META[cat].icon} className="h-3 w-3" /> {CATEGORY_META[cat].label}</span></button>)}</div></div>}

        {currentStep === 1 && <div className="space-y-3 rounded-2xl border app-card p-4"><input name="location_name" value={formData.location_name} onChange={handleChange} placeholder="Meetup point name" className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" required /><input name="google_maps_link" value={formData.google_maps_link} onChange={handleChange} placeholder="Google Maps link" className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" /><div className="rounded-xl border app-card px-3 py-2.5"><input type="datetime-local" name="datetime" value={formData.datetime} onChange={handleChange} className="w-full bg-transparent text-sm outline-none" required /></div></div>}

        {currentStep === 2 && <div className="space-y-3 rounded-2xl border app-card p-4 text-sm"><input type="number" min="0" name="max_people" value={formData.max_people} onChange={handleChange} className="w-full rounded-xl border app-card px-3 py-2.5" /><p className="text-xs app-muted">0 = invite-only via link. Set a number to allow people to join from the feed.</p>
          <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setFormData((prev) => ({ ...prev, visibility: 'public', requireApproval: false }))} className={`rounded-xl border px-3 py-2 text-xs ${formData.visibility === 'public' ? 'bg-black text-white border-black' : 'app-card'}`}>Public</button><button type="button" onClick={() => setFormData((prev) => ({ ...prev, visibility: 'invite_only', requireApproval: false }))} className={`rounded-xl border px-3 py-2 text-xs ${formData.visibility === 'invite_only' ? 'bg-black text-white border-black' : 'app-card'}`}>Private (invite-only)</button></div>
          {formData.visibility === 'public' ? <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setFormData((prev) => ({ ...prev, requireApproval: true }))} className={`rounded-xl border px-3 py-2 text-xs ${formData.requireApproval ? 'bg-black text-white border-black' : 'app-card'}`}>Host manages requests</button><button type="button" onClick={() => setFormData((prev) => ({ ...prev, requireApproval: false }))} className={`rounded-xl border px-3 py-2 text-xs ${!formData.requireApproval ? 'bg-black text-white border-black' : 'app-card'}`}>Open to everyone</button></div> : <p className="rounded-lg bg-[#f6efe4] px-3 py-2 text-xs text-[#6f6254]">You'll get a shareable link after publishing. Only people with the link can see and join this plan.</p>}
          <input type="url" name="whatsapp_link" value={formData.whatsapp_link} onChange={handleChange} placeholder="WhatsApp group link (optional)" className="w-full rounded-xl border app-card px-3 py-2.5" />
          <div><p className="mb-2 text-xs font-medium">Cost estimate (optional)</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setFormData((prev) => ({ ...prev, cost_mode: 'per_person' }))} className={`rounded-xl border px-3 py-2 text-xs ${formData.cost_mode === 'per_person' ? 'bg-black text-white border-black' : 'app-card'}`}>Per person</button><button type="button" onClick={() => setFormData((prev) => ({ ...prev, cost_mode: 'total' }))} className={`rounded-xl border px-3 py-2 text-xs ${formData.cost_mode === 'total' ? 'bg-black text-white border-black' : 'app-card'}`}>Total</button></div><input type="number" name="cost_amount" value={formData.cost_amount} onChange={handleChange} placeholder="₹ Amount" className="mt-2 w-full rounded-xl border app-card px-3 py-2.5" /></div>
          <label className="flex items-center justify-between gap-2"><span>Women only</span><input type="checkbox" role="switch" name="female_only" checked={formData.female_only} onChange={handleChange} /></label>
          <input name="image_url" value={formData.image_url} onChange={handleChange} placeholder="Banner image URL (optional)" className="w-full rounded-xl border app-card px-3 py-2.5" />
        </div>}

        {currentStep === 3 && <div className="rounded-2xl border app-card p-4 text-sm space-y-2">{previewRows.map((row, i) => <p key={i} className={i === 0 ? 'font-semibold text-base' : 'app-muted'}>{row}</p>)}</div>}

        <button disabled={!canProceedToNextStep() || loading} className="w-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Publishing...' : currentStep === steps.length - 1 ? 'Publish Plan' : <span className="inline-flex items-center gap-1">Next <ChevronRight className="h-4 w-4" /></span>}</button>
      </form>

      <BottomNav />
    </div>
  )
}

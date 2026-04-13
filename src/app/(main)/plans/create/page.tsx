'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { CATEGORY_META } from '@/lib/categories'
import { CategoryIcon } from '@/components/CategoryIcon'
import type { PlanCategory } from '@/lib/types'

const steps = ['Details', 'Meetup', 'Settings', 'Review']

export default function CreatePlanPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as PlanCategory,
    city: '',
    location_name: '',
    google_maps_link: '',
    datetime: '',
    max_people: '8',
    whatsapp_link: '',
    approval_mode: false,
    female_only: false,
    image_url: '',
    show_payment_options: false,
    estimated_cost: '',
  })

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const canProceedToNextStep = () => {
    if (currentStep === 0) return formData.title.trim() && formData.description.trim() && formData.city.trim()
    if (currentStep === 1) return formData.location_name.trim() && formData.datetime
    if (currentStep === 2) return Number(formData.max_people) >= 2
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep < steps.length - 1) return setCurrentStep((prev) => prev + 1)

    try {
      setLoading(true)
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/plans/${data.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create plan')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="sticky top-0 z-10 border-b app-card">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => (currentStep ? setCurrentStep((prev) => prev - 1) : router.back())} className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold">Create Plan</p>
            <div className="text-xs app-muted">{currentStep + 1}/{steps.length}</div>
          </div>
          <div className="h-1.5 rounded-full bg-black/10">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 px-4 py-5">
        {currentStep === 0 && (
          <div className="space-y-3 rounded-2xl border app-card p-4">
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Plan title" className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" required />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Plan details" className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" rows={3} required />
            <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" required />
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_META) as PlanCategory[]).map((cat) => (
                <button key={cat} type="button" onClick={() => setFormData((prev) => ({ ...prev, category: cat }))} className={`rounded-xl border px-3 py-2 text-left text-xs ${formData.category === cat ? 'bg-orange-500 text-white border-orange-500' : 'app-card'}`}>
                  <span className="inline-flex items-center gap-1"><CategoryIcon icon={CATEGORY_META[cat].icon} className="h-3 w-3" /> {CATEGORY_META[cat].label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-3 rounded-2xl border app-card p-4">
            <input name="location_name" value={formData.location_name} onChange={handleChange} placeholder="Meetup point name" className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" required />
            <input name="google_maps_link" value={formData.google_maps_link} onChange={handleChange} placeholder="Google Maps link" className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" />
            <input type="datetime-local" name="datetime" value={formData.datetime} onChange={handleChange} className="w-full rounded-xl border app-card px-3 py-2.5 text-sm" required />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-3 rounded-2xl border app-card p-4 text-sm">
            <input type="number" min="2" name="max_people" value={formData.max_people} onChange={handleChange} className="w-full rounded-xl border app-card px-3 py-2.5" />
            <input type="url" name="whatsapp_link" value={formData.whatsapp_link} onChange={handleChange} placeholder="WhatsApp group link (single place)" className="w-full rounded-xl border app-card px-3 py-2.5" />
            <input type="number" name="estimated_cost" value={formData.estimated_cost} onChange={handleChange} placeholder="Estimated budget per person (optional)" className="w-full rounded-xl border app-card px-3 py-2.5" />
            <label className="flex items-center gap-2"><input type="checkbox" name="show_payment_options" checked={formData.show_payment_options} onChange={handleChange} /> Show organizer payment options</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="approval_mode" checked={formData.approval_mode} onChange={handleChange} /> Require approval</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="female_only" checked={formData.female_only} onChange={handleChange} /> Women only</label>
          </div>
        )}

        {currentStep === 3 && (
          <div className="rounded-2xl border app-card p-4 text-sm">
            <p className="font-semibold">{formData.title}</p>
            <p className="app-muted">{formData.city} · {formData.location_name}</p>
          </div>
        )}

        <button disabled={!canProceedToNextStep() || loading} className="w-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? 'Publishing...' : currentStep === steps.length - 1 ? 'Publish Plan' : <span className="inline-flex items-center gap-1">Next <ChevronRight className="h-4 w-4" /></span>}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}

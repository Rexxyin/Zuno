'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { CATEGORY_META } from '@/lib/categories'
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
    location_name: '',
    google_maps_link: '',
    datetime: '',
    max_people: '8',
    whatsapp_link: '',
    approval_mode: false,
    female_only: false,
    image_url: '',
  })

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const canProceedToNextStep = () => {
    if (currentStep === 0) return formData.title.trim() && formData.description.trim()
    if (currentStep === 1) return formData.location_name.trim() && formData.datetime
    if (currentStep === 2) return Number(formData.max_people) >= 2
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep < steps.length - 1) return setCurrentStep(prev => prev + 1)

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
    } catch (error) {
      console.error('Error creating plan:', error)
      alert('Error creating plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-28 min-h-screen">
      <div className="sticky top-0 z-10 border-b app-card">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => (currentStep ? setCurrentStep(prev => prev - 1) : router.back())} className="h-10 w-10 rounded-full border app-card inline-flex items-center justify-center">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="font-bold">Create Plan</p>
            <div className="text-xs app-muted">{currentStep + 1}/{steps.length}</div>
          </div>
          <div className="h-2 rounded-full bg-black/10">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5 px-4 py-6">
        {currentStep === 0 && (
          <div className="space-y-4 rounded-3xl border app-card p-4">
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Sunrise Hike + Chai" className="w-full rounded-2xl border app-card px-4 py-3" required />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mood, pace, what to carry..." className="w-full rounded-2xl border app-card px-4 py-3" rows={4} required />
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_META) as PlanCategory[]).map(cat => (
                <button key={cat} type="button" onClick={() => setFormData(prev => ({ ...prev, category: cat }))} className={`rounded-2xl border px-3 py-3 text-left text-sm ${formData.category === cat ? 'bg-orange-500 text-white border-orange-500' : 'app-card'}`}>
                  <p>{CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4 rounded-3xl border app-card p-4">
            <input name="location_name" value={formData.location_name} onChange={handleChange} placeholder="Meetup point name" className="w-full rounded-2xl border app-card px-4 py-3" required />
            <input name="google_maps_link" value={formData.google_maps_link} onChange={handleChange} placeholder="Google Maps link (recommended)" className="w-full rounded-2xl border app-card px-4 py-3" />
            <p className="text-xs app-muted">Add map link so feed can open navigation directly.</p>
            <input type="datetime-local" name="datetime" value={formData.datetime} onChange={handleChange} className="w-full rounded-2xl border app-card px-4 py-3" required />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 rounded-3xl border app-card p-4">
            <input type="number" min="2" name="max_people" value={formData.max_people} onChange={handleChange} className="w-full rounded-2xl border app-card px-4 py-3" />
            <input type="url" name="whatsapp_link" value={formData.whatsapp_link} onChange={handleChange} placeholder="WhatsApp group link" className="w-full rounded-2xl border app-card px-4 py-3" />
            <label className="flex items-center gap-2"><input type="checkbox" name="approval_mode" checked={formData.approval_mode} onChange={handleChange} /> Require approval</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="female_only" checked={formData.female_only} onChange={handleChange} /> Women only</label>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-3 rounded-3xl border app-card p-4">
            <h3 className="text-xl font-black">{formData.title}</h3>
            <p className="app-muted">{formData.description}</p>
            <p>{CATEGORY_META[formData.category].icon} {CATEGORY_META[formData.category].label}</p>
            <p>📍 {formData.location_name}</p>
            {formData.google_maps_link && <p className="text-sm text-blue-500 break-all">{formData.google_maps_link}</p>}
            <p>🗓️ {formData.datetime ? new Date(formData.datetime).toLocaleString() : '-'}</p>
          </div>
        )}

        <button disabled={!canProceedToNextStep() || loading} className="w-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 font-bold text-white disabled:opacity-50">
          {loading ? 'Publishing...' : currentStep === steps.length - 1 ? 'Publish Plan' : <span className="inline-flex items-center gap-2">Next <ChevronRight className="h-4 w-4" /></span>}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}

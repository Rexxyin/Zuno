'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toast'
import { ChevronLeft } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import { CategoryIcon } from '@/components/CategoryIcon'
import type { PlanCategory } from '@/lib/types'

export default function EditPlanPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({ cost_mode: 'per_person', visibility: 'public' })

  useEffect(() => {
    const load = async () => {
      if (!id) return
      const res = await fetch(`/api/plans/${id}`)
      const data = await res.json()
      if (!res.ok) { toast.error('Unable to load plan'); router.replace('/my-plans'); return }
      setForm({ ...data, requireApproval: !!data.approval_mode, cost_mode: data.cost_mode || 'per_person', cost_amount: data.cost_amount || '' })
      setLoading(false)
    }
    load()
  }, [id, router])

  const update = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    const payload = { ...form, visibility: form.visibility === 'private' ? 'invite_only' : form.visibility }
    const res = await fetch(`/api/plans/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return toast.error('Failed to save plan', { description: data.error || 'Please try again.' })
    toast.success('Plan updated')
    router.push(`/plans/${id}`)
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="min-h-screen px-4 py-4 pb-16">
      <div className="mx-auto max-w-md space-y-3">
        <div className="mb-2 flex items-center justify-between"><button onClick={() => router.back()} className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-card"><ChevronLeft className="h-4 w-4" /></button><h1 className="text-sm font-semibold">Edit plan</h1><div className="h-8 w-8" /></div>

        <div className="space-y-3 rounded-2xl border app-card p-4 text-sm">
          <input value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="Plan title" className="w-full rounded-xl border app-card px-3 py-2.5" />
          <textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="Plan details" className="w-full rounded-xl border app-card px-3 py-2.5" rows={3} />
          <div className="grid grid-cols-2 gap-2">{(Object.keys(CATEGORY_META) as PlanCategory[]).map((cat) => <button key={cat} type="button" onClick={() => update('category', cat)} className={`rounded-xl border px-3 py-2 text-left text-xs ${form.category === cat ? 'bg-orange-500 text-white border-orange-500' : 'app-card'}`}><span className="inline-flex items-center gap-1"><CategoryIcon icon={CATEGORY_META[cat].icon} className="h-3 w-3" /> {CATEGORY_META[cat].label}</span></button>)}</div>
          <input value={form.location_name || ''} onChange={(e) => update('location_name', e.target.value)} placeholder="Meetup point name" className="w-full rounded-xl border app-card px-3 py-2.5" />
          <input value={form.google_maps_link || ''} onChange={(e) => update('google_maps_link', e.target.value)} placeholder="Google Maps link" className="w-full rounded-xl border app-card px-3 py-2.5" />
          <div className="rounded-xl border app-card px-3 py-2.5"><input type="datetime-local" value={form.datetime ? new Date(form.datetime).toISOString().slice(0, 16) : ''} onChange={(e) => update('datetime', new Date(e.target.value).toISOString())} className="w-full bg-transparent outline-none" /></div>
          <input type="number" min={0} value={form.max_people || 0} onChange={(e) => update('max_people', Number(e.target.value))} className="w-full rounded-xl border app-card px-3 py-2.5" placeholder='Max spots' />
          <div className="grid grid-cols-2 gap-2"><button type='button' onClick={() => update('visibility', 'public')} className={`rounded-xl border px-3 py-2 text-xs ${form.visibility === 'public' ? 'bg-black text-white border-black' : 'app-card'}`}>Public</button><button type='button' onClick={() => { update('visibility', 'invite_only'); update('requireApproval', false) }} className={`rounded-xl border px-3 py-2 text-xs ${form.visibility !== 'public' ? 'bg-black text-white border-black' : 'app-card'}`}>Private</button></div>
          {form.visibility === 'public' && <div className="grid grid-cols-2 gap-2"><button type='button' onClick={() => update('requireApproval', true)} className={`rounded-xl border px-3 py-2 text-xs ${form.requireApproval ? 'bg-black text-white border-black' : 'app-card'}`}>Host manages requests</button><button type='button' onClick={() => update('requireApproval', false)} className={`rounded-xl border px-3 py-2 text-xs ${!form.requireApproval ? 'bg-black text-white border-black' : 'app-card'}`}>Open to everyone</button></div>}
          <input value={form.whatsapp_link || ''} onChange={(e) => update('whatsapp_link', e.target.value)} placeholder="WhatsApp group link (optional)" className="w-full rounded-xl border app-card px-3 py-2.5" />
          <div className="grid grid-cols-2 gap-2"><button type='button' onClick={() => update('cost_mode', 'per_person')} className={`rounded-xl border px-3 py-2 text-xs ${form.cost_mode === 'per_person' ? 'bg-black text-white border-black' : 'app-card'}`}>Per person</button><button type='button' onClick={() => update('cost_mode', 'total')} className={`rounded-xl border px-3 py-2 text-xs ${form.cost_mode === 'total' ? 'bg-black text-white border-black' : 'app-card'}`}>Total</button></div>
          <input type='number' value={form.cost_amount || ''} onChange={(e) => update('cost_amount', e.target.value)} placeholder='Cost amount' className='w-full rounded-xl border app-card px-3 py-2.5' />
          <label className="flex items-center justify-between rounded-lg border app-card px-3 py-2"><span>Women only</span><input type="checkbox" checked={!!form.female_only} onChange={(e) => update('female_only', e.target.checked)} /></label>
          <input value={form.image_url || ''} onChange={(e) => update('image_url', e.target.value)} placeholder="Banner image URL (optional)" className="w-full rounded-xl border app-card px-3 py-2.5" />
          <button onClick={save} disabled={saving} className="w-full rounded-lg bg-black py-2 font-semibold text-white">{saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  )
}

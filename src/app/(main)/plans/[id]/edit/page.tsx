'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import type { Plan } from '@/lib/types'

export default function EditPlanPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Plan>>({})

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      const res = await fetch(`/api/plans/${id}`)
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Unable to load plan')
        router.replace('/my-plans')
        return
      }
      setForm(data)
      setLoading(false)
    }
    load()
  }, [id, router])

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/plans/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) return alert(data.error || 'Failed to save plan')
    alert('Plan updated')
    router.push('/my-plans')
  }

  const closePlan = async () => {
    const ok = confirm('Close this plan? It will stop accepting joins.')
    if (!ok) return
    const res = await fetch(`/api/plans/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) })
    if (!res.ok) return alert('Unable to close plan')
    alert('Plan closed')
    router.push('/my-plans')
  }

  const deletePlan = async () => {
    const ok = confirm('Delete this plan permanently?')
    if (!ok) return
    const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' })
    if (!res.ok) return alert('Unable to delete plan')
    alert('Plan deleted')
    router.push('/my-plans')
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="min-h-screen px-4 py-4 pb-16">
      <div className="mx-auto max-w-md space-y-3">
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => router.back()} className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-card"><ChevronLeft className="h-4 w-4" /></button>
          <h1 className="text-sm font-semibold">Edit plan</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="space-y-2 rounded-2xl border app-card p-3 text-sm">
          <input value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="Title" className="w-full rounded-lg border app-card px-3 py-2" />
          <input value={form.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="Description" className="w-full rounded-lg border app-card px-3 py-2" />
          <input value={form.location_name || ''} onChange={(e) => update('location_name', e.target.value)} placeholder="Location" className="w-full rounded-lg border app-card px-3 py-2" />
          <input value={form.image_url || ''} onChange={(e) => update('image_url', e.target.value)} placeholder="Banner image URL (optional)" className="w-full rounded-lg border app-card px-3 py-2" />
          <input type="datetime-local" value={form.datetime ? new Date(form.datetime).toISOString().slice(0, 16) : ''} onChange={(e) => update('datetime', new Date(e.target.value).toISOString())} className="w-full rounded-lg border app-card px-3 py-2" />
          <input type="number" min={2} value={form.max_people || 8} onChange={(e) => update('max_people', Number(e.target.value))} className="w-full rounded-lg border app-card px-3 py-2" />
          <label className="flex items-center justify-between rounded-lg border app-card px-3 py-2"><span>Require approval</span><input type="checkbox" checked={!!form.approval_mode} onChange={(e) => update('approval_mode', e.target.checked)} /></label>
          <button onClick={save} disabled={saving} className="w-full rounded-lg bg-black py-2 font-semibold text-white">{saving ? 'Saving...' : 'Save changes'}</button>
        </div>

        <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-3">
          <button onClick={closePlan} className="w-full rounded-lg border border-orange-300 bg-orange-100 py-2 text-sm font-semibold text-orange-900">Close plan</button>
          <button onClick={deletePlan} className="w-full rounded-lg border border-red-300 bg-red-100 py-2 text-sm font-semibold text-red-800">Delete plan</button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { toast } from '@/components/ui/toast'

type Report = {
  id: string
  reason: string
  target_type: 'profile' | 'plan'
  target_user_id?: string | null
  target_plan_id?: string | null
  status: string
  created_at: string
  details?: string | null
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadReports = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/reports', { cache: 'no-store' })
    const data = await res.json().catch(() => [])
    if (!res.ok) toast.error(data.error || 'Unable to load moderation queue')
    else setReports(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadReports()
  }, [])

  const act = async (reportId: string, action: 'ignore' | 'remove_plan' | 'ban_user' | 'unban_user') => {
    setBusyId(reportId + action)
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, action }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) toast.error(data.error || 'Action failed')
    else toast.success('Moderation action applied')
    await loadReports()
    setBusyId(null)
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#2f2721]">Moderation queue</h1>
      <p className="mt-2 text-sm text-[#6f6258]">Multiple reports should be prioritized for manual review.</p>

      {loading ? (
        <p className="mt-5 text-sm text-[#6f6258]">Loading reports...</p>
      ) : (
        <div className="mt-5 space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-[#e8ddcf] bg-white p-4 text-sm">
              <p className="font-semibold">{r.reason} · {r.target_type} · {r.status}</p>
              <p className="text-[#6f6258] text-xs mt-1">{new Date(r.created_at).toLocaleString('en-IN')}</p>
              <p className="text-[#4f453d] mt-2">{r.details || 'No additional details'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-lg border px-3 py-1.5" onClick={() => act(r.id, 'ignore')} disabled={!!busyId}>Ignore</button>
                {r.target_type === 'plan' && <button className="rounded-lg border px-3 py-1.5" onClick={() => act(r.id, 'remove_plan')} disabled={!!busyId}>Remove plan</button>}
                <button className="rounded-lg border px-3 py-1.5" onClick={() => act(r.id, 'ban_user')} disabled={!!busyId}>Ban user</button>
                <button className="rounded-lg border px-3 py-1.5" onClick={() => act(r.id, 'unban_user')} disabled={!!busyId}>Unban user</button>
              </div>
            </div>
          ))}
          {!reports.length && <p className="text-sm text-[#6f6258]">No reports yet.</p>}
        </div>
      )}
    </main>
  )
}

'use client'

import { Check, X } from 'lucide-react'
import { PlanParticipant } from '@/lib/types'

export function ApprovalQueue({ requests }: { requests: PlanParticipant[] }) {
  if (!requests.length) return <p className="text-sm text-zinc-500">No pending requests</p>
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="font-medium">{r.user?.name}</p>
            <p className="text-xs text-zinc-500">@{r.user?.instagram_handle || 'unknown'}</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-full bg-emerald-600 p-2 text-white"><Check className="h-4 w-4" /></button>
            <button className="rounded-full bg-red-500 p-2 text-white"><X className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

'use client'

import { Loader2, Lock } from 'lucide-react'

type JoinState = 'idle' | 'loading' | 'joined' | 'pending' | 'full'

export function JoinButton({ state, approvalMode }: { state: JoinState; approvalMode?: boolean }) {
  const base = 'rounded-full px-4 py-2 text-sm font-semibold inline-flex items-center gap-1'
  if (state === 'loading') return <button className={`${base} bg-black text-white`}><Loader2 className="h-4 w-4 animate-spin" /></button>
  if (state === 'joined') return <button className={`${base} bg-emerald-600 text-white`}>Joined ✓</button>
  if (state === 'pending') return <button className={`${base} bg-amber-600 text-white`}>Requested</button>
  if (state === 'full') return <button disabled className={`${base} bg-zinc-300 text-zinc-600`}>Full</button>
  return <button className={`${base} bg-black text-white`}>{approvalMode ? <><Lock className="h-3.5 w-3.5" />Request</> : 'Join'}</button>
}

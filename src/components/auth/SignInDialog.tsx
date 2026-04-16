'use client'

import { useMemo } from 'react'
import { X, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type SignInDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextPath?: string
  title?: string
  description?: string
}

export function SignInDialog({
  open,
  onOpenChange,
  nextPath = '/feed',
  title = 'Sign in to continue',
  description = 'Join plans, request approvals, and manage your own hosted plans.',
}: SignInDialogProps) {
  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
  }, [nextPath])

  if (!open) return null

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-[rgba(26,20,16,0.12)] bg-[#faf8f4] shadow-2xl">
        <div className="bg-gradient-to-r from-[#1a1410] via-[#3d2f25] to-[#6d4f3a] p-5 text-[#faf8f4]">
          <div className="mb-2 flex items-center justify-between">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Welcome to Zuno
            </div>
            <button onClick={() => onOpenChange(false)} className="rounded-md p-1 text-[#faf8f4]/85 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-lg font-bold">{title}</p>
          <p className="mt-1 text-sm text-[#f8ede0]/90">{description}</p>
        </div>

        <div className="p-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full rounded-xl border border-[rgba(26,20,16,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[#1a1410] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}

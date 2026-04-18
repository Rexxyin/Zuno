'use client'

import { useMemo } from 'react'
import { X, Sparkles } from 'lucide-react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

type SignInDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; nextPath?: string }

export function SignInDialog({ open, onOpenChange, nextPath = '/feed' }: SignInDialogProps) {
  const redirectTo = useMemo(() => (typeof window === 'undefined' ? '' : `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`), [nextPath])
  if (!open) return null

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => onOpenChange(false)}>
      <div className="w-[90vw] max-w-[400px] overflow-hidden rounded-2xl border border-[rgba(26,20,16,0.15)] bg-[#faf8f4] shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#1a1410] via-[#3d2f25] to-[#6d4f3a] px-4 py-4 text-[#faf8f4]">
          <div className="mb-2 flex items-center justify-between"><div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold"><Sparkles className="h-3 w-3" /> Zuno</div><button onClick={() => onOpenChange(false)} className="rounded-md p-1 text-[#faf8f4]/85 hover:bg-white/10"><X className="h-4 w-4" /></button></div>
          <p className="text-[18px] font-bold leading-tight">Sign in to continue</p>
          <p className="mt-1 text-[14px] text-[#f8ede0]/85">Join plans, split costs, make memories.</p>
        </div>
        <div className="bg-white p-3.5">
          <button type="button" onClick={handleGoogleSignIn} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(26,20,16,0.1)] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1a1410] shadow-sm transition hover:shadow-md active:scale-[0.98]">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0"><path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3 14.6 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.3 12 20.3c6.9 0 9.2-4.8 9.2-7.2 0-.5-.1-.9-.1-1.3H12Z" /><path fill="#34A853" d="M3 7.4l3.2 2.3c.9-2.2 3.1-3.8 5.8-3.8 1.8 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3 14.6 2 12 2 8.2 2 4.9 4.2 3 7.4Z" /><path fill="#4A90E2" d="M12 20.3c2.5 0 4.6-.8 6.1-2.3l-2.8-2.2c-.8.6-1.9 1-3.3 1-2.5 0-4.7-1.7-5.5-4L3.2 15C5.1 18.1 8.3 20.3 12 20.3Z" /><path fill="#FBBC05" d="M3 7.4A9.2 9.2 0 0 0 2.3 11c0 1.3.3 2.6.9 3.8l3.3-2.2a5.7 5.7 0 0 1-.3-1.8c0-.6.1-1.3.3-1.8L3 7.4Z" /></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

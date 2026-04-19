'use client'

import { useMemo } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

type SignInDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextPath?: string
}

export function SignInDialog({
  open,
  onOpenChange,
  nextPath = '/feed',
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

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center bg-black/50 p-4"
      style={{ zIndex: 2147483647 }}
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[92vw] max-w-[340px] rounded-[26px] bg-[#F4EFEA] shadow-[0_16px_40px_rgba(0,0,0,0.25)] overflow-hidden"
        style={{ fontFamily: 'DM Sans, Inter, sans-serif' }}
      >
        {/* CLOSE (fixed visibility) */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-20 rounded-full bg-[#f6aa30]  backdrop-blur p-2 shadow-sm hover:scale-[1.1]"
        >
          <X className="h-4 w-4 text-[#5A3825]" />
        </button>

        {/* IMAGE */}
        <div className="bg-[#EFE7DA] px-4 pt-6 h-[200px]">
            <img
              src="/login-hero.png"
              alt="travel"
              className="w-full h-full object-cover object-center scale-[1.25]"
            />
        </div>

        {/* CONTENT */}
        <div className="px-5 pt-4 pb-6 text-center">
          <h2 className="text-[22px] font-semibold text-[#3A2E2A] leading-[1.25] tracking-[-0.01em]">
           Sign in to find your next plan
          </h2>

          <p className="mt-2 text-[13px] text-[#7A6A64] leading-[1.55]">
            Meet people, split costs, and go together.
          </p>

          <div className="mt-5" />

          {/* BUTTON */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#5A3825] text-white py-3 text-[13.5px] font-medium shadow-[0_2px_0_rgba(0,0,0,0.1)] active:scale-[0.98]"
          >
         <svg height="1.5em"  viewBox="0 0 24 24" width="1.5em" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M23 12.245c0-.905-.075-1.565-.236-2.25h-10.54v4.083h6.186c-.124 1.014-.797 2.542-2.294 3.569l-.021.136 3.332 2.53.23.022C21.779 18.417 23 15.593 23 12.245z" fill="#4285F4"></path><path d="M12.225 23c3.03 0 5.574-.978 7.433-2.665l-3.542-2.688c-.948.648-2.22 1.1-3.891 1.1a6.745 6.745 0 01-6.386-4.572l-.132.011-3.465 2.628-.045.124C4.043 20.531 7.835 23 12.225 23z" fill="#34A853"></path><path d="M5.84 14.175A6.65 6.65 0 015.463 12c0-.758.138-1.491.361-2.175l-.006-.147-3.508-2.67-.115.054A10.831 10.831 0 001 12c0 1.772.436 3.447 1.197 4.938l3.642-2.763z" fill="#FBBC05"></path><path d="M12.225 5.253c2.108 0 3.529.892 4.34 1.638l3.167-3.031C17.787 2.088 15.255 1 12.225 1 7.834 1 4.043 3.469 2.197 7.062l3.63 2.763a6.77 6.77 0 016.398-4.572z" fill="#EB4335"></path></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

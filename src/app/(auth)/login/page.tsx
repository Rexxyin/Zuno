'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const signInGoogle = async () => {
    const origin = window.location.origin
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback` } })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold">Welcome to Zuno</h1>
      <button onClick={signInGoogle} className="rounded-full bg-black px-4 py-3 font-semibold text-white">Continue with Google</button>
      <p className="text-xs text-zinc-500">Phone OTP verification is required before hosting plans.</p>
    </div>
  )
}

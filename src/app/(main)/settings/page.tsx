'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="h-8 w-8 rounded-full border app-card inline-flex items-center justify-center">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold">Settings</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="rounded-2xl border app-card p-2">
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/feed'

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const payload = {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Zuno User',
      avatar_url: user.user_metadata?.avatar_url || null,
      instagram_handle: null,
      instagram_url: null,
      gpay_link: null,
    }

    const { error } = await supabase.from('users').upsert(payload)
    if (error?.message?.includes('instagram_url') || error?.message?.includes('gpay_link')) {
      const { instagram_url, gpay_link, ...fallback } = payload
      await supabase.from('users').upsert(fallback)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}

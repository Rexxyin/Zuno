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
    await supabase.from('users').upsert({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Zuno User',
      avatar_url: user.user_metadata?.avatar_url || null,
      instagram_handle: null,
    })
  }

  return NextResponse.redirect(`${origin}${next}`)
}

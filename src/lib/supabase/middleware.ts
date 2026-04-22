import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const publicPaths = ['/', '/auth/callback', '/feed', '/plans', '/terms', '/safety', '/report', '/banned', '/privacy']

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
const isPublic =
  publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/api') ||
  pathname.startsWith('/public') ||   // (not strictly needed but ok)
  pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/) !== null

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    url.searchParams.set('signin', '1')
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    if (!user) {
      url.searchParams.set('signin', '1')
      const next = request.nextUrl.searchParams.get('next')
      if (next) url.searchParams.set('next', next)
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

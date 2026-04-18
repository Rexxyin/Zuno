import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canonicalizeCity } from '@/lib/cities'
import { computeEffectivePlanStatus, normalizeVisibility } from '@/lib/plan'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('plans')
    .select('*, host:users!plans_host_id_fkey(*), participants:plan_participants(user_id,status,user:users(id,name,avatar_url))')
    .eq('visibility', 'public')
    .not('city', 'is', null)
    .order('datetime', { ascending: true })
    .limit(80)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const normalized = (data || [])
    .map((p: any) => {
      const effectiveStatus = computeEffectivePlanStatus(p)
      return {
        ...p,
        visibility: normalizeVisibility(p.visibility),
        require_approval: !!p.approval_mode,
        status: effectiveStatus,
        is_joined: !!auth.user && (p.participants || []).some((pp: any) => pp.user_id === auth.user.id && pp.status === 'joined'),
        current_user_id: auth.user?.id || null,
      }
    })
    .filter((p: any) => p.status !== 'expired')

  if (!auth.user) {
    return NextResponse.json(normalized.map((p: any) => ({ ...p, is_favorite: false })))
  }

  const { data: favorites } = await supabase.from('plan_favorites').select('plan_id').eq('user_id', auth.user.id)
  const favSet = new Set((favorites || []).map((f: any) => f.plan_id))

  return NextResponse.json(normalized.map((p: any) => ({ ...p, is_favorite: favSet.has(p.id) })))
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const city = canonicalizeCity(body.city)
  if (!city) return NextResponse.json({ error: 'City is required' }, { status: 400 })

  const visibility = body.visibility === 'invite_only' || body.visibility === 'private' ? 'invite_only' : 'public'
  const requireApproval = visibility === 'public' ? !!body.requireApproval : false
  const payload = {
    host_id: auth.user.id,
    title: body.title,
    description: body.description ?? null,
    category: body.category ?? 'other',
    location_name: body.location_name,
    city,
    datetime: body.datetime,
    max_people: Math.max(Number(body.max_people ?? 0), 0),
    whatsapp_link: body.whatsapp_link || '',
    approval_mode: requireApproval,
    female_only: !!body.female_only,
    image_url: body.image_url || null,
    google_maps_link: body.google_maps_link || null,
    visibility,
    host_mode: requireApproval ? 'host_managed' : 'open',
    cost_mode: body.cost_mode || null,
    cost_amount: body.cost_amount ? Number(body.cost_amount) : null,
    final_amount: null,
    status: 'active',
  }

  let { data, error } = await supabase.from('plans').insert(payload).select().single()

  if (error && /(cost_mode|cost_amount|final_amount|visibility|host_mode)/.test(error.message)) {
    const { cost_mode, cost_amount, final_amount, ...fallbackPayload } = payload
    const retry = await supabase.from('plans').insert(fallbackPayload).select().single()
    data = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canonicalizeCity } from '@/lib/cities'
import { dbSetupRequiredResponse, isMissingRelationError } from '@/lib/supabase/errors'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('plans')
    .select('*, host:users!plans_host_id_fkey(*), participants:plan_participants(user_id,status,user:users(name))')
    .gt('datetime', new Date().toISOString())
    .order('datetime', { ascending: true })
    .limit(50)

  if (error) {
    if (isMissingRelationError(error, 'plans')) return NextResponse.json([])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const plans = (data || []).filter((plan: any) => {
    if (plan.visibility !== 'private') return true
    if (!auth.user) return false
    if (plan.host_id === auth.user.id) return true
    return (plan.participants || []).some((pp: any) => pp.user_id === auth.user.id)
  })

  if (!auth.user) {
    return NextResponse.json(
      plans.map((p: any) => ({
        ...p,
        is_joined: false,
        joined_names: (p.participants || [])
          .filter((pp: any) => pp.status === 'joined')
          .map((pp: any) => pp.user?.name)
          .filter(Boolean),
      }))
    )
  }

  const { data: favorites } = await supabase.from('plan_favorites').select('plan_id').eq('user_id', auth.user.id)

  const favSet = new Set((favorites || []).map((f: any) => f.plan_id))

  return NextResponse.json(
    plans.map((p: any) => ({
      ...p,
      is_favorite: favSet.has(p.id),
      is_joined: (p.participants || []).some((pp: any) => pp.user_id === auth.user?.id && pp.status === 'joined'),
      joined_names: (p.participants || [])
        .filter((pp: any) => pp.status === 'joined')
        .map((pp: any) => pp.user?.name)
        .filter(Boolean),
    }))
  )
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const city = canonicalizeCity(body.city)
  if (!city) return NextResponse.json({ error: 'City is required' }, { status: 400 })

  const payload = {
    host_id: auth.user.id,
    title: body.title,
    description: body.description ?? null,
    category: body.category ?? 'other',
    location_name: body.location_name,
    city,
    datetime: body.datetime,
    max_people: Number(body.max_people || 8),
    whatsapp_link: body.whatsapp_link || '',
    approval_mode: body.host_mode === 'open' ? false : !!body.approval_mode,
    female_only: !!body.female_only,
    image_url: body.image_url || null,
    google_maps_link: body.google_maps_link || null,
    show_payment_options: !!body.show_payment_options,
    estimated_cost: body.estimated_cost ? Number(body.estimated_cost) : null,
    visibility: body.visibility === 'private' ? 'private' : 'public',
    host_mode: body.host_mode === 'open' ? 'open' : 'host_managed',
    total_amount: body.total_amount ? Number(body.total_amount) : null,
    per_person_amount: body.per_person_amount ? Number(body.per_person_amount) : null,
  }

  let { data, error } = await supabase.from('plans').insert(payload).select().single()

  if (error && /(google_maps_link|show_payment_options|estimated_cost|visibility|host_mode|total_amount|per_person_amount)/.test(error.message)) {
    const { google_maps_link, show_payment_options, estimated_cost, visibility, host_mode, total_amount, per_person_amount, ...fallbackPayload } = payload
    const retry = await supabase.from('plans').insert(fallbackPayload).select().single()
    data = retry.data
    error = retry.error
  }

  if (error) {
    if (isMissingRelationError(error, 'plans')) return dbSetupRequiredResponse()
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}

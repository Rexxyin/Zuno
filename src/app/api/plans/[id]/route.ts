import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*, host:users!plans_host_id_fkey(*)')
    .eq('id', id)
    .single()

  if (planError || !plan) return NextResponse.json({ error: planError?.message || 'Plan not found' }, { status: 404 })

  const { data: participants } = await supabase
    .from('plan_participants')
    .select('*, user:users!plan_participants_user_id_fkey(*)')
    .eq('plan_id', id)
    .eq('status', 'joined')

  const isParticipant = (participants || []).some((p: any) => p.user_id === auth.user?.id)
  if (plan.visibility === 'private' && !(auth.user && (plan.host_id === auth.user.id || isParticipant))) {
    return NextResponse.json({ error: 'This private plan is only visible to approved members via invite link.' }, { status: 403 })
  }

  return NextResponse.json({ ...plan, participants: participants || [], current_user_id: auth.user?.id || null })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase.from('plans').select('host_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (existing.host_id !== auth.user.id) return NextResponse.json({ error: 'Only host can edit this plan' }, { status: 403 })

  const body = await request.json()
  const allowed: Record<string, any> = {
    title: body.title,
    description: body.description,
    location_name: body.location_name,
    city: body.city,
    datetime: body.datetime,
    max_people: body.max_people ? Number(body.max_people) : undefined,
    category: body.category,
    visibility: body.visibility,
    host_mode: body.host_mode,
    approval_mode: body.approval_mode,
    whatsapp_link: body.whatsapp_link,
    image_url: body.image_url,
    google_maps_link: body.google_maps_link,
    show_payment_options: body.show_payment_options,
    estimated_cost: body.estimated_cost ? Number(body.estimated_cost) : body.estimated_cost,
    total_amount: body.total_amount ? Number(body.total_amount) : body.total_amount,
    per_person_amount: body.per_person_amount ? Number(body.per_person_amount) : body.per_person_amount,
    status: body.status,
  }

  Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k])

  const { data, error } = await supabase.from('plans').update(allowed).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase.from('plans').select('host_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (existing.host_id !== auth.user.id) return NextResponse.json({ error: 'Only host can delete this plan' }, { status: 403 })

  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

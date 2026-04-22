import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeEffectivePlanStatus, normalizeVisibility } from '@/lib/plan'
import { hasBlockBetween } from '@/lib/server/safety'

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

  const { data: myMembership } = auth.user
    ? await supabase
        .from('plan_participants')
        .select('removed_by_host,status')
        .eq('plan_id', id)
        .eq('user_id', auth.user.id)
        .maybeSingle()
    : { data: null }

  const isParticipant = (participants || []).some((p: any) => p.user_id === auth.user?.id)
  const isHost = auth.user?.id === plan.host_id
  const visibility = normalizeVisibility(plan.visibility)


  if (auth.user?.id && await hasBlockBetween(supabase, auth.user.id, plan.host_id)) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  if (visibility === 'private' && !isHost && !isParticipant) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  const effectiveStatus = computeEffectivePlanStatus({ ...plan, participants })
  if (effectiveStatus === 'expired' && !isHost && !isParticipant) {
    return NextResponse.json({ error: 'This plan has ended' }, { status: 410 })
  }

  return NextResponse.json({
    ...plan,
    visibility,
    status: effectiveStatus,
    require_approval: !!plan.approval_mode,
    participants: participants || [],
    current_user_id: auth.user?.id || null,
    removed_by_host_for_current_user: !!myMembership?.removed_by_host && myMembership?.status === 'left',
  })
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
  const { data: hostProfile } = await supabase.from('users').select('gender').eq('id', auth.user.id).maybeSingle()
  if (body.female_only === true && (hostProfile?.gender || '').toLowerCase() !== 'female') {
    return NextResponse.json({ error: 'Women-only plans can only be hosted by women.' }, { status: 400 })
  }
  const mapPlanStatus = (status: unknown): 'active' | 'full' | 'completed' | 'cancelled' | undefined => {
    if (typeof status !== 'string') return undefined
    if (status === 'open' || status === 'active') return 'active'
    if (status === 'full') return 'full'
    if (status === 'closed' || status === 'cancelled' || status === 'deleted') return 'cancelled'
    if (status === 'completed' || status === 'expired') return 'completed'
    return undefined
  }

  const visibility = body.visibility === 'invite_only' || body.visibility === 'private' ? 'invite_only' : body.visibility === 'public' ? 'public' : undefined
  const allowed: Record<string, any> = {
    title: body.title,
    description: body.description,
    location_name: body.location_name,
    city: body.city,
    datetime: body.datetime,
    max_people: body.max_people !== undefined ? Number(body.max_people) : undefined,
    category: body.category,
    visibility,
    host_mode: body.requireApproval ? 'host_managed' : 'open',
    approval_mode: body.requireApproval,
    whatsapp_link: typeof body.whatsapp_link === 'string' ? body.whatsapp_link.trim() : body.whatsapp_link,
    image_url: body.image_url,
    google_maps_link: body.google_maps_link,
    female_only: body.female_only,
    cost_mode: body.cost_mode,
    cost_amount: body.cost_amount !== undefined ? Number(body.cost_amount) : undefined,
    final_amount: body.final_amount !== undefined ? Number(body.final_amount) : undefined,
    host_included_in_spots_and_splits: body.host_included_in_spots_and_splits === undefined ? undefined : !!body.host_included_in_spots_and_splits,
    status: mapPlanStatus(body.status),
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

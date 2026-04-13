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
    .in('status', ['joined', 'pending'])

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
  const body = await request.json()
  const { data, error } = await supabase.from('plans').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

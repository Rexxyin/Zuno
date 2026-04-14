import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbSetupRequiredResponse, isMissingRelationError } from '@/lib/supabase/errors'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: plan, error: planError } = await supabase.from('plans').select('host_id').eq('id', id).single()
  if (isMissingRelationError(planError, 'plans')) return dbSetupRequiredResponse()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.host_id !== auth.user.id) return NextResponse.json({ error: 'Only host can approve requests' }, { status: 403 })

  const { requestUserId } = await request.json()
  const { error } = await supabase.from('plan_participants').update({ status: 'joined' }).eq('plan_id', id).eq('user_id', requestUserId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: user } = await supabase.from('users').select('total_joined').eq('id', requestUserId).single()
  await supabase.from('users').update({ total_joined: (user?.total_joined || 0) + 1 }).eq('id', requestUserId)

  return NextResponse.json({ ok: true })
}

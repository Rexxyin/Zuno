import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbSetupRequiredResponse, isMissingRelationError } from '@/lib/supabase/errors'

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: plan, error: planError } = await supabase.from('plans').select('id, approval_mode, host_id').eq('id', id).single()
  if (isMissingRelationError(planError, 'plans')) return dbSetupRequiredResponse()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.host_id === auth.user.id) return NextResponse.json({ error: 'Host is already part of the plan' }, { status: 400 })

  const status = plan.approval_mode ? 'pending' : 'joined'
  const { error } = await supabase.from('plan_participants').upsert({ user_id: auth.user.id, plan_id: id, status }, { onConflict: 'user_id,plan_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (!plan.approval_mode) {
    const { data: user } = await supabase.from('users').select('total_joined').eq('id', auth.user.id).single()
    await supabase.from('users').update({ total_joined: (user?.total_joined || 0) + 1 }).eq('id', auth.user.id)
  }

  return NextResponse.json({ status, message: plan.approval_mode ? 'Request sent' : 'Joined!' })
}

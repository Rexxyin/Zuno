import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeEffectivePlanStatus, normalizeVisibility } from '@/lib/plan'

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: plan } = await supabase
    .from('plans')
    .select('id, approval_mode, female_only, host_id, status, datetime, visibility, max_people, host_included_in_spots_and_splits, participants:plan_participants(status)')
    .eq('id', id)
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.host_id === auth.user.id) return NextResponse.json({ error: 'Host is already part of the plan' }, { status: 400 })

  const effectiveStatus = computeEffectivePlanStatus(plan as any)
  if (effectiveStatus !== 'open') return NextResponse.json({ error: 'This plan is closed for joining.' }, { status: 400 })

  if (plan.female_only) {
    const { data: me } = await supabase.from('users').select('gender').eq('id', auth.user.id).single()
    if ((me?.gender || '').toLowerCase() !== 'female') {
      return NextResponse.json({ error: 'This plan is for women only.' }, { status: 403 })
    }
  }

  const visibility = normalizeVisibility(plan.visibility)
  if (visibility === 'private') {
    return NextResponse.json({ error: 'This plan is private.' }, { status: 403 })
  }
  const status = plan.approval_mode ? 'pending' : 'joined'
  const { error } = await supabase.from('plan_participants').upsert({ user_id: auth.user.id, plan_id: id, status }, { onConflict: 'user_id,plan_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ status, message: status === 'pending' ? 'Request sent' : 'Joined!' })
}

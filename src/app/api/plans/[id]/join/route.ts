import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: plan } = await supabase.from('plans').select('id, approval_mode').eq('id', params.id).single()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const status = plan.approval_mode ? 'pending' : 'joined'
  const { error } = await supabase.from('plan_participants').upsert({ user_id: auth.user.id, plan_id: params.id, status }, { onConflict: 'user_id,plan_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (!plan.approval_mode) {
    const { data: user } = await supabase.from('users').select('total_joined').eq('id', auth.user.id).single()
    await supabase.from('users').update({ total_joined: (user?.total_joined || 0) + 1 }).eq('id', auth.user.id)
  }

  return NextResponse.json({ status, message: plan.approval_mode ? 'Request sent' : 'Joined!' })
}

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/server/safety'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const userId = String(body.userId || '')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data: plan } = await supabase.from('plans').select('host_id').eq('id', id).single()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.host_id !== auth.user.id) return NextResponse.json({ error: 'Only host can remove participants' }, { status: 403 })

  const { error } = await supabase
    .from('plan_participants')
    .update({ status: 'left', removed_by_host: true, removed_by_host_at: new Date().toISOString(), removed_by_host_user_id: auth.user.id })
    .eq('plan_id', id)
    .eq('user_id', userId)
    .eq('status', 'joined')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit(supabase, {
    actorId: auth.user.id,
    eventType: 'participant_removed_by_host',
    entityType: 'plan',
    entityId: id,
    metadata: { removedUserId: userId },
  })

  return NextResponse.json({ ok: true, message: 'Participant removed' })
}

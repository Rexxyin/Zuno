import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureNotBanned, logAudit, notifyReport } from '@/lib/server/safety'

const REASONS = new Set(['fake_profile', 'harassment', 'unsafe_plan', 'spam', 'other'])

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { banned } = await ensureNotBanned(supabase, auth.user.id)
  if (banned) return NextResponse.json({ error: 'Account restricted' }, { status: 403 })

  const body = await request.json()
  const targetType = body.targetType === 'profile' ? 'profile' : body.targetType === 'plan' ? 'plan' : ''
  const reason = String(body.reason || '')

  if (!targetType || !REASONS.has(reason)) {
    return NextResponse.json({ error: 'Invalid report payload' }, { status: 400 })
  }

  const payload = {
    reporter_id: auth.user.id,
    target_type: targetType,
    target_user_id: targetType === 'profile' ? String(body.targetUserId || '') : null,
    target_plan_id: targetType === 'plan' ? String(body.targetPlanId || '') : null,
    reason,
    details: body.details ? String(body.details) : null,
  }

  const { data, error } = await supabase.from('safety_reports').insert(payload).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await Promise.all([
    notifyReport({
      reportId: data.id,
      reason,
      targetType,
      targetId: payload.target_user_id || payload.target_plan_id || 'unknown',
      reporterId: auth.user.id,
      details: payload.details,
    }),
    logAudit(supabase, {
      actorId: auth.user.id,
      eventType: 'report_submitted',
      entityType: targetType,
      entityId: payload.target_user_id || payload.target_plan_id || null,
      metadata: { reason },
    }),
  ])

  return NextResponse.json({ ok: true, message: "Thanks, we'll review this." })
}

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('safety_reports')
    .select('*')
    .eq('reporter_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

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

  if (payload.target_type === 'profile' && payload.target_user_id === auth.user.id) {
    return NextResponse.json({ error: 'You cannot report your own profile.' }, { status: 400 })
  }

  if (payload.target_type === 'plan') {
    if (!payload.target_plan_id) {
      return NextResponse.json({ error: 'Invalid plan target.' }, { status: 400 })
    }
    const { data: targetPlan, error: planError } = await supabase
      .from('plans')
      .select('id,host_id')
      .eq('id', payload.target_plan_id)
      .single()
    if (planError || !targetPlan) {
      return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
    }
    if (targetPlan.host_id === auth.user.id) {
      return NextResponse.json({ error: 'You cannot report your own plan.' }, { status: 400 })
    }
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

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const targetType = searchParams.get('targetType')
  const targetId = searchParams.get('targetId')

  if (targetType && targetId) {
    const targetColumn = targetType === 'plan' ? 'target_plan_id' : targetType === 'profile' ? 'target_user_id' : null
    if (!targetColumn) return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 })

    const { data, error } = await supabase
      .from('safety_reports')
      .select('id,status')
      .eq('reporter_id', auth.user.id)
      .eq(targetColumn, targetId)
      .in('status', ['open', 'reviewing'])
      .limit(1)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ hasOpenReport: !!(data && data.length) })
  }

  const { data, error } = await supabase
    .from('safety_reports')
    .select('*')
    .eq('reporter_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

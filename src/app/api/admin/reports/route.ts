import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser, logAudit } from '@/lib/server/safety'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await isAdminUser(supabase, auth.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('safety_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await isAdminUser(supabase, auth.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const reportId = String(body.reportId || '')
  const action = String(body.action || '')
  if (!reportId || !action) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const { data: report } = await supabase.from('safety_reports').select('*').eq('id', reportId).single()
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  if (action === 'ignore') {
    await supabase.from('safety_reports').update({ status: 'dismissed', reviewed_at: new Date().toISOString(), reviewed_by: auth.user.id }).eq('id', reportId)
    await supabase.from('moderation_actions').insert({ moderator_id: auth.user.id, report_id: reportId, action: 'ignore_report', target_user_id: report.target_user_id, target_plan_id: report.target_plan_id })
  } else if (action === 'remove_plan' && report.target_plan_id) {
    await supabase.from('plans').update({ status: 'cancelled' }).eq('id', report.target_plan_id)
    await supabase.from('safety_reports').update({ status: 'resolved', reviewed_at: new Date().toISOString(), reviewed_by: auth.user.id }).eq('id', reportId)
    await supabase.from('moderation_actions').insert({ moderator_id: auth.user.id, report_id: reportId, action: 'remove_plan', target_plan_id: report.target_plan_id })
    await logAudit(supabase, { actorId: auth.user.id, eventType: 'plan_removed', entityType: 'plan', entityId: report.target_plan_id, metadata: { source: 'report' } })
  } else if (action === 'ban_user') {
    const targetUserId = report.target_user_id || body.targetUserId
    if (!targetUserId) return NextResponse.json({ error: 'No target user' }, { status: 400 })
    await supabase.from('users').update({ is_banned: true, banned_at: new Date().toISOString(), banned_reason: body.note || 'Safety moderation' }).eq('id', targetUserId)
    await supabase.from('safety_reports').update({ status: 'resolved', reviewed_at: new Date().toISOString(), reviewed_by: auth.user.id }).eq('id', reportId)
    await supabase.from('moderation_actions').insert({ moderator_id: auth.user.id, report_id: reportId, action: 'ban_user', target_user_id: targetUserId, note: body.note || null })
    await logAudit(supabase, { actorId: auth.user.id, eventType: 'user_banned', entityType: 'user', entityId: targetUserId, metadata: { source: 'report' } })
  } else if (action === 'unban_user') {
    const targetUserId = report.target_user_id || body.targetUserId
    if (!targetUserId) return NextResponse.json({ error: 'No target user' }, { status: 400 })
    await supabase.from('users').update({ is_banned: false, banned_at: null, banned_reason: null }).eq('id', targetUserId)
    await supabase.from('safety_reports').update({ status: 'resolved', reviewed_at: new Date().toISOString(), reviewed_by: auth.user.id }).eq('id', reportId)
    await supabase.from('moderation_actions').insert({ moderator_id: auth.user.id, report_id: reportId, action: 'unban_user', target_user_id: targetUserId, note: body.note || null })
    await logAudit(supabase, { actorId: auth.user.id, eventType: 'user_unbanned', entityType: 'user', entityId: targetUserId, metadata: { source: 'report' } })
  } else {
    return NextResponse.json({ error: 'Invalid action for report' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

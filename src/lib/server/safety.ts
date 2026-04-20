import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditEvent =
  | 'signup'
  | 'phone_otp_sent'
  | 'phone_verified'
  | 'plan_join'
  | 'report_submitted'
  | 'user_blocked'
  | 'user_unblocked'
  | 'user_banned'
  | 'user_unbanned'
  | 'plan_removed'
  | 'participant_removed_by_host'

export async function logAudit(
  supabase: SupabaseClient,
  payload: {
    actorId?: string | null
    eventType: AuditEvent | string
    entityType?: string | null
    entityId?: string | null
    metadata?: Record<string, any>
  },
) {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: payload.actorId || null,
      event_type: payload.eventType,
      entity_type: payload.entityType || null,
      entity_id: payload.entityId || null,
      metadata: payload.metadata || {},
    })
  } catch {
    // best effort
  }
}

export async function getBlockedUserIds(supabase: SupabaseClient, userId?: string | null): Promise<Set<string>> {
  if (!userId) return new Set()
  const [a, b] = await Promise.all([
    supabase.from('user_blocks').select('blocked_id').eq('blocker_id', userId),
    supabase.from('user_blocks').select('blocker_id').eq('blocked_id', userId),
  ])
  const ids = new Set<string>()
  ;(a.data || []).forEach((r: any) => r.blocked_id && ids.add(String(r.blocked_id)))
  ;(b.data || []).forEach((r: any) => r.blocker_id && ids.add(String(r.blocker_id)))
  return ids
}

export async function hasBlockBetween(supabase: SupabaseClient, a?: string | null, b?: string | null): Promise<boolean> {
  if (!a || !b) return false
  const { data } = await supabase
    .from('user_blocks')
    .select('blocker_id,blocked_id')
    .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`)
    .limit(1)
  return !!(data && data.length)
}

export async function isAdminUser(supabase: SupabaseClient, userId?: string | null): Promise<boolean> {
  if (!userId) return false
  const envAdmins = (process.env.ZUNO_ADMIN_USER_IDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  if (envAdmins.includes(userId)) return true

  const { data } = await supabase.from('users').select('is_admin').eq('id', userId).maybeSingle()
  return !!data?.is_admin
}

export async function ensureNotBanned(supabase: SupabaseClient, userId?: string | null): Promise<{ banned: boolean }> {
  if (!userId) return { banned: false }
  const { data } = await supabase.from('users').select('is_banned').eq('id', userId).maybeSingle()
  return { banned: !!data?.is_banned }
}

export async function notifyReport(payload: {
  reportId: string
  reason: string
  targetType: string
  targetId: string
  reporterId: string
  details?: string | null
}) {
  const text = `Zuno report ${payload.reportId}: ${payload.reason} on ${payload.targetType}:${payload.targetId} by ${payload.reporterId}${payload.details ? ` | ${payload.details}` : ''}`

  const slackWebhook = process.env.SLACK_WEBHOOK_URL
  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
    } catch {
      // ignore
    }
  }

  const alertEmail = process.env.REPORT_ALERT_EMAIL
  const resendKey = process.env.RESEND_API_KEY
  if (alertEmail && resendKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.REPORT_EMAIL_FROM || 'Zuno Safety <safety@zuno.app>',
          to: [alertEmail],
          subject: `New Zuno report: ${payload.reason}`,
          text,
        }),
      })
    } catch {
      // ignore
    }
  }
}

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureNotBanned, logAudit } from '@/lib/server/safety'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', auth.user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { banned } = await ensureNotBanned(supabase, auth.user.id)
  if (banned) return NextResponse.json({ error: 'Account restricted' }, { status: 403 })

  const body = await request.json()
  const blockedId = String(body.blockedId || '')
  if (!blockedId || blockedId === auth.user.id) {
    return NextResponse.json({ error: 'Invalid blocked user' }, { status: 400 })
  }

  const { error } = await supabase.from('user_blocks').upsert({ blocker_id: auth.user.id, blocked_id: blockedId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit(supabase, {
    actorId: auth.user.id,
    eventType: 'user_blocked',
    entityType: 'user',
    entityId: blockedId,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const blockedId = String(body.blockedId || '')
  if (!blockedId) return NextResponse.json({ error: 'Invalid blocked user' }, { status: 400 })

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', auth.user.id)
    .eq('blocked_id', blockedId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit(supabase, {
    actorId: auth.user.id,
    eventType: 'user_unblocked',
    entityType: 'user',
    entityId: blockedId,
  })

  return NextResponse.json({ ok: true })
}

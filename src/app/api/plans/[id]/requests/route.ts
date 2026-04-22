import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: plan } = await supabase.from('plans').select('host_id').eq('id', id).single()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.host_id !== auth.user.id) return NextResponse.json({ error: 'Only host can access requests' }, { status: 403 })

  const { data: pendingRows, error: pendingError } = await supabase
    .from('plan_participants')
    .select('user_id')
    .eq('plan_id', id)
    .eq('status', 'pending')
  if (pendingError) return NextResponse.json({ error: pendingError.message }, { status: 400 })

  const userIds = Array.from(new Set((pendingRows || []).map((row: any) => row.user_id).filter(Boolean)))
  if (userIds.length === 0) return NextResponse.json([])

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id,name,avatar_url')
    .in('id', userIds)
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 400 })

  const usersById = new Map((users || []).map((u: any) => [String(u.id), u]))
  const hydrated = (pendingRows || []).map((row: any) => ({
    user_id: row.user_id,
    user: usersById.get(String(row.user_id)) || null,
  }))

  return NextResponse.json(hydrated)
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { requestUserId } = await request.json()
  const { error } = await supabase.from('plan_participants').update({ status: 'joined' }).eq('plan_id', params.id).eq('user_id', requestUserId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: user } = await supabase.from('users').select('total_joined').eq('id', requestUserId).single()
  await supabase.from('users').update({ total_joined: (user?.total_joined || 0) + 1 }).eq('id', requestUserId)

  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { requestUserId } = await request.json()
  const { error } = await supabase.from('plan_participants').update({ status: 'declined' }).eq('plan_id', params.id).eq('user_id', requestUserId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

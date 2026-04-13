import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateReliabilityScore } from '@/lib/trust'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { attendedUserIds }: { attendedUserIds: string[] } = await request.json()

  for (const userId of attendedUserIds || []) {
    await supabase.from('plan_participants').update({ status: 'attended' }).eq('plan_id', params.id).eq('user_id', userId)
    const { data: u } = await supabase.from('users').select('total_attended').eq('id', userId).single()
    await supabase.from('users').update({ total_attended: (u?.total_attended || 0) + 1 }).eq('id', userId)
    await updateReliabilityScore(userId, supabase)
  }

  await supabase.from('plans').update({ status: 'completed' }).eq('id', params.id)
  return NextResponse.json({ ok: true })
}

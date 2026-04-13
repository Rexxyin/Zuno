import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateReliabilityScore } from '@/lib/trust'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { attendedUserIds }: { attendedUserIds: string[] } = await request.json()

  for (const userId of attendedUserIds || []) {
    await supabase.from('plan_participants').update({ status: 'attended' }).eq('plan_id', id).eq('user_id', userId)
    const { data: u } = await supabase.from('users').select('total_attended').eq('id', userId).single()
    await supabase.from('users').update({ total_attended: (u?.total_attended || 0) + 1 }).eq('id', userId)
    await updateReliabilityScore(userId, supabase)
  }

  await supabase.from('plans').update({ status: 'completed' }).eq('id', id)
  return NextResponse.json({ ok: true })
}

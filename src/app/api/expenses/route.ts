import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { planId, label, total_amount } = await request.json()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: participants } = await supabase.from('plan_participants').select('id').eq('plan_id', planId).eq('status', 'joined')
  const joinedCount = participants?.length || 1
  const per_person = Number(total_amount) / joinedCount

  const { error } = await supabase.from('expenses').insert({
    plan_id: planId,
    added_by: auth.user.id,
    label,
    total_amount,
    split_equally: true
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ per_person, message: `₹${per_person.toFixed(0)} per person` })
}

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()

  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { settled } = await request.json()

  const { data: participant } = await supabase
    .from('plan_participants')
    .select('id')
    .eq('plan_id', id)
    .eq('user_id', auth.user.id)
    .eq('status', 'joined')
    .maybeSingle()

  if (!participant) {
    return NextResponse.json({ error: 'Only joined members can update settlement status.' }, { status: 403 })
  }

  const { error: upsertError } = await supabase.from('expense_settlements').upsert(
    {
      plan_id: id,
      user_id: auth.user.id,
      settled: Boolean(settled),
      settled_at: settled ? new Date().toISOString() : null,
    },
    { onConflict: 'plan_id,user_id' },
  )

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 })

  const { data: settlements, error } = await supabase
    .from('expense_settlements')
    .select('user_id, settled, settled_at')
    .eq('plan_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ settlements: settlements || [] })
}

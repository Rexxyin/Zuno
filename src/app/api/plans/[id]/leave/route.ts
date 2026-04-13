import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase.from('plan_participants').update({ status: 'left' }).eq('plan_id', params.id).eq('user_id', auth.user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Left plan' })
}

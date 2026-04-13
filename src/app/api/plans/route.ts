import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from('plans')
    .select('*, host:users!plans_host_id_fkey(*)')
    .order('datetime', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const payload = {
    host_id: auth.user.id,
    title: body.title,
    description: body.description ?? null,
    category: body.category ?? 'other',
    location_name: body.location_name,
    city: body.city || 'General',
    datetime: body.datetime,
    max_people: Number(body.max_people || 8),
    whatsapp_link: body.whatsapp_link || '',
    approval_mode: !!body.approval_mode,
    female_only: !!body.female_only,
    image_url: body.image_url || null,
    google_maps_link: body.google_maps_link || null,
    show_payment_options: !!body.show_payment_options,
    estimated_cost: body.estimated_cost ? Number(body.estimated_cost) : null,
  }

  let { data, error } = await supabase.from('plans').insert(payload).select().single()

  if (error && /(google_maps_link|city|show_payment_options|estimated_cost)/.test(error.message)) {
    const { google_maps_link, city, show_payment_options, estimated_cost, ...fallbackPayload } = payload
    const retry = await supabase.from('plans').insert(fallbackPayload).select().single()
    data = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

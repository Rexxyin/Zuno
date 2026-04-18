import { ImageResponse } from 'next/og'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const planId = searchParams.get('planId')
  if (!planId) return new Response('Missing planId', { status: 400 })

  const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)
  const { data: plan } = await supabase.from('plans').select('id,title,category,datetime,location_name,max_people,host:users!plans_host_id_fkey(name,avatar_url),participants:plan_participants(status)').eq('id', planId).single()
  if (!plan) return new Response('Plan not found', { status: 404 })

  const joined = (plan.participants || []).filter((p: any) => p.status === 'joined').length
  const host = Array.isArray(plan.host) ? plan.host[0] : plan.host
  const spotsLeft = Math.max(Number(plan.max_people || 0) - joined, 0)
  const dateText = new Date(plan.datetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48, color: 'white', background: 'linear-gradient(135deg, #1C0F0A 0%, #3D1F12 100%)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 24, letterSpacing: 2, opacity: 0.85 }}>ZUNO</div>
        <div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000, maxHeight: 150, overflow: 'hidden' }}>{plan.title}</div>
          <div style={{ marginTop: 16, fontSize: 28, opacity: 0.9 }}>{plan.category} · {dateText} · {plan.location_name}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={host?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${host?.name || 'Host'}`} width={56} height={56} style={{ borderRadius: 9999 }} />
            <div style={{ fontSize: 24 }}>Hosted by {host?.name || 'Host'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: '10px 18px', fontSize: 24 }}>{spotsLeft} spots left</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

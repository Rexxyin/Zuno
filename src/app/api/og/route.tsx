import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getJoinedParticipantsCount, getParticipantCapacity } from '@/lib/plan'

export const runtime = 'edge'

const FALLBACK_IMAGE =
  'https://res.cloudinary.com/dojdqt19w/image/upload/v1776621170/Adobe_Express_-_file_tjw0sa.jpg'

function formatDate(datetime: string) {
  return new Date(datetime).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export async function GET(req: NextRequest) {
  const planId = req.nextUrl.searchParams.get('planId')

  if (!planId) {
    return new Response('Missing planId', { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: plan } = await supabase
    .from('plans')
    .select('id,title,datetime,city,location_name,image_url,max_people,host_included_in_spots_and_splits,participants:plan_participants(status)')
    .eq('id', planId)
    .single()

  if (!plan) {
    return new Response('Plan not found', { status: 404 })
  }

  const joinedCount = getJoinedParticipantsCount(plan.participants || [])
  const participantCapacity = getParticipantCapacity(plan as any)
  const spotsLeft = Math.max(participantCapacity - joinedCount, 0)

  const imageUrl = plan.image_url || FALLBACK_IMAGE

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Inter, Arial, sans-serif',
          color: '#fff',
          background: '#1A1410',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            padding: '46px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.22)',
                borderRadius: 999,
                padding: '10px 18px',
                fontSize: 28,
                fontWeight: 600,
              }}
            >
              Zuno
            </div>
            <div
              style={{
                background: spotsLeft <= 2 ? 'rgba(185,28,28,0.95)' : 'rgba(0,0,0,0.58)',
                borderRadius: 999,
                padding: '14px 20px',
                fontSize: 34,
                fontWeight: 800,
              }}
            >
              {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: '80%' }}>
            <div style={{ fontSize: 62, lineHeight: 1.08, fontWeight: 800 }}>{plan.title}</div>
            <div style={{ fontSize: 30, opacity: 0.95 }}>
              {formatDate(plan.datetime)}
              {plan.city ? ` · ${plan.city}` : ''}
              {plan.location_name ? ` · ${plan.location_name}` : ''}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

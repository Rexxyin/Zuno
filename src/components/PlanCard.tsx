import Image from 'next/image'
import Link from 'next/link'
import { Plan } from '@/lib/types'
import { TrustBadge } from './TrustBadge'
import { AvatarStack } from './AvatarStack'
import { MapPin, Users, Calendar, Clock, ChevronRight, Instagram, Info } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import { LocationLink } from './LocationLink'
import { CategoryIcon } from './CategoryIcon'

export function PlanCard({ plan }: { plan: Plan }) {
  if (!plan) return null

  const joinedParticipants = (plan.participant_count || plan.participants?.length || 0)
  const participantCount = joinedParticipants + 1
  const spotsLeft = Math.max(0, (plan.max_people || 10) - participantCount)
  const planDate = plan.datetime ? new Date(plan.datetime) : new Date()
  const dateStr = planDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeStr = planDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const category = CATEGORY_META[plan.category]

  return (
    <Link href={`/plans/${plan.id}`} className="block overflow-hidden rounded-[28px] border app-card shadow-sm">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={plan.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800'}
          alt={plan.title}
          fill
          className="object-cover"
          sizes="(max-width: 390px) 100vw, 390px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white inline-flex items-center gap-1">
          <CategoryIcon icon={category.icon} className="h-3 w-3" /> {category.label}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
          {spotsLeft} spots left
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-xl font-black line-clamp-1">{plan.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/90">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{plan.city || 'General'} · {plan.location_name}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{plan.host?.name || 'Host'}</span>
            {plan.host?.instagram_url && (
              <button type="button" className="text-pink-500" onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(plan.host?.instagram_url || '', '_blank'); }}>
                <Instagram className="h-4 w-4" />
              </button>
            )}
            <TrustBadge score={plan.host?.reliability_score ?? 100} />
          </div>
          <ChevronRight className="h-4 w-4 app-muted" />
        </div>

        <div className="flex items-center gap-3 text-xs app-muted">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {dateStr}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeStr}</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {participantCount}/{plan.max_people}</span>
        </div>

        <p className="text-[11px] app-muted inline-flex items-center gap-1"><Info className="h-3 w-3" /> Host is included in participant count</p>

        <LocationLink location={plan.location_name} googleMapsLink={plan.google_maps_link} />

        <AvatarStack names={(plan.participants || []).slice(0, 3).map((p) => p.user?.name || 'U')} />
      </div>
    </Link>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { Plan } from '@/lib/types'
import { Heart, CheckCircle2, Share2, Clock3, MapPin, Lock } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import { CategoryIcon } from './CategoryIcon'
import { useState } from 'react'
import { AvatarStack } from './AvatarStack'

export function PlanCard({ plan, onToggleFavorite, isAuthed = true }: { plan: Plan; onToggleFavorite?: () => void; isAuthed?: boolean }) {
  const [copied, setCopied] = useState(false)

  if (!plan) return null

  const planDate = plan.datetime ? new Date(plan.datetime) : new Date()
  const category = CATEGORY_META[plan.category]
  const userHasJoined = !!plan.is_joined

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/plans/${plan.id}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Link href={`/plans/${plan.id}`} className="block group">
      <div className="rounded-2xl overflow-hidden border-[1.5px] app-card hover:shadow-sm transition-all duration-200">
        <div className="relative h-40 w-full overflow-hidden bg-[#e6ded2]">
          <Image
            src={plan.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800'}
            alt={plan.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 390px) 100vw, 390px"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[#faf8f4]/95 border border-[#1a1410]/10 px-2 py-1 text-[9px] font-semibold text-[#1a1410]">
            <CategoryIcon icon={category.icon} className="h-2.5 w-2.5" /> {category.label}
          </div>

          {plan.visibility === 'private' && (
            <div className="absolute left-2.5 bottom-2.5 flex items-center gap-1 rounded-full bg-[#1a1410] text-[#faf8f4] px-2 py-1 text-[9px] font-semibold">
              <Lock className="h-3 w-3" /> Private
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite?.()
            }}
            className="absolute right-2.5 top-2.5 rounded-full bg-[#faf8f4]/95 p-1.5 text-[#8f8272] hover:text-[#d4522a] transition-colors"
            aria-label="toggle favorite"
          >
            <Heart className={`h-3.5 w-3.5 ${plan.is_favorite ? 'fill-[#d4522a] text-[#d4522a]' : ''}`} />
          </button>

          {userHasJoined && (
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-0.5 rounded-full bg-[#1a1410] text-[#faf8f4] px-1.5 py-1 text-[9px] font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Joined
            </div>
          )}
        </div>

        <div className="p-2.5 space-y-1.5">
          <h3 className="text-sm font-semibold line-clamp-1 text-[#1a1410]">{plan.title}</h3>
          <div className="text-xs text-[#4f4337] space-y-1">
            <p className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> {planDate.toLocaleString()}</p>
            <p className="inline-flex items-center gap-1 line-clamp-1"><MapPin className="h-3 w-3" /> {plan.location_name}</p>
            <p className="truncate">by <span className="font-medium">{plan.host?.name || 'Host'}</span></p>
          </div>

          {!!(plan as any).joined_names?.length && <AvatarStack names={(plan as any).joined_names} />}

          <p className="text-[11px] font-semibold text-[#d4522a]">Hurry! Happening soon — join now.</p>

          <div className="flex items-center gap-1.5 pt-1">
            <button type="button" onClick={handleShare} className={`rounded-md p-1.5 transition-all flex-shrink-0 ${copied ? 'bg-[#e8f3e8] text-[#2d7a2d]' : 'bg-[#efe8dc] text-[#5a4e42] hover:bg-[#e4ddd1]'}`}>
              <Share2 className="h-3.5 w-3.5" />
            </button>
            {!userHasJoined && (
              isAuthed ? <button className="flex-1 rounded-md bg-[#1a1410] text-[#faf8f4] font-semibold py-1.5 text-xs">Join</button>
              : <a href="/login?next=/feed" className="flex-1 rounded-md bg-[#1a1410] text-[#faf8f4] font-semibold py-1.5 text-xs text-center">Sign up to join</a>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

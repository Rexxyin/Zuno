import Image from 'next/image'
import Link from 'next/link'
import { Plan } from '@/lib/types'
import { Heart, CheckCircle2, Share2, AlertCircle } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import { CategoryIcon } from './CategoryIcon'
import { useState } from 'react'

export function PlanCard({ plan, onToggleFavorite }: { plan: Plan; onToggleFavorite?: () => void }) {
  const [copied, setCopied] = useState(false)
  
  if (!plan) return null

  const planDate = plan.datetime ? new Date(plan.datetime) : new Date()
  const category = CATEGORY_META[plan.category]
  
  // Check if plan is expired
  const isExpired = planDate < new Date()
  const userHasJoined = !!plan.is_joined
  
  // Handle share
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
      <div className={`rounded-2xl overflow-hidden border-[1.5px] transition-all duration-200 ${
        isExpired 
          ? 'app-card opacity-55' 
          : 'app-card hover:shadow-sm'
      }`}>
        {/* Image Section - Sleeker */}
        <div className="relative h-40 w-full overflow-hidden bg-[#e6ded2]">
          <Image
            src={plan.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800'}
            alt={plan.title}
            fill
            className={`object-cover transition-transform duration-300 ${!isExpired && 'group-hover:scale-105'}`}
            sizes="(max-width: 390px) 100vw, 390px"
            priority={false}
          />
          
          {/* Gradient Overlay */}
          {!isExpired && <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />}

          {/* Expired Badge - Center, Sleek */}
          {isExpired && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1.5 bg-[#1a1410]/90 text-[#faf8f4] px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm">
                <AlertCircle className="h-3.5 w-3.5" />
                Expired
              </div>
            </div>
          )}

          {/* Category Badge - Top Left, Minimal */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-0.5 rounded-full bg-[#faf8f4]/95 border border-[#1a1410]/10 px-1.5 py-1 text-[9px] font-semibold text-[#1a1410] backdrop-blur-sm">
            <CategoryIcon icon={category.icon} className="h-2.5 w-2.5" />
          </div>

          {/* Heart Button - Top Right */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite?.()
            }}
            className="absolute right-2.5 top-2.5 rounded-full bg-[#faf8f4]/95 p-1.5 text-[#8f8272] hover:text-[#d4522a] transition-colors backdrop-blur-sm border border-[#1a1410]/10"
            aria-label="toggle favorite"
          >
            <Heart className={`h-3.5 w-3.5 ${plan.is_favorite ? 'fill-[#d4522a] text-[#d4522a]' : ''}`} />
          </button>

          {/* Joined Badge - Bottom Left */}
          {userHasJoined && !isExpired && (
            <div className="absolute left-2.5 bottom-2.5 flex items-center gap-0.5 rounded-full bg-[#1a1410] text-[#faf8f4] px-1.5 py-1 text-[9px] font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Joined
            </div>
          )}
        </div>

        {/* Content Section - Sleeker Spacing */}
        <div className="p-2.5 space-y-1.5">
          {/* Title */}
          <h3 className={`text-sm font-semibold line-clamp-1 ${isExpired ? 'text-[#8f8272]' : 'text-[#1a1410]'}`}>
            {plan.title}
          </h3>

          {/* Host & Details - Single Line */}
          <div className={`text-xs flex items-center justify-between ${isExpired ? 'text-[#8f8272]' : 'text-[#4f4337]'}`}>
            <span className="font-medium truncate">{plan.host?.name || 'Host'}</span>
            <span className="ml-auto flex-shrink-0">⭐ {plan.host?.reliability_score ?? 100}%</span>
          </div>

          {/* Action Buttons - Minimal */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={handleShare}
              className={`rounded-md p-1.5 transition-all flex-shrink-0 ${
                copied 
                  ? 'bg-[#e8f3e8] text-[#2d7a2d]' 
                  : 'bg-[#efe8dc] text-[#5a4e42] hover:bg-[#e4ddd1]'
              }`}
              title="Copy share link"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            {/* ONLY show join if NOT expired AND NOT joined */}
            {!isExpired && !userHasJoined && (
              <button className="flex-1 rounded-md bg-[#1a1410] text-[#faf8f4] font-semibold py-1.5 text-xs transition-colors active:scale-95 hover:opacity-90">
                Join
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

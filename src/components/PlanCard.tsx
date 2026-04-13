import Image from 'next/image'
import Link from 'next/link'
import { Plan } from '@/lib/types'
import { MapPin, Heart, CheckCircle2, Share2, AlertCircle } from 'lucide-react'
import { CATEGORY_META } from '@/lib/categories'
import { CategoryIcon } from './CategoryIcon'
import { useState } from 'react'

export function PlanCard({ plan, onToggleFavorite }: { plan: Plan; onToggleFavorite?: () => void }) {
  const [copied, setCopied] = useState(false)
  
  if (!plan) return null

  const planDate = plan.datetime ? new Date(plan.datetime) : new Date()
  const dateStr = planDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeStr = planDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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
      <div className={`rounded-lg overflow-hidden border transition-all duration-200 ${
        isExpired 
          ? 'border-gray-200 bg-white opacity-50' 
          : 'border-gray-200 bg-white hover:shadow-md'
      }`}>
        {/* Image Section - Sleeker */}
        <div className="relative h-40 w-full overflow-hidden bg-gray-100">
          <Image
            src={plan.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800'}
            alt={plan.title}
            fill
            className={`object-cover transition-transform duration-300 ${!isExpired && 'group-hover:scale-105'}`}
            sizes="(max-width: 390px) 100vw, 390px"
            priority={false}
          />
          
          {/* Gradient Overlay */}
          {!isExpired && <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />}

          {/* Expired Badge - Center, Sleek */}
          {isExpired && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1.5 bg-red-500/95 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm">
                <AlertCircle className="h-3.5 w-3.5" />
                Expired
              </div>
            </div>
          )}

          {/* Category Badge - Top Left, Minimal */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-1 text-[9px] font-semibold text-gray-900 backdrop-blur-sm">
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
            className="absolute right-2.5 top-2.5 rounded-full bg-white/90 p-1.5 text-gray-600 hover:text-red-500 transition-colors backdrop-blur-sm"
            aria-label="toggle favorite"
          >
            <Heart className={`h-3.5 w-3.5 ${plan.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>

          {/* Joined Badge - Bottom Left */}
          {userHasJoined && !isExpired && (
            <div className="absolute left-2.5 bottom-2.5 flex items-center gap-0.5 rounded-full bg-teal-500 text-white px-1.5 py-1 text-[9px] font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Joined
            </div>
          )}
        </div>

        {/* Content Section - Sleeker Spacing */}
        <div className="p-2.5 space-y-1.5">
          {/* Title */}
          <h3 className={`text-sm font-semibold line-clamp-1 ${isExpired ? 'text-gray-500' : 'text-gray-900'}`}>
            {plan.title}
          </h3>

          {/* Host & Details - Single Line */}
          <div className={`text-xs flex items-center justify-between ${isExpired ? 'text-gray-500' : 'text-gray-700'}`}>
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
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Copy share link"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            {/* ONLY show join if NOT expired AND NOT joined */}
            {!isExpired && !userHasJoined && (
              <button className="flex-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1.5 text-xs transition-colors active:scale-95">
                Join
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

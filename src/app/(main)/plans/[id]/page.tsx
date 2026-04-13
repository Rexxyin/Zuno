'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Users, Calendar, Heart, ChevronLeft, Flag, Instagram } from 'lucide-react'
import { TrustBadge } from '@/components/TrustBadge'
import { LocationLink } from '@/components/LocationLink'
import { BottomNav } from '@/components/BottomNav'
import Image from 'next/image'
import type { Plan } from '@/lib/types'

export default function PlanPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [plan, setPlan] = useState<Plan & { host?: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/plans/${params.id}`)
        if (!response.ok) throw new Error('Plan not found')
        const data = await response.json()
        setPlan(data)
        setParticipantCount(data.participant_count || data.participants?.length || 0)
      } catch (error) {
        console.error('Failed to fetch plan:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [params.id])

  const handleJoinPlan = async () => {
    try {
      const response = await fetch(`/api/plans/${params.id}/join`, { method: 'POST' })
      if (response.ok) {
        setIsJoined(true)
        setParticipantCount(prev => prev + 1)
      } else {
        alert('Failed to join plan')
      }
    } catch (error) {
      console.error('Failed to join plan:', error)
      alert('Failed to join plan')
    }
  }

  const handleLikePlan = () => {
    setIsLiked(!isLiked)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-24">
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-96 bg-gray-200 w-full"
        />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center pb-24">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold mb-4">Plan not found</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold"
        >
          Go Back
        </motion.button>
      </div>
    )
  }

  const planDate = new Date(plan.datetime)
  const dateStr = planDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = planDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const spotsLeft = Math.max(0, plan.max_people - participantCount)
  const isFull = spotsLeft === 0

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between p-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        <h2 className="text-lg font-bold text-gray-900">Plan Details</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700"
        >
          <Flag className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Hero Image */}
      <div className="relative h-80 w-full bg-gradient-to-br from-purple-400 to-blue-500 overflow-hidden">
        <Image
          src={plan.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200'}
          alt={plan.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Title and Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 mb-2">{plan.title}</h1>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full capitalize">
                  {plan.category}
                </span>
                {plan.female_only && (
                  <span className="px-3 py-1 bg-pink-500 text-white text-xs font-bold rounded-full">
                    👩 Women only
                  </span>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsLiked(!isLiked)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isLiked
                  ? 'bg-red-100'
                  : 'bg-gray-100'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </motion.button>
          </div>
        </motion.div>

        {/* Host Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200"
        >
          <p className="text-sm text-gray-600 mb-3">Organized by</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-lg font-bold">
                {plan.host?.name?.charAt(0) || 'H'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">{plan.host?.name || 'Host'} {plan.host?.instagram_handle && <Instagram className="w-4 h-4 text-pink-500" />}</h3>
                <TrustBadge score={plan.host?.reliability_score ?? 100} />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 font-semibold text-sm hover:bg-gray-50"
            >
              Message
            </motion.button>
          </div>
        </motion.div>

        {/* Details Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Date/Time */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-900">When</span>
            </div>
            <p className="font-bold text-gray-900">{dateStr}</p>
            <p className="text-sm text-gray-600">{timeStr}</p>
          </div>

          {/* Location */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <span className="text-xs font-semibold text-red-900">Where</span>
            </div>
            <LocationLink location={plan.location_name} googleMapsLink={plan.google_maps_link} />
          </div>

          {/* Participants */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-xs font-semibold text-green-900">Participants</span>
            </div>
            <p className="font-bold text-gray-900">{participantCount}/{plan.max_people}</p>
            <p className="text-sm text-gray-600">{spotsLeft} spots left</p>
          </div>

          {/* Cost */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <span className="text-xs font-semibold text-purple-900">Est. Cost</span>
            </div>
            <p className="font-bold text-gray-900">₹500-1000</p>
            <p className="text-sm text-gray-600">Per person</p>
          </div>
        </motion.div>

        {/* Description */}
        {plan.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            <h3 className="font-bold text-gray-900 mb-2">About</h3>
            <p className="text-gray-700 leading-relaxed">{plan.description}</p>
          </motion.div>
        )}

        {/* Participants List */}
        {plan.participants && plan.participants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            <h3 className="font-bold text-gray-900 mb-4">Going ({plan.participants?.length || 0})</h3>
            <div className="grid grid-cols-2 gap-3">
              {(plan.participants || []).slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                    {p?.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p?.user?.name || 'Unknown'}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-24 max-w-2xl mx-auto">
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-blue-500 text-blue-600 font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5 inline mr-2" />
            Chat
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleJoinPlan}
            disabled={isFull || isJoined}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-lg transition-all text-white ${
              isJoined
                ? 'bg-green-500 hover:bg-green-600'
                : isFull
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg'
            }`}
          >
            {isJoined ? '✓ Joining' : isFull ? 'Plan Full' : `Join Plan`}
          </motion.button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

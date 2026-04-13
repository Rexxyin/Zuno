export interface User {
  id: string
  name: string
  avatar_url: string | null
  instagram_handle: string | null
  instagram_url?: string | null
  gpay_link?: string | null
  phone_verified: boolean
  reliability_score: number
  total_joined: number
  total_attended: number
  created_at: string
}

export type PlanCategory = 'hiking' | 'food' | 'music' | 'cycling' | 'art' | 'travel' | 'sports' | 'other'
export type PlanStatus = 'active' | 'full' | 'completed' | 'cancelled'
export type ParticipantStatus = 'pending' | 'joined' | 'left' | 'attended' | 'declined'

export interface Plan {
  id: string
  host_id: string
  title: string
  description: string | null
  location_name: string
  city?: string | null
  datetime: string
  max_people: number
  whatsapp_link: string | null
  image_url: string | null
  google_maps_link?: string | null
  category: PlanCategory
  status: PlanStatus
  approval_mode: boolean
  female_only: boolean
  show_payment_options?: boolean
  estimated_cost?: number | null
  participant_count?: number
  is_joined?: boolean
  is_favorite?: boolean
  created_at: string
  host?: User
  participants?: PlanParticipant[]
}

export interface PlanParticipant {
  id: string
  user_id: string
  plan_id: string
  status: ParticipantStatus
  joined_at: string
  user?: User
}

export interface Expense {
  id: string
  plan_id: string
  added_by: string
  label: string
  total_amount: number
  split_equally: boolean
  created_at: string
  per_person?: number
}

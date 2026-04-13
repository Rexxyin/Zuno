export interface User {
  id: string
  name: string
  avatar_url: string | null
  instagram_handle: string | null
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
  datetime: string
  max_people: number
  whatsapp_link: string | null
  image_url: string | null
  category: PlanCategory
  status: PlanStatus
  approval_mode: boolean
  female_only: boolean
  created_at: string
  host?: User
  participants?: PlanParticipant[]
  participant_count?: number
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

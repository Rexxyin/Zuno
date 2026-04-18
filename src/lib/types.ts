export interface User {
  id: string
  name: string
  avatar_url: string | null
  avatar_seed?: string | null
  instagram_handle: string | null
  instagram_url?: string | null
  gpay_link?: string | null
  upi_payee_name?: string | null
  phone_verified: boolean
  gender?: string | null
  age?: number | null
  phone_number?: string | null
  reliability_score: number
  total_joined: number
  total_attended: number
  created_at: string
}

export type PlanCategory = 'hiking' | 'food' | 'music' | 'cycling' | 'art' | 'travel' | 'sports' | 'other'
export type PlanStatus = 'open' | 'closed' | 'full' | 'expired' | 'active' | 'completed' | 'cancelled' | 'deleted'
export type PlanVisibility = 'public' | 'invite_only' | 'private'
export type HostMode = 'host_managed' | 'open'
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
  require_approval?: boolean
  visibility?: PlanVisibility
  host_mode?: HostMode
  female_only: boolean
  show_payment_options?: boolean
  estimated_cost?: number | null
  total_amount?: number | null
  per_person_amount?: number | null
  cost_mode?: 'per_person' | 'total' | null
  cost_amount?: number | null
  final_amount?: number | null
  participant_count?: number
  is_joined?: boolean
  is_favorite?: boolean
  current_user_id?: string | null
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

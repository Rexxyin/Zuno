import type { Plan } from './types'

export type NormalizedPlanStatus = 'open' | 'closed' | 'full' | 'expired'

export function normalizeVisibility(raw?: string | null): 'public' | 'invite_only' | 'private' {
  if (raw === 'private') return 'private'
  if (raw === 'invite_only') return 'invite_only'
  return 'public'
}

export function normalizePlanStatus(raw?: string | null): NormalizedPlanStatus {
  if (raw === 'full') return 'full'
  if (raw === 'cancelled' || raw === 'completed') return 'closed'
  if (raw === 'open' || raw === 'closed' || raw === 'expired') return raw
  return 'open'
}

export function getJoinedParticipantsCount(participants?: any[]): number {
  return (participants || []).filter((p: any) => p?.status === 'joined').length
}

export function isHostIncludedInSpots(plan: Partial<Plan>): boolean {
  return plan.host_included_in_spots_and_splits !== false
}

export function getParticipantCapacity(plan: Partial<Plan>): number {
  const maxPeople = Number(plan.max_people || 0)
  if (maxPeople <= 0) return 0
  return Math.max(isHostIncludedInSpots(plan) ? maxPeople - 1 : maxPeople, 0)
}

export function computeEffectivePlanStatus(plan: Partial<Plan> & { datetime?: string | null; max_people?: number | null; participants?: any[]; status?: string | null }): NormalizedPlanStatus {
  const normalized = normalizePlanStatus(plan.status)
  const isPast = plan.datetime ? +new Date(plan.datetime) < Date.now() : false
  if (isPast) return 'expired'

  const joinedCount = getJoinedParticipantsCount(plan.participants)
  const participantCapacity = getParticipantCapacity(plan)
  if (participantCapacity > 0 && joinedCount >= participantCapacity) return 'full'
  if (normalized === 'closed') return 'closed'
  if (normalized === 'expired') return 'expired'
  if (normalized === 'full') return 'full'
  return 'open'
}

export function statusLabel(status: NormalizedPlanStatus): string {
  if (status === 'closed') return 'Plan is closed'
  if (status === 'full') return 'Plan is full'
  if (status === 'expired') return 'Plan has expired'
  return 'Join responsibly'
}

export function statusBadge(status: NormalizedPlanStatus): { text: string; className: string } | null {
  if (status === 'open') return null
  if (status === 'closed') return { text: 'Closed', className: 'bg-[#FEF3C7] text-[#92400E]' }
  if (status === 'full') return { text: 'Full', className: 'bg-[#FFEDD5] text-[#9A3412]' }
  return { text: 'Ended', className: 'bg-[#F3F4F6] text-[#6B7280]' }
}

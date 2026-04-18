import type { Plan } from './types'

export type NormalizedPlanStatus = 'open' | 'closed' | 'full' | 'expired'

export function normalizeVisibility(raw?: string | null): 'public' | 'invite_only' {
  return raw === 'private' || raw === 'invite_only' ? 'invite_only' : 'public'
}

export function normalizePlanStatus(raw?: string | null): NormalizedPlanStatus {
  if (raw === 'closed' || raw === 'full' || raw === 'expired' || raw === 'open') return raw
  if (raw === 'cancelled' || raw === 'completed' || raw === 'deleted') return 'closed'
  return 'open'
}

export function computeEffectivePlanStatus(plan: Partial<Plan> & { datetime?: string | null; max_people?: number | null; participants?: any[]; status?: string | null }): NormalizedPlanStatus {
  const normalized = normalizePlanStatus(plan.status)
  const isPast = plan.datetime ? +new Date(plan.datetime) < Date.now() : false
  if (isPast) return 'expired'

  const joinedCount = (plan.participants || []).filter((p: any) => p?.status === 'joined').length
  const maxPeople = Number(plan.max_people || 0)
  if (maxPeople > 0 && joinedCount >= maxPeople) return 'full'
  if (normalized === 'closed') return 'closed'
  if (normalized === 'expired') return 'expired'
  if (normalized === 'full') return 'full'
  return 'open'
}

export function statusLabel(status: NormalizedPlanStatus): string {
  if (status === 'closed') return 'Plan is closed'
  if (status === 'full') return 'Plan is full'
  if (status === 'expired') return 'Plan has expired'
  return 'Join plan'
}

export function statusBadge(status: NormalizedPlanStatus): { text: string; className: string } | null {
  if (status === 'open') return null
  if (status === 'closed') return { text: 'Closed', className: 'bg-[#FEF3C7] text-[#92400E]' }
  if (status === 'full') return { text: 'Full', className: 'bg-[#FFEDD5] text-[#9A3412]' }
  return { text: 'Ended', className: 'bg-[#F3F4F6] text-[#6B7280]' }
}

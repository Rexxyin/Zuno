import type { PlanCategory } from './types'

export const CATEGORY_META: Record<PlanCategory, { label: string; icon: 'mountain' | 'utensils' | 'music' | 'bike' | 'palette' | 'plane' | 'trophy' | 'sparkles' }> = {
  hiking: { label: 'Hiking Trail', icon: 'mountain' },
  food: { label: 'Food Crawl', icon: 'utensils' },
  music: { label: 'Music Jam', icon: 'music' },
  cycling: { label: 'Cycling Ride', icon: 'bike' },
  art: { label: 'Art & Culture', icon: 'palette' },
  travel: { label: 'Travel Escape', icon: 'plane' },
  sports: { label: 'Sports Meetup', icon: 'trophy' },
  other: { label: 'Other Activity', icon: 'sparkles' },
}

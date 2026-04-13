import type { PlanCategory } from './types'

export const CATEGORY_META: Record<PlanCategory, { label: string; icon: string }> = {
  hiking: { label: 'Hiking Trail', icon: '🥾' },
  food: { label: 'Food Crawl', icon: '🍜' },
  music: { label: 'Music Jam', icon: '🎵' },
  cycling: { label: 'Cycling Ride', icon: '🚴' },
  art: { label: 'Art & Culture', icon: '🎨' },
  travel: { label: 'Travel Escape', icon: '🧳' },
  sports: { label: 'Sports Meetup', icon: '🏀' },
  other: { label: 'Other Activity', icon: '✨' },
}

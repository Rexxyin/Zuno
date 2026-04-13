export const INDIA_HIGH_POTENTIAL_CITIES = [
  'Udaipur',
  'Goa North',
  'Goa South',
  'Manali',
  'Kasol',
  'Rishikesh',
  'Dharamshala',
  'Bir',
  'Spiti Valley',
  'Leh',
  'Mussoorie',
  'Nainital',
  'Jaipur',
  'Jaisalmer',
  'Jodhpur',
  'Pushkar',
  'Gokarna',
  'Hampi',
  'Pondicherry',
  'Varkala',
  'Munnar',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Pune',
  'Hyderabad',
  'Coorg',
  'Wayanad',
  'Alleppey',
  'Kodaikanal',
  'Ooty',
  'Tirthan Valley',
  'Ziro',
  'Varanasi',
  'Haridwar',
  'Amritsar',
  'Indore',
  'Bhopal',
  'Chandigarh',
  'Surat',
  'Ahmedabad',
] as const

export const DEFAULT_LAUNCH_CITY = 'Udaipur'

const CITY_ALIASES: Record<string, string> = {
  'north goa': 'goa north',
  'south goa': 'goa south',
  bengaluru: 'bangalore',
}

export function normalizeCityKey(city: string | null | undefined) {
  const raw = (city || '').toLowerCase().trim().replace(/\s+/g, ' ')
  return CITY_ALIASES[raw] || raw
}

export function canonicalizeCity(city: string | null | undefined) {
  const key = normalizeCityKey(city)
  const matched = INDIA_HIGH_POTENTIAL_CITIES.find((value) => normalizeCityKey(value) === key)
  return matched || (city || '').trim()
}

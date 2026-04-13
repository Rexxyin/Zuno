export async function updateReliabilityScore(userId: string, supabase: any) {
  const { data: user } = await supabase.from('users').select('total_joined, total_attended').eq('id', userId).single()
  if (!user || user.total_joined === 0) return
  const score = Math.round((user.total_attended / user.total_joined) * 100)
  await supabase.from('users').update({ reliability_score: score }).eq('id', userId)
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#1D9E75'
  if (score >= 60) return '#BA7517'
  return '#D85A30'
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Very reliable'
  if (score >= 80) return 'Reliable'
  if (score >= 60) return 'Mostly reliable'
  return 'Unreliable'
}

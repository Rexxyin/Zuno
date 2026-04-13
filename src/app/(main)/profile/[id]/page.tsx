import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const userId = params.id === 'me' ? undefined : params.id
  const query = supabase.from('users').select('*')
  const { data: user } = await (userId ? query.eq('id', userId).single() : query.limit(1).single())
  if (!user) return <p>User not found</p>

  return (
    <div>
      <h1 className="text-2xl font-bold">{user.name}</h1>
      <p className="text-sm text-zinc-600">Reliability: {user.reliability_score}%</p>
    </div>
  )
}

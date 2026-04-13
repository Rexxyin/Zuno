import { PlanCard } from '@/components/PlanCard'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export default async function FeedPage() {
  const supabase = createClient()
  const { data } = await supabase.from('plans').select('*, host:users(*), participants:plan_participants(*)').order('datetime', { ascending: true }).limit(20)

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">zuno</h1>
      {(data || []).map((plan) => <PlanCard key={plan.id} plan={plan as any} />)}
    </div>
  )
}

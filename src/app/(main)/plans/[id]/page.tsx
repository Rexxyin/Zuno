import { JoinButton } from '@/components/JoinButton'
import { LocationLink } from '@/components/LocationLink'
import { TrustBadge } from '@/components/TrustBadge'
import { createClient } from '@/lib/supabase/server'

export default async function PlanDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: plan } = await supabase.from('plans').select('*, host:users(*)').eq('id', params.id).single()
  if (!plan) return <p>Plan not found</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{plan.title}</h1>
      <div className="rounded-xl border bg-white p-4 space-y-2">
        <LocationLink location={plan.location_name} />
        <p className="text-sm">{new Date(plan.datetime).toLocaleString()}</p>
        <div className="flex items-center gap-2 text-sm"><span>{plan.host?.name}</span><TrustBadge score={plan.host?.reliability_score ?? 100} /></div>
      </div>
      <JoinButton state="idle" approvalMode={plan.approval_mode} />
    </div>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { Plan } from '@/lib/types'
import { TrustBadge } from './TrustBadge'
import { AvatarStack } from './AvatarStack'
import { JoinButton } from './JoinButton'

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Link href={`/plans/${plan.id}`} className="block overflow-hidden rounded-2xl border bg-white">
      <div className="relative h-40">
        <Image src={plan.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200'} alt={plan.title} fill className="object-cover" sizes="(max-width: 390px) 100vw, 390px" />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white">{plan.category}</span>
      </div>
      <div className="space-y-2 p-3">
        <div className="font-semibold">{plan.title}</div>
        <div className="flex items-center gap-2"><span className="text-sm text-zinc-600">{plan.host?.name || 'Host'}</span><TrustBadge score={plan.host?.reliability_score ?? 100} /></div>
        <div className="flex items-center justify-between">
          <AvatarStack names={(plan.participants || []).map((p) => p.user?.name || 'U')} />
          <JoinButton state="idle" approvalMode={plan.approval_mode} />
        </div>
      </div>
    </Link>
  )
}

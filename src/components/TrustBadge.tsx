import { scoreColor } from '@/lib/trust'

export function TrustBadge({ score }: { score: number }) {
  return (
    <span className="text-sm">
      <span style={{ color: scoreColor(score) }} className="font-semibold">{score}%</span>{' '}
      <span className="text-zinc-500">reliable</span>
    </span>
  )
}

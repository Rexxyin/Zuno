export function PlanCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border app-card p-3">
      <div className="skeleton h-36 w-full rounded-xl" />
      <div className="mt-3 space-y-2">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-6 w-24 rounded-full" />
      </div>
    </div>
  )
}

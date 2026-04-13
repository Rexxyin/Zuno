export function AvatarStack({ names }: { names: string[] }) {
  return (
    <div className="flex -space-x-2">
      {names.slice(0, 3).map((n) => (
        <div key={n} className="h-7 w-7 rounded-full border border-white bg-zinc-100 text-xs grid place-items-center">{n.slice(0,2).toUpperCase()}</div>
      ))}
      {names.length > 3 && <div className="h-7 w-7 rounded-full border border-white bg-amber-100 text-xs grid place-items-center">+{names.length - 3}</div>}
    </div>
  )
}

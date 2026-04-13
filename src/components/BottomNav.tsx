'use client'

import Link from 'next/link'
import { Compass, House, Plus, UserCircle2, WalletCards } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  const is = (p: string) => pathname.startsWith(p)
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-sm items-end justify-between px-6 pt-2 text-xs">
        <Link href="/feed" className={is('/feed') ? 'text-black' : 'text-zinc-500'}><House /></Link>
        <Link href="/feed" className="text-zinc-500"><Compass /></Link>
        <Link href="/plans/create" className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-black text-white"><Plus /></Link>
        <Link href="/my-plans" className={is('/my-plans') ? 'text-black' : 'text-zinc-500'}><WalletCards /></Link>
        <Link href="/profile/me" className={is('/profile') ? 'text-black' : 'text-zinc-500'}><UserCircle2 /></Link>
      </div>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { Flame, Plus, Heart } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function BottomNav({ pendingRequestsCount = 0 }: { pendingRequestsCount?: number }) {
  const pathname = usePathname()
  const is = (p: string) => pathname.startsWith(p)

  const navItems = [
    { href: '/feed', icon: Flame, label: 'Discover', active: is('/feed') },
    { href: '/my-plans', icon: Heart, label: 'My Plans', active: is('/my-plans'), badge: pendingRequestsCount },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t app-card" style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-md items-end justify-between px-3 py-2">
        {navItems.map((item: any) => (
          <Link key={item.href} href={item.href} className="relative flex min-w-[92px] flex-col items-center gap-0.5 py-1">
            <div className={`rounded-lg p-1.5 transition-colors ${item.active ? 'bg-[#1a1410] text-[#faf8f4]' : 'text-[#8f8272] hover:bg-[#efe8dc]'}`}>
              <item.icon className="h-[18px] w-[18px]" />
            </div>
            {!!item.badge && <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">{item.badge}</span>}
            <span className="text-[10px] font-medium text-[#5a4e42]">{item.label}</span>
          </Link>
        ))}

        <Link href="/plans/create" className="rounded-xl bg-[#d4522a] p-2 text-[#faf8f4] transition-colors shadow-sm hover:opacity-90">
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  )
}

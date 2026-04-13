'use client'

import Link from 'next/link'
import { Flame, Plus, Heart, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  const is = (p: string) => pathname.startsWith(p)

  const navItems = [
    { href: '/feed', icon: Flame, label: 'Discover', active: is('/feed') },
    { href: '/my-plans', icon: Heart, label: 'My Plans', active: is('/my-plans') },
    { href: '/profile/me', icon: User, label: 'Profile', active: is('/profile') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t app-card" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
            <div className={`rounded-lg p-2 transition-colors ${item.active ? 'bg-[#1a1410] text-[#faf8f4]' : 'text-[#8f8272] hover:bg-[#efe8dc]'}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-[#5a4e42]">{item.label}</span>
          </Link>
        ))}

        <Link href="/plans/create" className="rounded-lg bg-[#d4522a] p-2.5 text-[#faf8f4] transition-colors shadow-sm hover:opacity-90">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { Flame, Plus, Heart, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  const is = (p: string) => pathname.startsWith(p)

  const navItems = [
    { href: '/feed', icon: Flame, label: 'Discover', active: is('/feed') },
    { href: '/my-plans', icon: Heart, label: 'Saved', active: is('/my-plans') },
    { href: '/profile/me', icon: User, label: 'Profile', active: is('/profile') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
            <div className={`rounded-lg p-2 transition-colors ${item.active ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-gray-700">{item.label}</span>
          </Link>
        ))}

        <Link href="/plans/create" className="rounded-lg bg-teal-600 p-2.5 text-white hover:bg-teal-700 transition-colors shadow-sm">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  )
}

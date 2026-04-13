'use client'

import Link from 'next/link'
import { Flame, Compass, Plus, Heart, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  const is = (p: string) => pathname.startsWith(p)

  const navItems = [
    { href: '/feed', icon: Flame, label: 'Discover', active: is('/feed') },
    { href: '/feed', icon: Compass, label: 'Explore', active: false },
    { href: '/my-plans', icon: Heart, label: 'Saved', active: is('/my-plans') },
    { href: '/profile/me', icon: User, label: 'Profile', active: is('/profile') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto mb-2 flex max-w-md items-center justify-between rounded-3xl border app-card px-4 py-2 shadow-lg">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center">
            <div className={`rounded-xl p-2 ${item.active ? 'bg-orange-100 text-orange-500' : 'app-muted'}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className="mt-1 text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}

        <Link href="/plans/create" className="-mt-8 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 p-3 text-white shadow-xl">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  )
}

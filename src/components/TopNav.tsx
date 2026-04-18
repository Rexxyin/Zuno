'use client'

import Link from 'next/link'
import { LogOut, MapPin, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { INDIA_HIGH_POTENTIAL_CITIES } from '@/lib/cities'
import { useCity } from '@/components/CityContext'
import { createClient } from '@/lib/supabase/client'
import { getUserAvatarUrl } from '@/lib/avatar'
import { SignInDialog } from '@/components/auth/SignInDialog'

const HIDE_TOP_NAV_ROUTES = ['/settings']

type CurrentUser = { id: string; email: string | null; name: string | null; avatar_url: string | null; avatar_seed: string | null }

export function TopNav() {
  const pathname = usePathname()
  const { selectedCity, setSelectedCity } = useCity()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const authUser = data.user
      if (!authUser) return setUser(null)
      const { data: profile } = await supabase.from('users').select('name,avatar_url,avatar_seed').eq('id', authUser.id).single()
      setUser({ id: authUser.id, email: authUser.email || null, name: profile?.name || authUser.user_metadata?.name || null, avatar_url: profile?.avatar_url || null, avatar_seed: profile?.avatar_seed || null })
    }
    loadUser()
  }, [])

  if (HIDE_TOP_NAV_ROUTES.includes(pathname)) return null

  return (
    <div className="sticky top-0 z-20 border-b app-card backdrop-blur-md overflow-visible">
      <div className="mx-auto max-w-md px-4 py-3 overflow-visible"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.22em] app-muted">Zuno</p><p className="text-sm font-semibold text-[#1a1410]">City plans</p></div>
        <div className="flex max-w-[70%] items-center gap-2"><label className="inline-flex min-w-0 items-center gap-1.5 rounded-full border-[1.5px] app-card px-2.5 py-1.5 text-xs text-[#1a1410]"><MapPin className="h-3.5 w-3.5" /><select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#1a1410] outline-none">{INDIA_HIGH_POTENTIAL_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
          {user ? <div className="relative"><button type="button" onClick={() => setShowMenu((prev) => !prev)} className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-[1.5px] app-card" aria-label="Open profile menu"><img src={getUserAvatarUrl({ avatarUrl: user.avatar_url, avatarSeed: user.avatar_seed, fallbackSeed: user.id })} alt="Your profile" className="h-full w-full object-cover" /></button>{showMenu && <div className="absolute right-0 top-12 z-[9999] min-w-[220px] rounded-xl border app-card p-2 shadow-lg"><div className='px-2.5 py-2'><p className='text-sm font-semibold'>{user.name || 'User'}</p><p className='text-xs app-muted'>{user.email}</p></div><Link href={`/profile/${user.id}`} onClick={() => setShowMenu(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-[#f3ebdf]"><User className='h-3.5 w-3.5' />Edit profile</Link><button type="button" onClick={async () => { await createClient().auth.signOut(); setShowMenu(false); window.location.href = '/feed' }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[#9b2d20] hover:bg-[#fff0ec]"><LogOut className="h-3.5 w-3.5" />Log out</button></div>}</div> : <button type="button" onClick={() => setShowAuthDialog(true)} className="inline-flex h-10 items-center justify-center rounded-full border-[1.5px] app-card px-4 text-sm font-semibold text-[#1a1410]">Login</button>}
        </div></div></div>
      <SignInDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} nextPath={pathname || '/feed'} />
    </div>
  )
}

"use client";

import Link from "next/link";
import { LogOut, MapPin, User, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { INDIA_HIGH_POTENTIAL_CITIES } from "@/lib/cities";
import { useCity } from "@/components/CityContext";
import { createClient } from "@/lib/supabase/client";
import { getUserAvatarUrl } from "@/lib/avatar";
import { SignInDialog } from "@/components/auth/SignInDialog";

const HIDE_TOP_NAV_ROUTES = ["/settings"];

type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  avatar_seed: string | null;
};

export function TopNav() {
  const pathname = usePathname();
  const { selectedCity, setSelectedCity } = useCity();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;

      if (!authUser) return setUser(null);

      const { data: profile } = await supabase
        .from("users")
        .select("name,avatar_url,avatar_seed")
        .eq("id", authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email || null,
        name: profile?.name || authUser.user_metadata?.name || null,
        avatar_url: profile?.avatar_url || null,
        avatar_seed: profile?.avatar_seed || null,
      });
    };

    loadUser();
  }, []);

  if (HIDE_TOP_NAV_ROUTES.includes(pathname)) return null;

  return (
    <div className="sticky top-0 z-30 border-b border-black/5 bg-[#faf8f4]/90 backdrop-blur-md">
      <div className="mx-auto max-w-md px-4 py-3">
        <div className="flex items-center justify-between">
          {/* LEFT: BRAND */}
          <div className="flex flex-col leading-tight">
            <p className="text-[10px] tracking-[0.25em] text-[#8b7b6d]">ZUNO</p>
            <p className="text-[15px] font-medium text-[#2b2b2b]">City plans</p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            {/* CITY SELECT */}
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-full bg-[#efe7da] px-3 py-1.5 text-[12px] font-medium text-[#2b2b2b]">
                <MapPin className="h-3.5 w-3.5 opacity-70" />

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="appearance-none bg-transparent pr-4 outline-none"
                >
                  {INDIA_HIGH_POTENTIAL_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                <ChevronDown className="h-3 w-3 opacity-60" />
              </div>
            </div>

            {/* USER */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="h-8 w-8 overflow-hidden rounded-full border border-black/5"
                >
                  <img
                    src={getUserAvatarUrl({
                      avatarUrl: user.avatar_url,
                      avatarSeed: user.avatar_seed,
                      fallbackSeed: user.id,
                    })}
                    alt="profile"
                    className="h-full w-full object-cover"
                  />
                </button>

                {/* DROPDOWN */}
                {showMenu && (
                  <div className="absolute right-0 top-12 z-[9999] w-[220px] rounded-2xl bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-black/5">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-[#2b2b2b]">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-[#8b7b6d]">{user.email}</p>
                    </div>

                    <div className="my-1 h-px bg-black/5" />

                    <Link
                      href={`/profile/${user.id}`}
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#2b2b2b] hover:bg-[#f3ebdf]"
                    >
                      <User className="h-3.5 w-3.5" />
                      Profile
                    </Link>

                    <button
                      onClick={async () => {
                        await createClient().auth.signOut();
                        setShowMenu(false);
                        window.location.href = "/feed";
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#9b2d20] hover:bg-[#fff0ec]"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthDialog(true)}
                className="rounded-full bg-[#1a1410] px-4 py-2 text-[13px] font-medium text-white"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      <SignInDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        nextPath={pathname || "/feed"}
      />
    </div>
  );
}

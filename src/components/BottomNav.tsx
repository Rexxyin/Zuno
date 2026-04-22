"use client";

import Link from "next/link";
import { Flame, Plus, Heart } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SignInDialog } from "@/components/auth/SignInDialog";

export function BottomNav({
  pendingRequestsCount,
}: {
  pendingRequestsCount?: number;
}) {
  const pathname = usePathname();
  const is = (p: string) => pathname.startsWith(p);
  const [autoPendingCount, setAutoPendingCount] = useState(0);
  const [isAuthed, setIsAuthed] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setIsAuthed(!!data.user))
      .catch(() => setIsAuthed(false));
  }, []);

  useEffect(() => {
    if (typeof pendingRequestsCount === "number") return;
    let cancelled = false;
    const loadPendingCount = async () => {
      const { data: auth } = await createClient().auth.getUser();
      if (!auth.user) return;
      const res = await fetch("/api/plans?includeMine=1", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      if (!Array.isArray(data) || cancelled) return;
      const hostedPending = data
        .filter((plan: any) => plan.host_id === auth.user?.id)
        .reduce(
          (sum: number, plan: any) =>
            sum +
            (plan.participants || []).filter((p: any) => p.status === "pending")
              .length,
          0,
        );
      setAutoPendingCount(hostedPending);
    };
    loadPendingCount();
    return () => {
      cancelled = true;
    };
  }, [pendingRequestsCount]);

  const resolvedPendingCount = useMemo(
    () =>
      typeof pendingRequestsCount === "number"
        ? pendingRequestsCount
        : autoPendingCount,
    [autoPendingCount, pendingRequestsCount],
  );

  const navItems = [
    { href: "/feed", icon: Flame, label: "Discover", active: is("/feed") },
    {
      href: "/my-plans",
      icon: Heart,
      label: "My Plans",
      active: is("/my-plans"),
      badge: resolvedPendingCount,
    },
  ];

  return (
    <nav
      className="fixed bottom-3 left-0 right-0 z-50 px-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-md ">
        {/* FLOATING BAR */}
        <div className="relative flex items-center justify-between rounded-2xl bg-[#faf8f4]/90 backdrop-blur-xl border border-black/5 px-10 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          {/* LEFT + RIGHT NAV */}
          {navItems.map((item: any) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-[2px] px-2 py-1"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  item.active ? "bg-[#1a1410] text-white" : "text-[#8f8272]"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
              </div>

              <span
                className={`text-[10px] ${
                  item.active ? "text-[#1a1410]" : "text-[#8f8272]"
                }`}
              >
                {item.label}
              </span>

              {!!item.badge && (
                <span className="absolute -right-1 top-0 rounded-full bg-red-600 px-1.5 text-[9px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* CENTER CTA */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <button
              type="button"
              onClick={() => {
                if (!isAuthed) {
                  setShowAuthDialog(true);
                  return;
                }
                window.location.href = "/plans/create";
              }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-[0_8px_20px_rgba(212,82,42,0.4)] active:scale-[0.96]"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
      <SignInDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        nextPath={pathname || "/feed"}
      />
    </nav>
  );
}

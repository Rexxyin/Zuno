"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { PlanCard } from "@/components/PlanCard";
import { BottomNav } from "@/components/BottomNav";
import { Lock, Search } from "lucide-react";
import type { Plan, PlanCategory } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useCity } from "@/components/CityContext";
import { normalizeCityKey } from "@/lib/cities";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { SignInDialog } from "@/components/auth/SignInDialog";
import Link from "next/link";
import { computeEffectivePlanStatus } from "@/lib/plan";
import { PlanCardSkeleton } from "@/components/PlanCardSkeleton";

export default function FeedPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { selectedCity } = useCity();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/plans", { cache: "no-store" });
      const data = await response.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    createClient()
      .auth.getUser()
      .then(({ data }) => setIsAuthed(!!data.user));
  }, []);

  const categories = Object.keys(CATEGORY_META) as PlanCategory[];

  const filteredPlans = useMemo(
    () =>
      plans
        .filter((p) => p.visibility === "public")
        .filter((p) =>
          selectedCategory ? p.category === selectedCategory : true,
        )
        .filter(
          (p) => normalizeCityKey(p.city) === normalizeCityKey(selectedCity),
        )
        .filter((p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .filter((p) => computeEffectivePlanStatus(p as any) !== "expired")
        .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime)),
    [plans, selectedCategory, selectedCity, searchQuery],
  );

  const visiblePlans = isAuthed ? filteredPlans : filteredPlans.slice(0, 5);
  const lockedCount = Math.max(filteredPlans.length - 5, 0);

  const toggleFavorite = async (plan: Plan) => {
    if (!isAuthed) return;
    const method = plan.is_favorite ? "DELETE" : "POST";
    setPlans((prev) =>
      prev.map((p) =>
        p.id === plan.id ? { ...p, is_favorite: !p.is_favorite } : p,
      ),
    );
    const res = await fetch(`/api/plans/${plan.id}/favorite`, { method });
    if (!res.ok)
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id ? { ...p, is_favorite: !!plan.is_favorite } : p,
        ),
      );
  };

  return (
    <div
      className="min-h-screen pb-24 bg-[#F4EFEA]"
      style={{ fontFamily: "DM Sans, Inter, sans-serif" }}
    >
      <Suspense fallback={null}>
        <SearchParamHandler onSignin={() => setShowAuthDialog(true)} />
      </Suspense>

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#F4EFEA]">
        <div className="mx-auto max-w-md px-4 pt-5 pb-3">
          <div className="mb-4">
            <h1 className="text-[22px] font-semibold text-[#3A2E2A] tracking-[-0.01em]">
              Discover plans
            </h1>
            <p className="mt-1 text-[13px] text-[#7A6A64]">
              Join something nearby or create your own plans.
            </p>
          </div>

          {/* SEARCH */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8272]" />
            <input
              type="text"
              placeholder="Search plans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-[#EFE7DA] py-2.5 pl-9 pr-3 text-[13px] outline-none placeholder:text-[#9C8F88]"
            />
          </div>
        </div>

        {/* CATEGORY PILLS */}
        <div className="border-b bg-[#f9f9f9]">
          <div className="mx-auto max-w-md px-4 py-3">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap ${
                  selectedCategory === null
                    ? "bg-[#5A3825] text-white"
                    : "bg-[#EFE7DA] text-[#5A3825]"
                }`}
              >
                All
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-[#5A3825] text-white"
                      : "bg-[#EFE7DA] text-[#5A3825]"
                  }`}
                >
                  <CategoryIcon
                    icon={CATEGORY_META[cat].icon}
                    className="h-3.5 w-3.5"
                  />
                  {CATEGORY_META[cat].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEED */}
      <div className="mx-auto max-w-md px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
        ) : visiblePlans.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-[13px] text-[#7A6A64]">
              No plans around you yet.
            </p>

            <Link
              href="/plans/create"
              className="mt-4 inline-flex rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-2.5 text-[13px] font-semibold text-white"
            >
              Create your first plan
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onToggleFavorite={() => toggleFavorite(plan)}
                isAuthed={isAuthed}
              />
            ))}
          </div>
        )}

        {/* LOCK */}
        {!isAuthed && filteredPlans.length > 5 && (
          <div className="mt-5 text-center">
            <button
              onClick={() => setShowAuthDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#5A3825] px-4 py-2 text-[13px] text-white"
            >
              <Lock className="h-4 w-4" />
              Unlock {lockedCount} more
            </button>
          </div>
        )}
      </div>

      <SignInDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        nextPath="/feed"
      />
      {isAuthed && <BottomNav />}
    </div>
  );
}

function SearchParamHandler({ onSignin }: { onSignin: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("auth") === "required") onSignin();
  }, [searchParams, onSignin]);
  return null;
}

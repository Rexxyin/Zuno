"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { PlanCard } from "@/components/PlanCard";
import { BottomNav } from "@/components/BottomNav";
import { Lock, MapPin, Search } from "lucide-react";
import type { Plan, PlanCategory } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useCity } from "@/components/CityContext";
import { normalizeCityKey } from "@/lib/cities";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { SignInDialog } from "@/components/auth/SignInDialog";

/* ---------- MAIN COMPONENT ---------- */
export default function FeedPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<PlanCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { selectedCity } = useCity();

  /* ---------- FETCH ---------- */
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/plans");
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

  /* ---------- FILTERING ---------- */
  const categories = Object.keys(CATEGORY_META) as PlanCategory[];

  const filteredPlans = useMemo(
    () =>
      plans
        .filter((p) =>
          selectedCategory ? p.category === selectedCategory : true
        )
        .filter(
          (p) =>
            normalizeCityKey(p.city) ===
            normalizeCityKey(selectedCity)
        )
        .filter((p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort(
          (a, b) =>
            +new Date(a.datetime) - +new Date(b.datetime)
        ),
    [plans, selectedCategory, selectedCity, searchQuery]
  );

  const visiblePlans = isAuthed
    ? filteredPlans
    : filteredPlans.slice(0, 5);

  const lockedCount = Math.max(filteredPlans.length - 5, 0);

  /* ---------- FAVORITE ---------- */
  const toggleFavorite = async (plan: Plan) => {
    if (!isAuthed) return;

    const method = plan.is_favorite ? "DELETE" : "POST";

    setPlans((prev) =>
      prev.map((p) =>
        p.id === plan.id
          ? { ...p, is_favorite: !p.is_favorite }
          : p
      )
    );

    const res = await fetch(
      `/api/plans/${plan.id}/favorite`,
      { method }
    );

    if (!res.ok) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id
            ? { ...p, is_favorite: !!plan.is_favorite }
            : p
        )
      );
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen pb-24">

      {/* ✅ FIXED SEARCH PARAM HANDLER */}
      <Suspense fallback={null}>
        <SearchParamHandler
          onSignin={() => setShowAuthDialog(true)}
        />
      </Suspense>

      {/* HEADER */}
      <div className="sticky top-0 z-40 border-b app-card app-surface pb-3 pt-4">
        <div className="mx-auto max-w-md px-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-[#1a1410]">
              Discover
            </h1>

            <div className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] app-card px-2.5 py-1.5 text-xs font-semibold text-[#1a1410]">
              <MapPin className="h-3.5 w-3.5" />
              {selectedCity}
            </div>
          </div>

          {/* SEARCH */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8272]" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              className="w-full rounded-xl border app-card bg-[#f5efe5] py-2.5 pl-9 pr-3 text-sm"
            />
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div className="border-b bg-[#f5efe6]">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                selectedCategory === null
                  ? "bg-black text-white"
                  : "bg-white"
              }`}
            >
              All
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  selectedCategory === cat
                    ? "bg-[#d4522a] text-white"
                    : "bg-white"
                }`}
              >
                {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="mx-auto max-w-md px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-lg app-card"
              />
            ))}
          </div>
        ) : visiblePlans.length === 0 ? (
          <p className="text-center py-10">
            No plans yet
          </p>
        ) : (
          <div className="grid gap-3">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onToggleFavorite={() =>
                  toggleFavorite(plan)
                }
                isAuthed={isAuthed}
              />
            ))}
          </div>
        )}

        {/* LOCKED */}
        {!isAuthed && filteredPlans.length > 5 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAuthDialog(true)}
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              <Lock className="inline h-4 w-4 mr-1" />
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

/* ---------- SEARCH PARAM HANDLER ---------- */
function SearchParamHandler({
  onSignin,
}: {
  onSignin: () => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signin") === "1") {
      onSignin();
    }
  }, [searchParams, onSignin]);

  return null;
}
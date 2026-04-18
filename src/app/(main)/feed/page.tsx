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
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { selectedCity } = useCity();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/plans", { cache: 'no-store' });
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
    createClient().auth.getUser().then(({ data }) => setIsAuthed(!!data.user));
  }, []);

  const categories = Object.keys(CATEGORY_META) as PlanCategory[];

  const filteredPlans = useMemo(
    () =>
      plans
        .filter((p) => p.visibility === 'public')
        .filter((p) => selectedCategory ? p.category === selectedCategory : true)
        .filter((p) => normalizeCityKey(p.city) === normalizeCityKey(selectedCity))
        .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((p) => computeEffectivePlanStatus(p as any) !== 'expired')
        .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime)),
    [plans, selectedCategory, selectedCity, searchQuery]
  );

  const visiblePlans = isAuthed ? filteredPlans : filteredPlans.slice(0, 5);
  const lockedCount = Math.max(filteredPlans.length - 5, 0);

  const toggleFavorite = async (plan: Plan) => {
    if (!isAuthed) return;
    const method = plan.is_favorite ? "DELETE" : "POST";
    setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, is_favorite: !p.is_favorite } : p));
    const res = await fetch(`/api/plans/${plan.id}/favorite`, { method });
    if (!res.ok) setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, is_favorite: !!plan.is_favorite } : p));
  };

  return (
    <div className="min-h-screen pb-24">
      <Suspense fallback={null}><SearchParamHandler onSignin={() => setShowAuthDialog(true)} /></Suspense>

      <div className="sticky top-0 z-40 border-b app-card app-surface pb-3 pt-4 overflow-visible">
        <div className="mx-auto max-w-md px-4 overflow-visible">
          <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-extrabold text-[#1a1410]">Discover</h1></div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8272]" />
            <input type="text" placeholder="Search plans..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-xl border app-card bg-[#f5efe5] py-2.5 pl-9 pr-3 text-sm" />
          </div>
        </div>
      </div>

      <div className="border-b bg-[#f5efe6]"><div className="mx-auto max-w-md px-4 py-3"><div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelectedCategory(null)} className={`rounded-full px-3 py-1 text-xs font-bold ${selectedCategory === null ? "bg-black text-white" : "bg-white"}`}>All</button>
        {categories.map((cat) => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${selectedCategory === cat ? "bg-[#d4522a] text-white" : "bg-white"}`}><CategoryIcon icon={CATEGORY_META[cat].icon} className="h-3.5 w-3.5" />{CATEGORY_META[cat].label}</button>)}
      </div></div></div>

      <div className="mx-auto max-w-md px-4 py-4">
        {loading ? <div className="space-y-3">{[1, 2, 3].map((i) => <PlanCardSkeleton key={i} />)}</div> : visiblePlans.length === 0 ? <div className="py-12 text-center"><p className="text-sm text-[#75685c]">No plans around you yet.</p><Link href="/plans/create" className="mt-4 inline-flex rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">Create a plan today ✨</Link></div> : <div className="grid gap-3">{visiblePlans.map((plan) => <PlanCard key={plan.id} plan={plan} onToggleFavorite={() => toggleFavorite(plan)} isAuthed={isAuthed} />)}</div>}
        {!isAuthed && filteredPlans.length > 5 && <div className="mt-4 text-center"><button onClick={() => setShowAuthDialog(true)} className="bg-black text-white px-4 py-2 rounded-lg"><Lock className="inline h-4 w-4 mr-1" />Unlock {lockedCount} more</button></div>}
      </div>

      <SignInDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} nextPath="/feed" />
      {isAuthed && <BottomNav />}
    </div>
  );
}

function SearchParamHandler({ onSignin }: { onSignin: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => { if (searchParams.get('auth') === 'required') onSignin() }, [searchParams, onSignin]);
  return null;
}

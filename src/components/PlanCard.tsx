"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Heart,
  CheckCircle2,
  Share2,
  Clock3,
  MapPin,
  Users,
  Calendar,
  Lock,
  Mountain,
  Utensils,
  Music,
  Bike,
  Palette,
  Plane,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Plan } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { parseDatetimeLocal, formatDate, formatTime } from "@/lib/datetime";

/* ---------- ICON MAP ---------- */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  mountain: Mountain,
  utensils: Utensils,
  music: Music,
  bike: Bike,
  palette: Palette,
  plane: Plane,
  trophy: Trophy,
  sparkles: Sparkles,
};

/* ---------- MAIN ---------- */
export function PlanCard({
  plan,
  onToggleFavorite,
  isAuthed,
}: {
  plan: Plan;
  onToggleFavorite?: () => void;
  isAuthed?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!plan) return null;

  const planDate = plan.datetime ? parseDatetimeLocal(plan.datetime) : new Date();
  const userHasJoined = !!plan.is_joined;
  const isHost = plan.current_user_id && plan.host_id === plan.current_user_id;

  const categoryMeta = CATEGORY_META[plan.category as keyof typeof CATEGORY_META] || {
    label: "Plan",
    icon: "sparkles",
  };
  const CategoryIcon = ICON_MAP[categoryMeta.icon];

  /* ✅ ORIGINAL LOGIC (FIXED) */
  const joinedParticipants = (plan.participants || []).filter((p: any) => p.status === "joined").length;
  const spotsLeft = Math.max((plan.max_people || 1) - joinedParticipants, 0);
  const isExpired = +new Date(plan.datetime) < Date.now();
  const isClosed = plan.status === "completed" || plan.status === "cancelled";

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/plans/${plan.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: plan.title,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const participantNames = plan.participants?.map(p => p.user?.name || '').filter(Boolean) || [];

  return (
    <Link href={`/plans/${plan.id}`} className="block group">
      <div className="overflow-hidden rounded-3xl border border-[rgba(26,20,16,0.08)] bg-white transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]">

        {/* IMAGE */}
        <div 
          className="relative h-44 w-full overflow-hidden bg-[#e6ded2]"
          style={{
            backgroundImage: `url(${plan.image_url || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <img
            src={plan.image_url || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800"}
            alt={plan.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />

          {/* ✅ CATEGORY BADGE (RESTORED) */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#faf8f4] px-3 py-1.5 text-[11px] text-[#1a1410] shadow-sm">
            <CategoryIcon className="h-3.5 w-3.5" />
            {categoryMeta.label}
          </div>

          {/* FAVORITE */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm"
          >
            <Heart
              className={`h-4 w-4 ${
                plan.is_favorite
                  ? "fill-[#d4522a] text-[#d4522a]"
                  : "text-[#5a4e42]"
              }`}
            />
          </button>

          {/* ✅ PRIVATE BADGE (LIKE BEFORE) */}
          {plan.visibility === "private" && (
            <div className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-[#1a1410] px-2.5 py-1 text-[10px] text-white">
              <Lock className="h-3 w-3" />
              Private
            </div>
          )}
          {(isExpired || isClosed) && (
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
              {isExpired ? "Expired" : "Closed"}
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4">
          <h3 className="text-[17px] font-extrabold text-[#1a1410] line-clamp-1">
            {plan.title}
          </h3>

          <p className="mt-1 text-[13px] text-[#8a7e72] line-clamp-1">
            {plan.description || "No description"}
          </p>

          {/* META */}
          <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#6e6258]">
            <Meta icon={Calendar}>
              {formatDate(planDate)}
            </Meta>

            <Dot />

            <Meta icon={Clock3}>
              {formatTime(planDate)}
            </Meta>

            <Dot />

            {/* ✅ ALWAYS VISIBLE SPOTS */}
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#fdf0eb] px-2 py-0.5 text-[11.5px] font-bold text-[#b34318]">
              <Users className="h-3 w-3" />
              {spotsLeft} spots left
            </span>
          </div>

          {/* LOCATION */}
          {plan.location_name && (
            <p className="mt-2 flex items-center gap-1 text-[12.5px] text-[#7a6e62]">
              <MapPin className="h-3 w-3" />
              {plan.location_name}
            </p>
          )}

          <Divider />

          {/* BOTTOM */}
          <div className="flex items-center justify-between">
            <AvatarStack names={participantNames} />

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className={`rounded-xl p-2 ${
                  copied
                    ? "bg-green-100 text-green-600"
                    : "bg-[#f0e8dc] text-[#5a4e42]"
                }`}
              >
                <Share2 className="h-4 w-4" />
              </button>

              {isHost ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#4a3a2f] px-4 py-2 text-[13px] font-bold text-white">
                  Hosting
                </span>
              ) : userHasJoined ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Joined
                </span>
              ) : (
                <button disabled={isExpired || isClosed} className="rounded-full bg-[#1a1410] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40">
                  {plan.visibility === "private" ? "Request" : "Join"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function Meta({ icon: Icon, children }: any) {
  return (
    <span className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

function Dot() {
  return <span className="text-[#c8bfb3]">·</span>;
}

function Divider() {
  return <div className="my-3 h-px bg-[rgba(26,20,16,0.07)]" />;
}

function AvatarStack({ names }: { names: string[] }) {
  const visible = names.slice(0, 3);
  const extra = names.length - visible.length;
  const tones = ["bg-[#ffd8c7]", "bg-[#d7e7ff]", "bg-[#d7f5e8]"];

  return (
    <div className="flex items-center">
      {visible.map((name, i) => (
        <div
          key={i}
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white ${tones[i % tones.length]} text-[11px] font-bold text-[#5a4e42] -ml-2 first:ml-0`}
        >
          {getInitials(name)}
        </div>
      ))}
      {extra > 0 && (
        <span className="ml-1 text-xs text-[#6e6258]">+{extra}</span>
      )}
    </div>
  );
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.split(" ");
  return parts.length === 1
    ? parts[0][0]
    : parts[0][0] + parts[1][0];
}

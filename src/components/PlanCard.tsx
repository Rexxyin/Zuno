"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Share2, Users } from "lucide-react";
import { Plan } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { parseDatetimeLocal, formatDate, formatTime } from "@/lib/datetime";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  computeEffectivePlanStatus,
  getJoinedParticipantsCount,
  getParticipantCapacity,
  normalizeVisibility,
  statusBadge,
} from "@/lib/plan";
import { buildDicebearAvatarUrl, generateAvatarSeed } from "@/lib/avatar";

const AVATAR_COLORS = [
  "#FED7AA",
  "#DBEAFE",
  "#DCFCE7",
  "#F5D0FE",
  "#FDE68A",
  "#BFDBFE",
  "#FBCFE8",
  "#DDD6FE",
];

export function PlanCard({
  plan,
  onToggleFavorite,
}: {
  plan: Plan;
  onToggleFavorite?: () => void;
  isAuthed?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!plan) return null;

  const planDate = plan.datetime
    ? parseDatetimeLocal(plan.datetime)
    : new Date();
  const joinedParticipants = (plan.participants || []).filter(
    (p: any) => p.status === "joined",
  );
  const joinedCount = getJoinedParticipantsCount(plan.participants);
  const genderAggregate = joinedParticipants.reduce((acc: any, p: any) => {
    const g = String(p.user?.gender || '').toLowerCase();
    if (g === 'male') acc.male += 1;
    else if (g === 'female') acc.female += 1;
    return acc;
  }, { male: 0, female: 0 });
  const participantCapacity = getParticipantCapacity(plan);
  const spotsLeft = Math.max(participantCapacity - joinedCount, 0);
  const effectiveStatus = computeEffectivePlanStatus(plan as any);
  const badge = statusBadge(effectiveStatus);
  const visibility = normalizeVisibility(plan.visibility);

  const isHost = plan.current_user_id && plan.host_id === plan.current_user_id;
  const userHasJoined = !!plan.is_joined;

  const scarcity =
    spotsLeft === 1
      ? { text: "Last spot!", cls: "text-red-600" }
      : spotsLeft <= 3
        ? { text: `${spotsLeft} spots left`, cls: "text-amber-700" }
        : null;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/plans/${plan.id}`;

    if (navigator.share)
      navigator.share({
        title: plan.title,
        text: `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`,
        url: shareUrl,
      });
    else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <Link href={`/plans/${plan.id}`} className="block group">
      <div className="overflow-hidden rounded-3xl border border-[rgba(26,20,16,0.08)] bg-white transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="relative h-44 w-full overflow-hidden bg-[#e6ded2]">
          <img
            src={
              plan.image_url ||
              "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800"
            }
            alt={plan.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#faf8f4] px-3 py-1 text-[11px] font-semibold text-[#1a1410]">
            <CategoryIcon
              icon={
                CATEGORY_META[plan.category as keyof typeof CATEGORY_META]
                  ?.icon || "sparkles"
              }
              className="h-3 w-3"
            />
            {CATEGORY_META[plan.category as keyof typeof CATEGORY_META]
              ?.label || "Plan"}
          </div>
          {(visibility === "invite_only" || visibility === "private") && (
            <div className="absolute left-3 bottom-3 rounded-full bg-[#1a1410] px-2.5 py-1 text-[10px] text-white">
              {visibility === "private" ? "Private" : "Invite only"}
            </div>
          )}
          {plan.female_only && (
            <div className="absolute right-3 bottom-3 rounded-full bg-pink-100 px-2.5 py-1 text-[10px] font-semibold text-pink-700">
              Women only
            </div>
          )}
          {badge && (
            <div
              className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge.className}`}
            >
              {badge.text}
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className="absolute right-3 bottom-3 rounded-full bg-white/90 p-2 shadow-sm"
          >
            <Heart
              className={`h-4 w-4 ${plan.is_favorite ? "fill-[#d4522a] text-[#d4522a]" : "text-[#5a4e42]"}`}
            />
          </button>
        </div>

        <div className="p-4">
          <h3 className="text-[17px] font-extrabold text-[#1a1410] line-clamp-1">
            {plan.title}
          </h3>
          <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#6e6258]">
            <span>{formatDate(planDate)}</span>·
            <span>{formatTime(planDate)}</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-lg bg-[#fdf0eb] px-2 py-0.5 text-[11.5px] font-bold text-[#b34318]">
              <Users className="h-3 w-3" />
              {spotsLeft} spots left
            </span>
          </div>
          {scarcity && effectiveStatus === "open" && (
            <p className={`mt-1 text-xs font-semibold ${scarcity.cls}`}>
              {scarcity.text}
            </p>
          )}
          {(genderAggregate.male + genderAggregate.female) > 0 && (
            <p className="mt-1 text-[11px] text-[#8a7a70]">
              {genderAggregate.male} men • {genderAggregate.female} women
            </p>
          )}

          <div className="my-3 h-px bg-[rgba(26,20,16,0.07)]" />

          <div className="flex items-center justify-between">
            <AvatarStack participants={joinedParticipants as any[]} />
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className={`rounded-xl p-2 ${copied ? "bg-green-100 text-green-600" : "bg-[#f0e8dc] text-[#5a4e42]"}`}
              >
                <Share2 className="h-4 w-4" />
              </button>
              {isHost ? (
                <span className="rounded-full bg-[#4a3a2f] px-4 py-2 text-[13px] font-bold text-white">
                  Hosting
                </span>
              ) : userHasJoined ? (
                <span className="rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white">
                  Joined
                </span>
              ) : (
                <button
                  disabled={effectiveStatus !== "open" || spotsLeft === 0}
                  className="rounded-full bg-[#1a1410] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
                >
                  {effectiveStatus === "open"
                    ? visibility === "invite_only"
                      ? "Join"
                      : "Join"
                    : badge?.text || "Closed"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AvatarStack({ participants }: { participants: any[] }) {
  if (!participants.length)
    return <p className="text-xs text-[#8a7e72]">Be the first to join</p>;
  const visible = participants.slice(0, 4);
  const extra = participants.length - visible.length;
  return (
    <div className="flex items-center">
      {visible.map((p, i) => {
        const id = p.user_id || String(i);
        const name = p.user?.name || "U";
        const color =
          AVATAR_COLORS[Math.abs(hashCode(id)) % AVATAR_COLORS.length];
        const seed = generateAvatarSeed();
        return (
          <div
            key={id}
            className="-ml-2 first:ml-0 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white text-[11px] font-bold text-[#5a4e42]"
            style={{ background: color }}
          >
            <img
              src={buildDicebearAvatarUrl(seed)}
              alt="profile"
              className="h-full w-full object-cover"
            />
          </div>
        );
      })}
      {extra > 0 && (
        <span className="ml-1 text-xs text-[#6e6258]">+{extra} more</span>
      )}
    </div>
  );
}

function hashCode(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h << 5) - h + value.charCodeAt(i);
  return h;
}

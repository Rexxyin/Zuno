import Image from "next/image";
import Link from "next/link";
import { Plan } from "@/lib/types";
import {
  Heart,
  CheckCircle2,
  Share2,
  Clock3,
  MapPin,
  Lock,
  ArrowRight,
} from "lucide-react";
import { CATEGORY_META } from "@/lib/categories";
import { CategoryIcon } from "./CategoryIcon";
import { useState } from "react";
import { AvatarStack } from "./AvatarStack";

export function PlanCard({
  plan,
  onToggleFavorite,
  isAuthed = true,
}: {
  plan: Plan;
  onToggleFavorite?: () => void;
  isAuthed?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!plan) return null;

  const planDate = plan.datetime ? new Date(plan.datetime) : new Date();
  const category = CATEGORY_META[plan.category];
  const userHasJoined = !!plan.is_joined;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/plans/${plan.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: plan.title,
          text: plan.description || `Join ${plan.title} on Zuno`,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled native share; no-op
    }
  };

  return (
    <Link href={`/plans/${plan.id}`} className="block group">
      <div className="overflow-hidden rounded-[28px] border-2 border-[#d8cbb8] app-card shadow-[0_4px_18px_rgba(26,20,16,0.05)] transition-all duration-200 hover:shadow-[0_8px_26px_rgba(26,20,16,0.09)]">
        <div className="relative h-44 w-full overflow-hidden bg-[#e6ded2]">
          <img
            src={
              plan.image_url ||
              "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800"
            }
            alt={plan.title}
            className="object-center transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 390px) 100vw, 390px"
          />

          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#faf8f4] px-3 py-1.5 text-[11px] text-[#1a1410] shadow-sm">
            <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" />{" "}
            {category.label}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className="absolute right-3 top-3 rounded-full bg-[#faf8f4] p-2 text-[#8f8272] shadow-sm transition-colors hover:text-[#d4522a]"
            aria-label="toggle favorite"
          >
            <Heart
              className={`h-4 w-4 ${plan.is_favorite ? "fill-[#d4522a] text-[#d4522a]" : ""}`}
            />
          </button>

          {plan.visibility === "private" && (
            <div className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-[#1a1410] px-2.5 py-1 text-[10px] text-[#faf8f4]">
              <Lock className="h-3 w-3" /> Private
            </div>
          )}
        </div>

        <div className="space-y-2.5 p-4">
          <h3 className="text-[16px] leading-none tracking-[-0.02em] text-[#1a1410]">
            {plan.title}
          </h3>
          <p className="line-clamp-1 text-sm text-[#8f8272]">
            {plan.description || "No description provided."}
          </p>

          <p className="text-[15px] text-[#5a4e42]">
            {planDate.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
            <span className="mx-2 text-[#b8aa99]">•</span>
            {planDate.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
            <span className="mx-2 text-[#b8aa99]">•</span>
            <span className="text-[#d4522a]">
              {Math.max(
                (plan.max_people || 1) -
                  (((plan as any).joined_names?.length || 0) + 1),
                0,
              )}{" "}
              spots left
            </span>
          </p>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 inline-flex items-center gap-1 text-sm text-[#5a4e42]">
                <MapPin className="h-3.5 w-3.5" />
                {plan.location_name}
              </p>
              {/* <p className="line-clamp-1 text-xs font-medium text-[#1a1410]">
                Host: {plan.host?.name?.split(" ")[0] || "Host"}
              </p> */}
            </div>

            {!userHasJoined &&
              (isAuthed ? (
                <button className="inline-flex items-center gap-1 rounded-full bg-[#1a1410] px-4 py-2 text-sm text-[#faf8f4]">
                  Join{" "}
                </button>
              ) : (
                <a
                  href="/login?next=/feed"
                  className="inline-flex items-center gap-1 rounded-full bg-[#1a1410] px-5 py-2.5 text-lg text-[#faf8f4]"
                >
                  Join <ArrowRight className="h-5 w-5" />
                </a>
              ))}
            {userHasJoined && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4" /> Joined
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-between">
            <span>
              {!!(plan as any).joined_names?.length && (
                <AvatarStack names={(plan as any).joined_names} />
              )}
            </span>
            <button
              type="button"
              onClick={handleShare}
              className={`rounded-xl p-2 transition-all ${copied ? "bg-[#e8f3e8] text-[#2d7a2d]" : "bg-[#efe8dc] text-[#5a4e42] hover:bg-[#e4ddd1]"}`}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

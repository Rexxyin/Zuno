import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PlanDetailClient from "./PlanDetailClient";
import { createClient } from "@/lib/supabase/server";
import { computeEffectivePlanStatus, normalizeVisibility } from "@/lib/plan";
import { hasBlockBetween } from "@/lib/server/safety";
import { parseDatetimeLocal, formatDateTime } from "@/lib/datetime";
import { getParticipantCapacity } from "@/lib/plan";
import { getJoinedParticipantsCount } from "@/lib/plan";
const SITE_URL = "https://zunoplan.vercel.app";

// ─── Helpers ────────────────────────────────────────────────────

/** Build a punchy OG title: no description, just the key facts */
function buildOgTitle(plan: {
  title: string;
  datetime: string;
  city?: string | null;
}) {
  const date = new Date(plan.datetime).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const parts = [plan.title];
  if (plan.city) parts.push(plan.city);
  parts.push(date);
  return parts.join(" · ");
}

// ─── Metadata ────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>; // ← Promise type
}): Promise<Metadata> {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: plan, error } = await supabase
    .from("plans")
    .select(
      `
      id, title, category, datetime, city, location_name, max_people, image_url,
      host:users!plans_host_id_fkey(name),
      participants:plan_participants(status)
    `,
    )
    .eq("id", id)
    .single();
  if (error) console.error("OG metadata fetch failed:", error.message);

  if (!plan) return { title: "Plan not found" };

  const joined = (plan.participants || []).filter(
    (p: any) => p.status === "joined",
  ).length;
  const ogTitle = buildOgTitle({
    title: plan.title,
    datetime: plan.datetime,
    city: (plan as any).city,
  });

  const spotsLeft = Math.max((plan.max_people || 0) - joined, 0);
  const ogDescription = `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left · Good vibes, real plan.`;
  const planDate = parseDatetimeLocal(plan.datetime);

  const participantCapacity = getParticipantCapacity(plan as any);
  const joinedCount = getJoinedParticipantsCount(plan.participants);
  const spotsOpen = Math.max(participantCapacity - joinedCount, 0);

  const ogImage = `${SITE_URL}/api/og?title=${encodeURIComponent(plan.title)}&city=${encodeURIComponent(plan.city || "")}&date=${encodeURIComponent(formatDateTime(planDate))}&spots=${spotsOpen}`;

  const planUrl = `${SITE_URL}/plans/${plan.id}`;

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      type: "website",
      url: planUrl,
      title: ogTitle,
      description: ogDescription,
      siteName: "Zuno",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: plan.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export default async function Page({ params }: any) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: auth } = await supabase.auth.getUser();

  const { data: plan } = await supabase
    .from("plans")
    .select(
      "*, host:users!plans_host_id_fkey(id,name,avatar_url,gpay_link,instagram_url,upi_payee_name)",
    )
    .eq("id", id)
    .single();
  if (!plan) return notFound();

  const { data: participants } = await supabase
    .from("plan_participants")
    .select(
      "user_id,status,removed_by_host,removed_by_host_at,removed_by_host_user_id,user:users!plan_participants_user_id_fkey(id,name,avatar_url,gender)",
    )
    .eq("plan_id", id)
    .eq("status", "joined");
  const { data: settlements } = await supabase
    .from("expense_settlements")
    .select("user_id,settled,settled_at")
    .eq("plan_id", id);

  const { data: myMembership } = auth.user
    ? await supabase
        .from("plan_participants")
        .select("removed_by_host,status")
        .eq("plan_id", id)
        .eq("user_id", auth.user.id)
        .maybeSingle()
    : { data: null };

  if (
    auth.user?.id &&
    (await hasBlockBetween(supabase, auth.user.id, plan.host_id))
  ) {
    return notFound();
  }
  const isParticipant = Boolean(
    (participants || []).some((p: any) => p.user_id === auth.user?.id),
  );
  const isHost = auth.user?.id === plan.host_id;
  const effectiveStatus = computeEffectivePlanStatus({ ...plan, participants });
  const visibility = normalizeVisibility(plan.visibility);

  if (visibility === "private" && !(isParticipant || isHost)) return notFound();
  // Invite-only plans are hidden from public feed, but accessible via direct link.
  if (effectiveStatus === "expired" && !(isParticipant || isHost))
    return notFound();

  const { data: favorites } = auth.user
    ? await supabase
        .from("plan_favorites")
        .select("plan_id")
        .eq("plan_id", id)
        .eq("user_id", auth.user.id)
        .maybeSingle()
    : { data: null };
  const { data: currentUser } = auth.user
    ? await supabase
        .from("users")
        .select("gender")
        .eq("id", auth.user.id)
        .maybeSingle()
    : { data: null };

  const safePlan = JSON.parse(
    JSON.stringify({
      ...plan,
      visibility,
      status: effectiveStatus,
      require_approval: !!plan.approval_mode,
      participants: participants || [],
      settlements: settlements || [],
      is_joined: isParticipant,
      is_favorite: Boolean(favorites),
      current_user_id: auth.user?.id || null,
      current_user_gender: currentUser?.gender || null,
      removed_by_host_for_current_user:
        !!myMembership?.removed_by_host && myMembership?.status === "left",
    }),
  );

  return <PlanDetailClient initialPlan={safePlan} />;
}

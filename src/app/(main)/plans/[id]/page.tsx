import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PlanDetailClient from "./PlanDetailClient";
import { createClient } from "@/lib/supabase/server";
import { computeEffectivePlanStatus, normalizeVisibility } from "@/lib/plan";

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dojdqt19w/image/upload/v1776621170/Adobe_Express_-_file_tjw0sa.jpg";
const SITE_URL = "https://zunoplan.vercel.app";

// ─── Helpers ────────────────────────────────────────────────────

function formatShareDate(datetime: string) {
  return new Date(datetime).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

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

function resolveOgImage(imageUrl?: string | null) {
  if (!imageUrl) return FALLBACK_IMAGE;
  try {
    const parsed = new URL(imageUrl);
    if (parsed.pathname.includes("/storage/v1/object/sign/")) {
      parsed.pathname = parsed.pathname.replace(
        "/storage/v1/object/sign/",
        "/storage/v1/object/public/",
      );
      parsed.search = "";
    }
    return parsed.toString();
  } catch {
    return imageUrl || FALLBACK_IMAGE;
  }
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
  const host = Array.isArray(plan.host) ? plan.host[0] : plan.host;

  const ogTitle = buildOgTitle({
    title: plan.title,
    datetime: plan.datetime,
    city: (plan as any).city,
  });

  const ogDescription = "Good vibes, real plan. Your spot is waiting.🌻";

  // Use the plan's own image directly — no processing, no edge function
  // Instead of signed URL, use the public URL directly:
  const ogImage = resolveOgImage(plan.image_url);

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
      "user_id,status,user:users!plan_participants_user_id_fkey(id,name,avatar_url)",
    )
    .eq("plan_id", id)
    .eq("status", "joined");
  const { data: settlements } = await supabase
    .from("expense_settlements")
    .select("user_id,settled,settled_at")
    .eq("plan_id", id);
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
    }),
  );

  return <PlanDetailClient initialPlan={safePlan} />;
}

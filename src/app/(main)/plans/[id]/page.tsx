import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import PlanDetailClient from "./PlanDetailClient";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { id } = await params;

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data: plan, error } = await supabase.from("plans").select("title,description").eq("id", id).single();

  if (!plan || error) {
    return { title: "Plan not found" };
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  let baseUrl = configuredSiteUrl;

  if (!baseUrl) {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    const forwardedProto = headerList.get("x-forwarded-proto");
    const protocol = host?.includes("localhost") ? "http" : "https";
    baseUrl = host ? `${forwardedProto || protocol}://${host}` : "https://zunoplan.vercel.app";
  }

  const ogImageUrl = `${baseUrl}/plans/${id}/opengraph-image`;
  const canonicalUrl = `${baseUrl}/plans/${id}`;

  return {
    title: `${plan.title} | Join now`,
    description: plan.description || "Join this plan and meet amazing people.",
    openGraph: {
      title: plan.title,
      description: plan.description || "Join this plan",
      url: canonicalUrl,
      siteName: "Zuno",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: plan.title,
      description: plan.description || "Join this plan",
      images: [ogImageUrl],
    },
  };
}

export default async function Page({ params }: any) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: auth } = await supabase.auth.getUser();

  const { data: plan, error } = await supabase
    .from("plans")
    .select("*, host:users!plans_host_id_fkey(id,name,avatar_url,gpay_link)")
    .eq("id", id)
    .single();

  if (!plan || error) return notFound();

  const { data: participants } = await supabase
    .from("plan_participants")
    .select("user_id,status,user:users!plan_participants_user_id_fkey(id,name,avatar_url)")
    .eq("plan_id", id)
    .eq("status", "joined");

  const { data: settlements } = await supabase
    .from("expense_settlements")
    .select("user_id,settled,settled_at")
    .eq("plan_id", id);

  const isParticipant = Boolean((participants || []).some((p: any) => p.user_id === auth.user?.id));
  if (plan.visibility === 'private' && !(auth.user && (auth.user.id === plan.host_id || isParticipant))) {
    return notFound();
  }

  const { data: favorites } = auth.user
    ? await supabase.from("plan_favorites").select("plan_id").eq("plan_id", id).eq("user_id", auth.user.id).maybeSingle()
    : { data: null };

  const isJoined = isParticipant;

  const safePlan = JSON.parse(
    JSON.stringify({
      ...plan,
      participants: participants || [],
      settlements: settlements || [],
      is_joined: isJoined,
      is_favorite: Boolean(favorites),
      current_user_id: auth.user?.id || null,
    }),
  );

  return <PlanDetailClient initialPlan={safePlan} />;
}

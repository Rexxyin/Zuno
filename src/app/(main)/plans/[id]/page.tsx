import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import PlanDetailClient from "./PlanDetailClient";
import { createClient } from "@/lib/supabase/server";
import { computeEffectivePlanStatus, normalizeVisibility } from "@/lib/plan";

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { id } = await params;
  const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const { data: plan } = await supabase.from("plans").select("id,title,description,datetime,location_name").eq("id", id).single();
  if (!plan) return { title: "Plan not found" };

  const formattedDate = new Date(plan.datetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  return {
    title: `${plan.title} · ZunoPlan`,
    description: `${plan.description || ''} · ${formattedDate} · ${plan.location_name || ''}`,
    openGraph: {
      title: `${plan.title} · ZunoPlan`,
      description: `${plan.description || ''} · ${formattedDate} · ${plan.location_name || ''}`,
      images: [`https://zunoplan.vercel.app/api/og?planId=${plan.id}`],
      url: `https://zunoplan.vercel.app/plans/${plan.id}`,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function Page({ params }: any) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: auth } = await supabase.auth.getUser();

  const { data: plan } = await supabase.from("plans").select("*, host:users!plans_host_id_fkey(id,name,avatar_url,gpay_link,instagram_url,upi_payee_name)").eq("id", id).single();
  if (!plan) return notFound();

  const { data: participants } = await supabase.from("plan_participants").select("user_id,status,user:users!plan_participants_user_id_fkey(id,name,avatar_url)").eq("plan_id", id).eq("status", "joined");
  const { data: settlements } = await supabase.from("expense_settlements").select("user_id,settled,settled_at").eq("plan_id", id);
  const isParticipant = Boolean((participants || []).some((p: any) => p.user_id === auth.user?.id));
  const isHost = auth.user?.id === plan.host_id
  const effectiveStatus = computeEffectivePlanStatus({ ...plan, participants })
  const visibility = normalizeVisibility(plan.visibility)

  if (visibility === 'invite_only' && !(isParticipant || isHost)) return notFound();
  if (effectiveStatus === 'expired' && !(isParticipant || isHost)) return notFound();

  const { data: favorites } = auth.user ? await supabase.from("plan_favorites").select("plan_id").eq("plan_id", id).eq("user_id", auth.user.id).maybeSingle() : { data: null };
  const { data: currentUser } = auth.user ? await supabase.from('users').select('gender').eq('id', auth.user.id).maybeSingle() : { data: null }

  const safePlan = JSON.parse(JSON.stringify({
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
  }));

  return <PlanDetailClient initialPlan={safePlan} />;
}

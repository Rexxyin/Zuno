"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Info, Instagram, MessageCircle, Users } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { BottomNav } from "@/components/BottomNav";
import { parseDatetimeLocal, formatDateTime } from "@/lib/datetime";
import { computeEffectivePlanStatus, statusBadge, statusLabel } from "@/lib/plan";

type Settlement = { user_id: string; settled: boolean; settled_at: string | null };

export default function PlanDetailClient({ initialPlan }: any) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [busy, setBusy] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>(plan.settlements || []);

  const isHost = plan.current_user_id === plan.host_id;
  const isParticipant = (plan.participants || []).some((p: any) => p.user_id === plan.current_user_id);
  const isVisitor = !isHost && !isParticipant;
  const joinedParticipants = (plan.participants || []).filter((p: any) => p.status === "joined");
  const joinedCount = joinedParticipants.length;
  const maxSpots = Number(plan.max_people || 0);
  const spotsOpen = Math.max(maxSpots - joinedCount, 0);
  const effectiveStatus = computeEffectivePlanStatus(plan);
  const badge = statusBadge(effectiveStatus);
  const planDate = useMemo(() => parseDatetimeLocal(plan.datetime), [plan.datetime]);

  const perPersonEstimate = useMemo(() => {
    if (!plan.cost_amount) return null;
    if (plan.cost_mode === 'total') return Number(plan.cost_amount) / Math.max(joinedCount + 1, 1);
    return Number(plan.cost_amount);
  }, [plan.cost_amount, plan.cost_mode, joinedCount]);

  const finalShare = useMemo(() => {
    if (!plan.final_amount) return null;
    return Number(plan.final_amount) / Math.max(joinedCount + 1, 1);
  }, [plan.final_amount, joinedCount]);

  const refreshPlan = async () => {
    const res = await fetch(`/api/plans/${plan.id}`, { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) setPlan((prev: any) => ({ ...prev, ...data }));
  };

  const join = async () => {
    setBusy("join");
    const res = await fetch(`/api/plans/${plan.id}/join`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) toast.error("Unable to join", { description: data.error || "Please try again." });
    else { toast.success(data.status === 'pending' ? "Request sent — pending approval" : "You're in!"); await refreshPlan(); }
    setBusy(null);
  };

  const leave = async () => {
    if (!confirm('Leave this plan?')) return;
    setBusy("leave");
    const res = await fetch(`/api/plans/${plan.id}/leave`, { method: "POST" });
    if (res.ok) { toast.success("You left the plan"); router.refresh(); } else toast.error("Unable to leave");
    setBusy(null);
  };

  const closePlan = async () => {
    if (!confirm("Close this plan? People won't be able to join anymore, but existing participants stay.")) return;
    setBusy('close');
    const res = await fetch(`/api/plans/${plan.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'closed' }) });
    if (res.ok) { await refreshPlan(); toast.success('Plan closed'); } else toast.error('Unable to close plan');
    setBusy(null);
  }

  const deletePlan = async () => {
    if (!confirm('Delete this plan? This permanently removes the plan for everyone.')) return;
    setBusy('delete');
    const res = await fetch(`/api/plans/${plan.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/my-plans'); else toast.error('Unable to delete plan');
    setBusy(null);
  }

  const confirmFinalAmount = async () => {
    const value = prompt('Enter final total amount', plan.final_amount || plan.cost_amount || '')
    if (!value) return
    setBusy('final')
    const res = await fetch(`/api/plans/${plan.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ final_amount: Number(value) }) })
    if (res.ok) { toast.success('Final amount confirmed'); await refreshPlan() } else toast.error('Failed to confirm final amount')
    setBusy(null)
  }

  const loadRequests = async () => {
    const res = await fetch(`/api/plans/${plan.id}/requests`)
    const data = await res.json().catch(() => [])
    if (res.ok) { setPendingRequests(data || []); setShowRequests(true) }
  }

  const actRequest = async (userId: string, action: 'approve' | 'decline') => {
    const res = await fetch(`/api/plans/${plan.id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestUserId: userId }) })
    if (res.ok) { await loadRequests(); await refreshPlan() }
  }

  const markSettled = async () => {
    const res = await fetch(`/api/plans/${plan.id}/settlements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settled: true }) })
    const data = await res.json().catch(() => ({}))
    if (res.ok) setSettlements(data.settlements || [])
  }

  const upiLink = plan.host?.gpay_link && finalShare ? `upi://pay?pa=${encodeURIComponent(plan.host.gpay_link)}&pn=${encodeURIComponent(plan.host?.upi_payee_name || plan.host?.name || 'Host')}&am=${encodeURIComponent(finalShare.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`ZunoPlan:${plan.title}`)}` : null

  if (effectiveStatus === 'expired' && isVisitor) {
    return <div className="min-h-screen grid place-items-center p-6 text-center"><div><h1 className="text-2xl font-bold">This plan has ended</h1><p className="mt-2 text-sm app-muted">Only the host and joined participants can view ended plans.</p></div></div>
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] pb-20">
      <div className="relative h-[300px] w-full sm:h-[360px]">
        <img src={plan.image_url || "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=2940&auto=format&fit=crop"} alt={plan.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-[27px] font-semibold leading-tight">{plan.title}</h1>
          {plan.description && <p className="mt-2 text-[14px] leading-relaxed text-white/90">{plan.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-xs">{plan.category}</span>
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-xs">{spotsOpen} spots left</span>
            {badge && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>{badge.text}</span>}
            {plan.female_only && <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-semibold text-pink-700">Women only</span>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <Link href={`/profile/${plan.host_id}`} className="flex items-center gap-3 rounded-2xl border app-card p-3">
          <img src={plan.host?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${plan.host?.name || 'Host'}`} alt={plan.host?.name || 'Organizer'} className="h-10 w-10 rounded-full border border-[#e7dfd3]" />
          <div><p className="text-xs font-medium uppercase tracking-wide text-[#8b7b6d]">Hosted by</p><p className="text-[15px] font-semibold text-[#1a1410]">{plan.host?.name || 'Organizer'}</p></div>
          <div className="ml-auto">{plan.host?.instagram_url ? <a href={plan.host.instagram_url} target="_blank" rel="noreferrer" className="rounded-full border border-[#e7dfd3] p-1.5 text-[#a0522d]"><Instagram className="h-3.5 w-3.5" /></a> : null}</div>
        </Link>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border app-card p-3"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8b7b6d] inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Date & time</p><p className="text-sm font-medium text-[#1a1410]">{formatDateTime(planDate)}</p></div>
          <div className="rounded-xl border app-card p-3"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8b7b6d] inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Group size</p><p className="text-sm font-medium text-[#1a1410]">{joinedCount} joined · {spotsOpen} spots open</p></div>
        </div>

        <div className="rounded-xl border app-card p-3">
          <p className="text-sm font-semibold">Joined: {joinedCount} / {maxSpots} spots</p>
          <div className="mt-2 flex items-center gap-2 overflow-x-auto">{joinedParticipants.slice(0, 5).map((p: any) => <img key={p.user_id} src={p.user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.user?.name || 'U'}`} className="h-8 w-8 rounded-full border-2 border-white" />)}{joinedParticipants.length > 5 ? <span className="text-xs app-muted">+{joinedParticipants.length - 5} more</span> : null}</div>
        </div>

        {!!plan.cost_amount && (
          <div className="rounded-xl border app-card p-3">
            <p className="font-semibold">Split estimate</p>
            <p className="text-sm">₹{(perPersonEstimate || 0).toFixed(0)} per person · {joinedCount + 1} people</p>
            <p className="text-sm app-muted">Est. total: ₹{Number(plan.cost_mode === 'total' ? plan.cost_amount : (perPersonEstimate || 0) * (joinedCount + 1)).toFixed(0)}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs app-muted"><Info className="h-3.5 w-3.5" />Final amount confirmed by host</p>
          </div>
        )}

        {isHost && (
          <div className="grid gap-2">
            <Link href={`/plans/${plan.id}/edit`} className="rounded-xl border app-card px-3 py-2 text-center text-sm font-semibold">Edit plan</Link>
            {plan.require_approval && <button onClick={loadRequests} className="rounded-xl bg-[#1a1410] px-3 py-2 text-sm font-semibold text-white">Manage requests ({pendingRequests.length})</button>}
            <button onClick={closePlan} disabled={busy === 'close'} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">Close plan</button>
            <button onClick={deletePlan} disabled={busy === 'delete'} className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Delete plan</button>
            {(effectiveStatus === 'open' || effectiveStatus === 'expired') && <button onClick={confirmFinalAmount} className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Confirm final amount</button>}
          </div>
        )}

        {showRequests && pendingRequests.length > 0 && (
          <div className="rounded-xl border app-card p-3 space-y-2">
            {pendingRequests.map((req: any) => <div key={req.user_id} className="flex items-center justify-between"><span>{req.user?.name || 'User'}</span><div className="flex gap-2"><button onClick={() => actRequest(req.user_id, 'approve')} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Accept</button><button onClick={() => actRequest(req.user_id, 'decline')} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Decline</button></div></div>)}
          </div>
        )}

        {(isHost || isParticipant) && plan.whatsapp_link && <a href={plan.whatsapp_link} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#25d366]/40 bg-[#25d366]/10 px-3 py-2 text-sm font-semibold text-[#117a3d]"><MessageCircle className="h-4 w-4" />Open WhatsApp group</a>}

        {(isHost || isParticipant) && !!plan.final_amount && (
          <div className="rounded-xl border app-card p-3 space-y-2">
            {isParticipant && (
              <>
                <p className="text-sm font-semibold">Your share: ₹{(finalShare || 0).toFixed(0)}</p>
                <div className="grid grid-cols-2 gap-2">
                  <a href={upiLink || '#'} className="rounded-lg bg-[#0f766e] px-3 py-2 text-center text-xs font-semibold text-white">Pay via UPI</a>
                  <button onClick={markSettled} className="rounded-lg border px-3 py-2 text-xs font-semibold">Mark as settled</button>
                </div>
              </>
            )}
            <p className="text-sm font-semibold">Who's settled</p>
            {joinedParticipants.map((p: any) => {
              const settled = (settlements || []).find((s) => s.user_id === p.user_id)?.settled
              return <div key={p.user_id} className="flex items-center justify-between text-sm"><span>{settled ? '✓' : '○'} {p.user?.name || 'Member'}</span><span className={settled ? 'text-emerald-700' : 'text-gray-500'}>{settled ? 'Settled' : 'Pending'}</span></div>
            })}
          </div>
        )}

        <div className="pt-1">
          {isParticipant && !isHost && <p className="mb-2 inline-flex rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-semibold text-[#15803D]">You're in!</p>}
          {isHost ? null : isParticipant ? <button onClick={leave} disabled={busy === "leave"} className="w-full rounded-xl border border-[#d6ccbe] py-2.5 text-sm font-semibold text-[#32271f]">Leave plan</button> : <button onClick={join} disabled={busy === "join" || effectiveStatus !== 'open' || (plan.female_only && plan.current_user_gender !== 'female')} className="w-full rounded-xl bg-[#1a1410] py-2.5 text-sm font-semibold text-white disabled:opacity-50">{plan.female_only && plan.current_user_gender !== 'female' ? 'This plan is for women only' : busy === "join" ? "Please wait…" : (statusLabel(effectiveStatus))}</button>}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

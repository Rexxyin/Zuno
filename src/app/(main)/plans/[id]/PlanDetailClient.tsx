"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Share2,
  MapPin,
  CalendarDays,
  Users,
  Lock,
  ExternalLink,
  Wallet,
  Check,
  MessageCircle,
  Instagram,
  Pencil,
  Settings2,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { generateUpiLink, normalizeUpiId } from "@/lib/upi";
import { BottomNav } from "@/components/BottomNav";
import { parseDatetimeLocal, formatDateTime } from "@/lib/datetime";

type Settlement = {
  user_id: string;
  settled: boolean;
  settled_at: string | null;
};

export default function PlanDetailClient({ initialPlan }: any) {
  const [plan] = useState(initialPlan);
  const [copied, setCopied] = useState(false);
  const [isJoined, setIsJoined] = useState(Boolean(plan.is_joined));
  const [isSaved, setIsSaved] = useState(Boolean(plan.is_favorite));
  const [settlements, setSettlements] = useState<Settlement[]>(plan.settlements || []);
  const [busy, setBusy] = useState<"join" | "leave" | "pay" | "settle" | null>(null);

  const planDate = useMemo(() => parseDatetimeLocal(plan.datetime), [plan.datetime]);

  const joinedParticipants = useMemo(
    () => (plan.participants || []).filter((p: any) => p.status === "joined"),
    [plan.participants],
  );
  const joinedCount = joinedParticipants.length;
  const isHost = plan.host_id === plan.current_user_id;
  const spotsLeft = Math.max((plan.max_people || 1) - joinedCount, 0);
  const planIsExpired = +new Date(plan.datetime) < Date.now();
  const planIsClosed = plan.status === "completed" || plan.status === "cancelled";
  const planIsLocked = planIsExpired || planIsClosed;
  const hostName = plan.host?.name || "Organizer";
  const hostUpiLink = generateUpiLink({
    upiId: normalizeUpiId(plan.host?.gpay_link || ""),
    payeeName: hostName,
    amount: Number(plan.per_person_amount || 0) || undefined,
    note: `Zuno • ${plan.title}`,
  });
  const canShowPayments = Boolean(plan.show_payment_options && (isJoined || isHost) && hostUpiLink);
  const effectivePerPerson = Number(plan.per_person_amount || 0) || (plan.total_amount && plan.max_people ? Number(plan.total_amount) / Number(plan.max_people) : 0);

  const mySettlement = settlements.find((s) => s.user_id === plan.current_user_id);
  const isSettled = Boolean(mySettlement?.settled);

  const updateSettlement = async (settled: boolean) => {
    setBusy("settle");
    try {
      const res = await fetch(`/api/plans/${plan.id}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settled }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not update settlement", { description: data.error || "Please try again." });
        return;
      }
      setSettlements(data.settlements || []);
      toast.success(settled ? "Marked as settled" : "Marked as pending", {
        description: settled ? "Host can now see your settlement status." : "You can settle again anytime.",
      });
    } finally {
      setBusy(null);
    }
  };

  const join = async () => {
    setBusy("join");
    const res = await fetch(`/api/plans/${plan.id}/join`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setIsJoined(true);
      toast.success(plan.visibility === "private" ? "Request sent" : "Joined plan", {
        description: plan.visibility === "private" ? "Host will approve soon." : "You are now in this plan.",
      });
    } else {
      toast.error("Unable to join", { description: data.error || "Please try again." });
    }
    setBusy(null);
  };

  const leave = async () => {
    setBusy("leave");
    const res = await fetch(`/api/plans/${plan.id}/leave`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setIsJoined(false);
      toast.success("You left the plan");
    } else {
      toast.error("Unable to leave", { description: data.error || "Please try again." });
    }
    setBusy(null);
  };

  const toggleSave = async () => {
    const method = isSaved ? "DELETE" : "POST";
    const res = await fetch(`/api/plans/${plan.id}/favorite`, { method });
    if (res.ok) setIsSaved(!isSaved);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/plans/${plan.id}`;
    if (navigator.share) {
      await navigator.share({ title: plan.title, text: plan.description || "", url });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] pb-20">
      <div className="relative h-[300px] w-full sm:h-[360px]">
        <img
          src={plan.image_url || "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=2940&auto=format&fit=crop"}
          alt={plan.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute right-3 top-3 flex gap-2">
          <button onClick={toggleSave} className="rounded-full bg-white/90 p-2 shadow-sm active:scale-95">
            <Heart className={`h-4 w-4 ${isSaved ? "fill-[#ff5a3c] text-[#ff5a3c]" : "text-[#433a31]"}`} />
          </button>
          <button onClick={handleShare} className="rounded-full bg-white/90 p-2 shadow-sm active:scale-95">
            <Share2 className="h-4 w-4 text-[#433a31]" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-[27px] font-semibold leading-tight">{plan.title}</h1>
          {plan.description && <p className="mt-1 max-w-xl text-sm text-white/90">{plan.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium">
            <Users className="h-3.5 w-3.5" /> {spotsLeft} spots left
          </p>
          {planIsLocked && <p className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{planIsExpired ? "Expired" : "Closed"}</p>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <Link href={`/profile/${plan.host_id}`} className="flex items-center gap-3 rounded-2xl border app-card p-3">
          <img
            src={plan.host?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${hostName}`}
            alt={hostName}
            className="h-10 w-10 rounded-full border border-[#e7dfd3]"
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#8b7b6d]">Hosted by</p>
            <p className="text-[15px] font-semibold text-[#1a1410]">{hostName}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {plan.host?.instagram_url && (
              <a href={`https://instagram.com/${plan.host.instagram_url.replace(/^.*?(\/|@)?/, '').replace(/\/$/, '')}` || plan.host.instagram_url} target="_blank" rel="noreferrer" className="rounded-full border border-[#e7dfd3] p-1.5 text-[#a0522d] hover:bg-pink-50 transition">
                <Instagram className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </Link>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border app-card p-3">
            <p className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#8b7b6d]">
              <CalendarDays className="h-3.5 w-3.5" /> Date & time
            </p>
            <p className="text-sm font-medium text-[#1a1410]">
              {formatDateTime(planDate)}
            </p>
          </div>

          <div className="rounded-xl border app-card p-3">
            <p className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#8b7b6d]">
              <Users className="h-3.5 w-3.5" /> Group size
            </p>
            <p className="text-sm font-medium text-[#1a1410]">{joinedCount + 1}/{plan.max_people + 1} people</p>
          </div>
        </div>

        {isHost && (
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/plans/${plan.id}/edit`} className="inline-flex items-center justify-center gap-1.5 rounded-xl border app-card px-3 py-2 text-sm font-semibold text-[#2e241d]">
              <Pencil className="h-3.5 w-3.5" /> Edit plan
            </Link>
            <Link href="/my-plans?tab=hosted" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a1410] px-3 py-2 text-sm font-semibold text-white">
              <Settings2 className="h-3.5 w-3.5" /> Manage requests
            </Link>
          </div>
        )}

        {(plan.estimated_cost || plan.total_amount || plan.per_person_amount) && (
          <div className="rounded-xl border app-card p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8b7b6d]">💰 Split & Payment</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <Stat label="Estimate" value={plan.estimated_cost ? `₹${Number(plan.estimated_cost).toFixed(0)}` : "—"} />
              <Stat label="Total" value={plan.total_amount ? `₹${Number(plan.total_amount).toFixed(0)}` : "—"} />
              <Stat label="Per person" value={effectivePerPerson ? `₹${Number(effectivePerPerson).toFixed(0)}` : "—"} />
            </div>

            {canShowPayments && !planIsLocked && (
              <div className="mt-3 space-y-2">
                {isJoined && (
                  <a
                    href={hostUpiLink!}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0f766e] px-3 py-2 text-xs font-semibold text-white transition active:scale-[0.98]"
                    onClick={() => setBusy("pay")}
                  >
                    <Wallet className="h-3.5 w-3.5" /> {busy === "pay" ? "Opening…" : "Pay with UPI"}
                  </a>
                )}
                {(isJoined || isHost) && (
                  <button
                    onClick={() => updateSettlement(!isSettled)}
                    disabled={busy === "settle"}
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                      isSettled ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-[#d8cdc0] text-[#5a4f43]"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> {isSettled ? "Settled ✓" : "Mark as settled"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {(isJoined || isHost) && plan.whatsapp_link && (
          <a
            href={plan.whatsapp_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#25d366]/40 bg-[#25d366]/10 px-3 py-2 text-sm font-semibold text-[#117a3d]"
          >
            <MessageCircle className="h-4 w-4" /> Open WhatsApp group
          </a>
        )}

        <div className="rounded-xl border app-card p-3">
          <p className="mb-2 text-sm font-semibold text-[#1a1410]">People joining ({joinedCount})</p>
          <div className="space-y-2">
            {joinedParticipants.length === 0 && <p className="text-xs text-[#8b7b6d]">No one joined yet.</p>}
            {joinedParticipants.map((p: any) => {
              const personName = p.user?.name || "Member";
              const personSettled = settlements.find((s) => s.user_id === p.user_id)?.settled;
              return (
                <div key={p.user_id} className="flex items-center justify-between rounded-lg border border-[#e6ddd0] bg-white/60 px-2.5 py-2">
                  <Link href={`/profile/${p.user_id}`} className="flex items-center gap-2">
                    <img
                      src={p.user?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${personName}`}
                      alt={personName}
                      className="h-8 w-8 rounded-full border border-[#e7dfd3]"
                    />
                    <span className="text-sm font-medium text-[#2b221c]">{personName}</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    {(plan.host_id === plan.current_user_id || isJoined) && canShowPayments && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${personSettled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {personSettled ? "Settled" : "Pending"}
                      </span>
                    )}
                    <Link href={`/profile/${p.user_id}`} className="text-xs font-semibold text-[#1f6feb]">View profile</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-1">
          {isHost ? (
            <div className="rounded-xl border border-[#d6ccbe] py-2.5 text-center text-sm font-semibold text-[#32271f]">
              You are hosting this plan
            </div>
          ) : isJoined ? (
            <button
              onClick={leave}
              disabled={busy === "leave"}
              className="w-full rounded-xl border border-[#d6ccbe] py-2.5 text-sm font-semibold text-[#32271f] active:bg-[#f2ebe2]"
            >
              {busy === "leave" ? "Leaving…" : "Leave plan"}
            </button>
          ) : (
            <button
              onClick={join}
              disabled={busy === "join" || planIsLocked}
              className="w-full rounded-xl bg-[#1a1410] py-2.5 text-sm font-semibold text-white transition active:scale-[0.99] active:opacity-90"
            >
              {busy === "join" ? "Please wait…" : plan.visibility === "private" ? <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" />Request to join</span> : "Join plan"}
            </button>
          )}
          {copied && <p className="mt-2 text-center text-xs text-emerald-700">Plan link copied.</p>}
          {isJoined && <p className="mt-2 text-center text-xs font-medium text-[#d4522a]">{spotsLeft} spots left</p>}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eadfce] bg-white/60 p-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#8b7b6d]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#1a1410]">{value}</p>
    </div>
  );
}

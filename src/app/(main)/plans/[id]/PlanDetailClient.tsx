"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Info,
  Instagram,
  MapPin,
  Users,
  ArrowLeft,
  Share2,
  Clock,
  Wallet,
  ShieldCheck,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { BottomNav } from "@/components/BottomNav";
import { RichTextDisplay } from "@/components/RichTextEditor";
import { parseDatetimeLocal, formatDateTime } from "@/lib/datetime";
import { CATEGORY_META } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  computeEffectivePlanStatus,
  statusBadge,
  statusLabel,
} from "@/lib/plan";

type Settlement = {
  user_id: string;
  settled: boolean;
  settled_at: string | null;
};

export default function PlanDetailClient({ initialPlan }: any) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [busy, setBusy] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>(
    plan.settlements || [],
  );
  const [descOpen, setDescOpen] = useState(false);

  const isHost = plan.current_user_id === plan.host_id;
  const isParticipant = (plan.participants || []).some(
    (p: any) => p.user_id === plan.current_user_id,
  );
  const isVisitor = !isHost && !isParticipant;
  const joinedParticipants = (plan.participants || []).filter(
    (p: any) => p.status === "joined",
  );
  const joinedCount = joinedParticipants.length;
  const maxSpots = Number(plan.max_people || 0);
  const spotsOpen = Math.max(maxSpots - joinedCount, 0);
  const effectiveStatus = computeEffectivePlanStatus(plan);
  const badge = statusBadge(effectiveStatus);
  const planDate = useMemo(
    () => parseDatetimeLocal(plan.datetime),
    [plan.datetime],
  );
  const fillPercent =
    maxSpots > 0 ? Math.round((joinedCount / maxSpots) * 100) : 0;

  // Use final_amount if available, else estimate
  const activeAmount = plan.final_amount
    ? Number(plan.final_amount)
    : plan.cost_amount && plan.cost_mode === "total"
      ? Number(plan.cost_amount)
      : plan.cost_amount
        ? Number(plan.cost_amount) * Math.max(joinedCount, 1)
        : null;

  const perPersonShare = useMemo(() => {
    if (plan.final_amount)
      return Number(plan.final_amount) / Math.max(joinedCount, 1);
    if (!plan.cost_amount) return null;
    if (plan.cost_mode === "total")
      return Number(plan.cost_amount) / Math.max(joinedCount, 1);
    return Number(plan.cost_amount);
  }, [plan.final_amount, plan.cost_amount, plan.cost_mode, joinedCount]);

  const upiLink =
    plan.host?.gpay_link && perPersonShare
      ? `upi://pay?pa=${encodeURIComponent(plan.host.gpay_link)}&pn=${encodeURIComponent(plan.host?.upi_payee_name || plan.host?.name || "Host")}&am=${encodeURIComponent(perPersonShare.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`ZunoPlan:${plan.title}`)}`
      : null;
  const mapLink = useMemo(() => {
    if (plan.latitude && plan.longitude) {
      return `https://www.google.com/maps?q=${plan.latitude},${plan.longitude}`;
    }
    if (plan.location_name || plan.city) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${plan.location_name || ""} ${plan.city || ""}`,
      )}`;
    }
    return null;
  }, [plan]);

  const refreshPlan = async () => {
    const res = await fetch(`/api/plans/${plan.id}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setPlan((prev: any) => ({ ...prev, ...data }));
  };

  const join = async () => {
    setBusy("join");
    const res = await fetch(`/api/plans/${plan.id}/join`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      toast.error("Unable to join", {
        description: data.error || "Please try again.",
      });
    else {
      toast.success(
        data.status === "pending"
          ? "Request sent — pending approval"
          : "You're in!",
      );
      await refreshPlan();
    }
    setBusy(null);
  };

  const leave = async () => {
    if (!confirm("Leave this plan?")) return;
    setBusy("leave");
    const res = await fetch(`/api/plans/${plan.id}/leave`, { method: "POST" });
    if (res.ok) {
      toast.success("You left the plan");
      router.refresh();
    } else toast.error("Unable to leave");
    setBusy(null);
  };

  const closePlan = async () => {
    if (
      !confirm(
        "Close this plan? People won't be able to join anymore, but existing participants stay.",
      )
    )
      return;
    setBusy("close");
    const res = await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    if (res.ok) {
      await refreshPlan();
      toast.success("Plan closed");
    } else toast.error("Unable to close plan");
    setBusy(null);
  };

  const deletePlan = async () => {
    if (
      !confirm(
        "Delete this plan? This permanently removes the plan for everyone.",
      )
    )
      return;
    setBusy("delete");
    const res = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
    if (res.ok) router.push("/my-plans");
    else toast.error("Unable to delete plan");
    setBusy(null);
  };

  const confirmFinalAmount = async () => {
    const value = prompt(
      "Enter final total amount",
      plan.final_amount || plan.cost_amount || "",
    );
    if (!value) return;
    setBusy("final");
    const res = await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ final_amount: Number(value) }),
    });
    if (res.ok) {
      toast.success("Final amount confirmed");
      await refreshPlan();
    } else toast.error("Failed to confirm final amount");
    setBusy(null);
  };

  const loadRequests = async () => {
    const res = await fetch(`/api/plans/${plan.id}/requests`);
    const data = await res.json().catch(() => []);
    if (res.ok) {
      setPendingRequests(data || []);
      setShowRequests(true);
    }
  };

  const actRequest = async (userId: string, action: "approve" | "decline") => {
    const res = await fetch(`/api/plans/${plan.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestUserId: userId }),
    });
    if (res.ok) {
      await loadRequests();
      await refreshPlan();
    }
  };

  const markSettled = async () => {
    const res = await fetch(`/api/plans/${plan.id}/settlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settled: true }),
    });
    const data = await res.json().catch(() => ({}));
    console.log("settlement", data.settlements);
    if (res.ok) setSettlements(data.settlements || []);
    else toast.error("Failed to mark as settled");
  };

  if (effectiveStatus === "expired" && isVisitor) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center bg-[#faf8f4]">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#f0ebe3] grid place-items-center mx-auto">
            <Clock className="w-7 h-7 text-[#b09880]" />
          </div>
          <h1
            className="text-2xl font-bold text-[#1a1410]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            This plan has ended
          </h1>
          <p className="text-sm text-[#8b7b6d] max-w-xs mx-auto leading-relaxed">
            Only the host and joined participants can view ended plans.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');

        .pd * { box-sizing: border-box; }
        .pd {
          font-family: 'DM Sans', sans-serif;
          background: #faf8f4;
          min-height: 100svh;
          padding-bottom: 100px;
        }

        /* ── Hero ── */
        .pd-hero {
          position: relative;
          height: 300px;
          width: 100%;
          overflow: hidden;
        }
        @media (min-width: 640px) { .pd-hero { height: 380px; } }

        .pd-hero-img {
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .pd-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to top,
            rgba(12,8,4,0.78) 0%,
            rgba(12,8,4,0.28) 50%,
            rgba(12,8,4,0.06) 100%
          );
        }
        .pd-topbar {
          position: absolute; top: 0; left: 0; right: 0;
          padding: 14px 16px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .pd-icon-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.16);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          display: grid; place-items: center;
          color: white; cursor: pointer;
          transition: background 0.15s;
        }
        .pd-icon-btn:hover { background: rgba(255,255,255,0.26); }

        .pd-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 16px 18px 20px;
        }
        .pd-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 26px; font-weight: 700;
          color: white; line-height: 1.2; letter-spacing: -0.3px;
        }
        @media (min-width: 640px) { .pd-title { font-size: 32px; } }

        .pd-pills {
          display: flex; flex-wrap: wrap; gap: 5px;
          margin-top: 10px;
        }
        .pd-pill {
          border-radius: 100px;
          padding: 3px 10px;
          font-size: 11px; font-weight: 500;
          backdrop-filter: blur(6px);
        }
        .pp-dark  { background: rgba(0,0,0,0.36); color: white; border: 1px solid rgba(255,255,255,0.14); }
        .pp-green { background: #dcfce7; color: #166534; }
        .pp-amber { background: #fef3c7; color: #92400e; }
        .pp-red   { background: #fee2e2; color: #991b1b; }
        .pp-gray  { background: rgba(0,0,0,0.28); color: rgba(255,255,255,0.88); border: 1px solid rgba(255,255,255,0.14); }
        .pp-pink  { background: #fce7f3; color: #9d174d; }

        /* ── Body ── */
        .pd-body {
          max-width: 600px;
          margin: 0 auto;
          padding: 14px 14px 0;
          display: flex; flex-direction: column; gap: 10px;
        }

        /* ── Card ── */
        .pd-card {
          background: white;
          border-radius: 18px;
          border: 1px solid #ede8e0;
          overflow: hidden;
        }
        .pd-cp { padding: 14px; }

        /* ── Host row ── */
        .pd-host {
          display: flex; align-items: center; gap: 11px;
          padding: 12px 14px;
          background: white;
          border-radius: 18px;
          border: 1px solid #ede8e0;
        }
        .pd-host-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          border: 2px solid #e9dfd3;
          object-fit: cover; flex-shrink: 0;
        }
        .pd-host-lbl {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: #a08b7a;
        }
        .pd-host-name {
          font-size: 15px; font-weight: 600;
          color: #1a1410;
            font-family: 'DM Sans', sans-serif;
        }
        .pd-host-actions {
          margin-left: auto;
          display: flex; align-items: center; gap: 6px; flex-shrink: 0;
        }
        .pd-profile-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 5px 10px;
          border-radius: 100px;
          border: 1px solid #e2d9ce;
          background: #faf7f3;
          color: #5c4a38;
          font-size: 11px; font-weight: 600;
          text-decoration: none;
          transition: background 0.14s;
        }
        .pd-profile-btn:hover { background: #f0ebe3; }
        .pd-ig-btn {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 1px solid #e9dfd3;
          background: #fdf9f5;
          display: grid; place-items: center;
          color: #c2602a;
          text-decoration: none; flex-shrink: 0;
          transition: background 0.14s;
        }
        .pd-ig-btn:hover { background: #fce7d8; }

        /* ── Description accordion ── */
        .pd-desc-toggle {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 12px 14px;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          text-align: left;
        }
        .pd-desc-toggle-lbl {
          font-size: 12px; font-weight: 600;
          color: #5c4a38;
        }
        .pd-desc-body {
          padding: 0 14px 14px;
          border-top: 1px solid #f3ede6;
        }

        /* ── Info grid ── */
        .pd-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .pd-info-tile {
          background: white;
          border-radius: 16px;
          border: 1px solid #ede8e0;
          padding: 12px;
        }
        .pd-info-icon {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: #fdf3e9;
          display: grid; place-items: center;
          margin-bottom: 7px;
        }
        .pd-info-lbl {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: #a08b7a; margin-bottom: 2px;
        }
        .pd-info-val {
          font-size: 13px; font-weight: 600;
          color: #1a1410; line-height: 1.3;
        }
        .pd-info-sub {
          font-size: 11px; color: #8b7b6d; margin-top: 1px;
        }

        /* ── Progress ── */
        .pd-prog-track {
          height: 5px; border-radius: 100px;
          background: #f0ebe3; margin-top: 9px; overflow: hidden;
        }
        .pd-prog-fill {
          height: 100%; border-radius: 100px;
          background: linear-gradient(90deg, #d97706, #f59e0b);
          transition: width 0.5s ease;
        }

        /* ── Avatar stack ── */
        .pd-avatars {
          display: flex; align-items: center;
          margin-top: 10px;
        }
        .pd-av {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          margin-left: -7px;
          object-fit: cover;
        }
        .pd-av:first-child { margin-left: 0; }
        .pd-av-more {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          margin-left: -7px;
          background: #f0ebe3;
          font-size: 9px; font-weight: 600;
          color: #8b7b6d;
          display: grid; place-items: center;
        }
        .pd-av-names {
          margin-left: 8px;
          font-size: 11px; color: #8b7b6d;
        }

        /* ── Cost / split (single unified card) ── */
        .pd-cost-header {
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .pd-cost-lbl {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: #a08b7a; margin-bottom: 3px;
        }
        .pd-cost-amount {
          
          font-size: 20px; font-weight: 700; color: #1a1410;
        }
        .pd-cost-per { font-size: 13px; font-weight: 400; color: #8b7b6d; }
        .pd-cost-badge {
          font-size: 11px; font-weight: 700;
          padding: 3px 9px; border-radius: 100px;
          background: #fef3c7; color: #92400e;
        }
        .pd-cost-badge.final {
          background: #dcfce7; color: #166534;
        }
        .pd-cost-note {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: #a08b7a;
          margin-top: 6px;
        }

        /* Pay buttons (participant only) */
        .pd-pay-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 7px; margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f3ede6;
        }
        .pd-pay-upi {
          padding: 10px;
          border-radius: 12px;
          background: #0f766e; color: white;
          font-size: 12px; font-weight: 600;
          text-align: center; text-decoration: none;
          display: block; transition: opacity 0.15s;
        }
        .pd-pay-upi:hover { opacity: 0.88; }
        .pd-settle-btn {
          padding: 10px;
          border-radius: 12px;
          border: 1.5px solid #e2d9ce;
          background: transparent; color: #5c4a38;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.14s;
        }
        .pd-settle-btn:hover { background: #faf7f3; }
        .pd-settle-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Settlement tracker */
        .pd-tracker-header {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: #a08b7a;
          padding: 12px 14px 8px;
          border-top: 1px solid #f3ede6;
        }
        .pd-settle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 14px;
          border-top: 1px solid #f9f5f0;
        }
        .pd-settle-person {
          display: flex; align-items: center; gap: 8px;
        }
        .pd-settle-av {
          width: 26px; height: 26px;
          border-radius: 50%;
          border: 1.5px solid #e9dfd3;
          object-fit: cover;
        }
        .pd-settle-name { font-size: 13px; color: #1a1410; }
        .pd-settle-status {
          font-size: 11px; font-weight: 600;
          padding: 3px 9px; border-radius: 100px;
          display: flex; align-items: center; gap: 3px;
        }

        /* WhatsApp */
        .pd-wa {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 100%; padding: 12px;
          border-radius: 16px;
          background: #128c7e;
          color: white;
          font-size: 13px; font-weight: 600;
          text-decoration: none;
          transition: opacity 0.18s, transform 0.1s;
        }
        .pd-wa:active { transform: scale(0.98); opacity: 0.9; }

        /* CTA */
        .pd-joined-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 100px; padding: 5px 12px;
          font-size: 12px; font-weight: 600; color: #166534;
          margin-bottom: 8px;
        }
        .pd-btn-join {
          width: 100%; padding: 14px;
          border-radius: 16px;
          background: #1a1410; color: white;
          font-size: 14px; font-weight: 600;
          border: none; cursor: pointer;
          transition: opacity 0.18s, transform 0.1s;
          font-family: 'DM Sans', sans-serif;
        }
        .pd-btn-join:active { transform: scale(0.98); }
        .pd-btn-join:disabled { opacity: 0.45; cursor: not-allowed; }
        .pd-btn-leave {
          width: 100%; padding: 12px;
          border-radius: 16px;
          border: 1.5px solid #ddd5c8;
          background: transparent; color: #5c4a38;
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.14s;
        }
        .pd-btn-leave:hover { background: #fdf9f5; }

        /* Host controls */
        .pd-ctrl-lbl {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: #a08b7a; margin-bottom: 10px;
        }
        .pd-ctrl-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 7px;
        }
        .pd-ctrl-full { grid-column: 1 / -1; }
        .pd-ctrl-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 12px; font-weight: 600;
          cursor: pointer; border: none;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.14s, transform 0.1s;
          text-decoration: none;
        }
        .pd-ctrl-btn:active { transform: scale(0.97); }
        .pd-ctrl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cc-edit   { background: #f5f0eb; color: #1a1410; border: 1.5px solid #e2d9ce; }
        .cc-manage { background: #1a1410; color: white; }
        .cc-final  { background: #f0fdf4; color: #166534; border: 1.5px solid #bbf7d0; }
        .cc-close  { background: #fffbeb; color: #92400e; border: 1.5px solid #fde68a; }
        .cc-delete { background: #fff1f2; color: #be123c; border: 1.5px solid #fecdd3; }
        .pd-ctrl-badge {
          margin-left: 4px; background: #f59e0b; color: #1a1410;
          border-radius: 100px; padding: 1px 6px;
          font-size: 10px; font-weight: 700;
        }

        /* Requests */
        .pd-req-header {
          padding: 12px 14px;
          border-bottom: 1px solid #f3ede6;
          font-size: 13px; font-weight: 600; color: #1a1410;
        }
        .pd-req-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid #f9f5f0;
        }
        .pd-req-row:last-child { border-bottom: none; }
        .pd-req-actions { display: flex; gap: 5px; }
        .pd-req-accept {
          padding: 5px 12px; border-radius: 100px;
          background: #166534; color: white;
          font-size: 11px; font-weight: 600; border: none; cursor: pointer;
        }
        .pd-req-decline {
          padding: 5px 12px; border-radius: 100px;
          background: #f3ede6; color: #7c5c45;
          font-size: 11px; font-weight: 600; border: none; cursor: pointer;
        }
      `}</style>

      <div className="pd">
        {/* ── Hero ── */}
        <div className="pd-hero">
          <img
            src={
              plan.image_url ||
              "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=2940&auto=format&fit=crop"
            }
            alt={plan.title}
            className="pd-hero-img"
          />
          <div className="pd-hero-overlay" />
          <div className="pd-topbar">
            <button className="pd-icon-btn" onClick={() => router.back()}>
              <ArrowLeft size={17} />
            </button>
            <button
              className="pd-icon-btn"
              onClick={() => {
                if (navigator.share)
                  navigator.share({
                    title: plan.title,
                    url: window.location.href,
                  });
                else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }
              }}
            >
              <Share2 size={15} />
            </button>
          </div>
          <div className="pd-hero-content">
            <h1 className="pd-title">{plan.title}</h1>
            <div className="pd-pills">
              {plan.category && (
                <span className="pd-pill pp-dark" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <CategoryIcon
                    icon={CATEGORY_META[plan.category as keyof typeof CATEGORY_META]?.icon || "sparkles"}
                    className="h-3 w-3"
                  />
                  {CATEGORY_META[plan.category as keyof typeof CATEGORY_META]?.label || plan.category}
                </span>
              )}
              {badge && (
                <span
                  className={`pd-pill ${
                    effectiveStatus === "open"
                      ? "pp-green"
                      : effectiveStatus === "closed"
                        ? "pp-gray"
                        : effectiveStatus === "expired"
                          ? "pp-red"
                          : "pp-amber"
                  }`}
                >
                  {badge.text}
                </span>
              )}
              {plan.female_only && (
                <span className="pd-pill pp-pink">♀ Women only</span>
              )}
              {plan.require_approval && (
                <span
                  className="pd-pill pp-dark"
                  style={{ display: "flex", alignItems: "center", gap: 3 }}
                >
                  <Lock size={9} /> Approval needed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="pd-body">
          {/* Host */}
          <div className="pd-host">
            <img
              src={
                plan.host?.avatar_url ||
                `https://api.dicebear.com/7.x/adventurer/svg?seed=${plan.host?.name || "Host"}`
              }
              alt={plan.host?.name || "Host"}
              className="pd-host-avatar"
            />
            <div>
              <p className="pd-host-lbl">Hosted by</p>
              <p className="pd-host-name">{plan.host?.name || "Organizer"}</p>
            </div>
            <div className="pd-host-actions">
              {plan.host?.instagram_url && (
                <a
                  href={plan.host.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="pd-ig-btn"
                >
                  <Instagram size={13} />
                </a>
              )}
              <Link
                href={`/profile/${plan.host_id}`}
                className="pd-profile-btn"
              >
                <ExternalLink size={10} /> View profile
              </Link>
            </div>
          </div>

          {/* Description accordion */}
          {plan.description && (
            <div className="pd-card">
              <button
                type="button"
                className="pd-desc-toggle"
                onClick={() => setDescOpen((v) => !v)}
              >
                <span className="pd-desc-toggle-lbl">About this plan</span>
                {descOpen ? (
                  <ChevronUp size={15} color="#a08b7a" />
                ) : (
                  <ChevronDown size={15} color="#a08b7a" />
                )}
              </button>
              {descOpen && (
                <div className="pd-desc-body">
                  <RichTextDisplay html={plan.description} variant="light" />
                </div>
              )}
            </div>
          )}

          {/* Date + Group */}
          <div className="pd-info-grid">
            <div className="pd-info-tile">
              <div className="pd-info-icon">
                <CalendarDays size={14} color="#c2602a" />
              </div>
              <p className="pd-info-lbl">Date & time</p>
              <p className="pd-info-val">{formatDateTime(planDate)}</p>
            </div>
            <div className="pd-info-tile">
              <div className="pd-info-icon">
                <Users size={14} color="#c2602a" />
              </div>
              <p className="pd-info-lbl">Group size</p>
              <p className="pd-info-val">{joinedCount} joined</p>
              <p className="pd-info-sub">{spotsOpen} spots open</p>
            </div>
          </div>

          {/* 📍 LOCATION */}
          {mapLink && (
            <a
              href={mapLink}
              target="_blank"
              className="bg-white border rounded-xl p-3 flex items-center gap-3"
            >
              <MapPin className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Meetup location</p>
                <p className="text-sm font-medium">
                  {plan.location_name}, {plan.city}
                </p>
              </div>
              <ExternalLink size={14} />
            </a>
          )}

          {/* Participants progress */}
          <div className="pd-card pd-cp">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1410" }}>
                  {joinedCount} / {maxSpots} spots filled
                </p>
                <p style={{ fontSize: 11, color: "#8b7b6d", marginTop: 1 }}>
                  {spotsOpen === 0
                    ? "Fully booked"
                    : `${spotsOpen} ${spotsOpen === 1 ? "spot" : "spots"} left`}
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: fillPercent >= 80 ? "#b45309" : "#166534",
                  background: fillPercent >= 80 ? "#fef3c7" : "#dcfce7",
                  padding: "3px 9px",
                  borderRadius: 100,
                }}
              >
                {fillPercent}% full
              </span>
            </div>
            <div className="pd-prog-track">
              <div
                className="pd-prog-fill"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            {joinedParticipants.length > 0 && (
              <div className="pd-avatars">
                {joinedParticipants.slice(0, 6).map((p: any) => (
                  <img
                    key={p.user_id}
                    src={
                      p.user?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${p.user?.name || "U"}`
                    }
                    className="pd-av"
                    alt={p.user?.name || "Member"}
                  />
                ))}
                {joinedParticipants.length > 6 && (
                  <span className="pd-av-more">
                    +{joinedParticipants.length - 6}
                  </span>
                )}
                <span className="pd-av-names">
                  {joinedParticipants
                    .slice(0, 2)
                    .map((p: any) => p.user?.name?.split(" ")[0])
                    .join(", ")}
                  {joinedParticipants.length > 2
                    ? ` & ${joinedParticipants.length - 2} more`
                    : ""}
                </span>
              </div>
            )}
          </div>

          {/* ── Unified cost / split card ── */}
          {!!plan.cost_amount && (
            <div className="pd-card pd-cp">
              <div className="pd-cost-header">
                <div>
                  <p className="pd-cost-lbl">
                    {plan.final_amount ? "Final split" : "Estimated split"}
                  </p>
                  <p className="pd-cost-amount">
                    ₹{(perPersonShare || 0).toFixed(0)}
                    <span className="pd-cost-per"> /person</span>
                  </p>
                </div>
                <span
                  className={`pd-cost-badge${plan.final_amount ? " final" : ""}`}
                >
                  {plan.final_amount ? "✓ Finalised" : "Est."}
                </span>
              </div>
              <p className="pd-cost-note">
                <Info size={12} />
                Total ₹{activeAmount?.toFixed(0)} · {joinedCount} people
                {plan.final_amount ? " · confirmed by host" : " · may change"}
              </p>

              {/* Participant pay actions — only when final amount set */}
              {isParticipant && !!plan.final_amount && (
                <div className="pd-pay-row">
                  <a href={upiLink || "#"} className="pd-pay-upi">
                    💳 Pay via UPI
                  </a>
                  <button
                    type="button"
                    className="pd-settle-btn"
                    onClick={markSettled}
                    disabled={busy === "settle"}
                  >
                    ✓ Mark settled
                  </button>
                </div>
              )}

              {/* Settlement tracker — host + participants when final set */}
              {(isHost || isParticipant) &&
                !!plan.final_amount &&
                joinedParticipants.length > 0 && (
                  <>
                    <p className="pd-tracker-header">Settlement tracker</p>
                    {joinedParticipants.map((p: any) => {
                      const settled = settlements.find(
                        (s) => String(s.user_id) === String(p.user_id),
                      )?.settled;
                      return (
                        <div key={p.user_id} className="pd-settle-row">
                          <div className="pd-settle-person">
                            <img
                              src={
                                p.user?.avatar_url ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${p.user?.name || "U"}`
                              }
                              className="pd-settle-av"
                              alt={p.user?.name}
                            />
                            <span className="pd-settle-name">
                              {p.user?.name || "Member"}
                            </span>
                          </div>
                          <span
                            className="pd-settle-status"
                            style={{
                              color: settled ? "#166534" : "#92400e",
                              background: settled ? "#dcfce7" : "#fef3c7",
                            }}
                          >
                            {settled ? (
                              <>
                                <CheckCircle2 size={10} /> Settled
                              </>
                            ) : (
                              <>
                                <AlertCircle size={10} /> Pending
                              </>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
            </div>
          )}

          {/* WhatsApp */}
          {(isHost || isParticipant) && plan.whatsapp_link && (
            <a
              href={plan.whatsapp_link}
              target="_blank"
              rel="noreferrer"
              className="pd-wa"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-whatsapp"
                viewBox="0 0 16 16"
              >
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
              </svg>{" "}
              Open WhatsApp group
            </a>
          )}

          {/* Host controls */}
          {isHost && (
            <div className="pd-card pd-cp">
              <p className="pd-ctrl-lbl">Host controls</p>
              <div className="pd-ctrl-grid">
                <Link
                  href={`/plans/${plan.id}/edit`}
                  className="pd-ctrl-btn cc-edit"
                >
                  <Pencil size={13} /> Edit plan
                </Link>
                {plan.require_approval && (
                  <button
                    type="button"
                    onClick={loadRequests}
                    className="pd-ctrl-btn cc-manage"
                  >
                    <ShieldCheck size={13} /> Requests
                    {pendingRequests.length > 0 && (
                      <span className="pd-ctrl-badge">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>
                )}
                {(effectiveStatus === "open" ||
                  effectiveStatus === "expired") &&(plan.cost_amount>0 || plan.final_amount>0) && (
                  <button
                    type="button"
                    onClick={confirmFinalAmount}
                    disabled={busy === "final"}
                    className="pd-ctrl-btn cc-final pd-ctrl-full"
                  >
                    <Wallet size={13} /> Confirm final amount
                  </button>
                )}
                <button
                  type="button"
                  onClick={closePlan}
                  disabled={busy === "close"}
                  className="pd-ctrl-btn cc-close"
                >
                  <Lock size={13} /> Close plan
                </button>
                <button
                  type="button"
                  onClick={deletePlan}
                  disabled={busy === "delete"}
                  className="pd-ctrl-btn cc-delete"
                >
                  <Trash2 size={13} /> Delete plan
                </button>
              </div>
            </div>
          )}

          {/* Pending requests panel */}
          {showRequests && pendingRequests.length > 0 && (
            <div className="pd-card">
              <p className="pd-req-header">
                Pending requests · {pendingRequests.length}
              </p>
              {pendingRequests.map((req: any) => (
                <div key={req.user_id} className="pd-req-row">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <img
                      src={
                        req.user?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${req.user?.name || "U"}`
                      }
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "1.5px solid #e9dfd3",
                      }}
                      alt={req.user?.name}
                    />
                    <span style={{ fontSize: 13, color: "#1a1410" }}>
                      {req.user?.name || "User"}
                    </span>
                  </div>
                  <div className="pd-req-actions">
                    <button
                      type="button"
                      onClick={() => actRequest(req.user_id, "approve")}
                      className="pd-req-accept"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => actRequest(req.user_id, "decline")}
                      className="pd-req-decline"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{ paddingBottom: 8 }}>
            {isParticipant && !isHost && (
              <div className="pd-joined-badge">
                <CheckCircle2 size={12} /> You're in this plan!
              </div>
            )}
            {isHost ? null : isParticipant ? (
              <button
                type="button"
                onClick={leave}
                disabled={busy === "leave"}
                className="pd-btn-leave"
              >
                Leave plan
              </button>
            ) : (
              <button
                type="button"
                onClick={join}
                disabled={
                  busy === "join" ||
                  effectiveStatus !== "open" ||
                  (plan.female_only && plan.current_user_gender !== "female")
                }
                className="pd-btn-join"
              >
                {plan.female_only && plan.current_user_gender !== "female"
                  ? "This plan is for women only"
                  : busy === "join"
                    ? "Please wait…"
                    : statusLabel(effectiveStatus)}
              </button>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    </>
  );
}

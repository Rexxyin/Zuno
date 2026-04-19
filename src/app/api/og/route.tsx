import { ImageResponse } from "next/og";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "edge";

// Fallback hero if plan has no image
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1200&auto=format&fit=crop";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");
  if (!planId) return new Response("Missing planId", { status: 400 });

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data: plan } = await supabase
    .from("plans")
    .select(
      `
      id, title, category, datetime, location_name, max_people, image_url,
      host:users!plans_host_id_fkey(name, avatar_url),
      participants:plan_participants(status)
    `,
    )
    .eq("id", planId)
    .single();

  if (!plan) return new Response("Plan not found", { status: 404 });

  const joined = (plan.participants || []).filter(
    (p: any) => p.status === "joined",
  ).length;
  const host = Array.isArray(plan.host) ? plan.host[0] : plan.host;
  const spotsLeft = Math.max(Number(plan.max_people || 0) - joined, 0);
  const spotsTotal = Number(plan.max_people || 0);

  const dateText = new Date(plan.datetime).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const heroImage = plan.image_url || FALLBACK_IMAGE;
  const avatarSrc =
    host?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(host?.name || "Host")}`;
  const fillPercent =
    spotsTotal > 0 ? Math.round((joined / spotsTotal) * 100) : 0;
  const isFull = spotsLeft === 0;

  // Category → emoji mapping for a visual touch
  const categoryEmoji: Record<string, string> = {
    travel: "✈️",
    food: "🍽️",
    trek: "🥾",
    hike: "🏔️",
    sports: "⚽",
    music: "🎵",
    art: "🎨",
    photography: "📷",
    coffee: "☕",
    party: "🎉",
    camping: "⛺",
    cycling: "🚴",
    other: "📍",
  };
  const emoji = categoryEmoji[(plan.category || "").toLowerCase()] || "📍";

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        fontFamily: "Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* ── Background hero image ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImage}
        width={1200}
        height={630}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      {/* ── Gradient overlays ── */}
      {/* Bottom heavy gradient for text legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(8,4,2,0.92) 0%, rgba(8,4,2,0.60) 40%, rgba(8,4,2,0.18) 70%, rgba(8,4,2,0.08) 100%)",
        }}
      />
      {/* Left-edge vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(8,4,2,0.55) 0%, transparent 55%)",
        }}
      />

      {/* ── Content layer ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 52px",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Zuno brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 9999,
              padding: "8px 18px",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 3,
                color: "white",
                fontFamily: "Georgia, serif",
              }}
            >
              ZUNO
            </div>
          </div>

          {/* Spots pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isFull
                ? "rgba(239,68,68,0.22)"
                : "rgba(34,197,94,0.18)",
              border: `1px solid ${isFull ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.35)"}`,
              borderRadius: 9999,
              padding: "9px 20px",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: isFull ? "#ef4444" : "#22c55e",
              }}
            />
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "white",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {isFull
                ? "Fully booked"
                : `${spotsLeft} of ${spotsTotal} spots left`}
            </div>
          </div>
        </div>

        {/* Middle — title block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            maxWidth: 860,
          }}
        >
          {/* Category badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 9999,
                padding: "5px 14px",
                fontSize: 16,
                color: "rgba(255,255,255,0.9)",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {emoji} {plan.category || "Plan"}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize:
                plan.title.length > 40 ? 52 : plan.title.length > 25 ? 62 : 72,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.08,
              letterSpacing: -1,
              fontFamily: "Georgia, serif",
              // Clamp to 2 lines
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {plan.title}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 16,
              fontSize: 22,
              color: "rgba(255,255,255,0.78)",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            <span>📅</span>
            <span>{dateText}</span>
            {plan.location_name && (
              <>
                <span style={{ opacity: 0.4, fontSize: 18, margin: "0 4px" }}>
                  •
                </span>
                <span>📍</span>
                <span>{plan.location_name}</span>
              </>
            )}
          </div>
        </div>

        {/* Bottom — host + progress */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {/* Host */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              width={52}
              height={52}
              style={{
                borderRadius: 9999,
                border: "2.5px solid rgba(255,255,255,0.5)",
                objectFit: "cover",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "system-ui",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                HOSTED BY
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: "white",
                  fontFamily: "Georgia, serif",
                  fontWeight: 700,
                }}
              >
                {host?.name || "Anonymous"}
              </div>
            </div>
          </div>

          {/* Attendance progress bar */}
          {spotsTotal > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "system-ui",
                  letterSpacing: 0.5,
                }}
              >
                {joined} joined · {fillPercent}% full
              </div>
              {/* Track */}
              <div
                style={{
                  width: 200,
                  height: 6,
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  overflow: "hidden",
                }}
              >
                {/* Fill */}
                <div
                  style={{
                    width: `${fillPercent}%`,
                    height: "100%",
                    borderRadius: 9999,
                    background: isFull
                      ? "linear-gradient(90deg, #ef4444, #f97316)"
                      : "linear-gradient(90deg, #f97316, #fbbf24)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}

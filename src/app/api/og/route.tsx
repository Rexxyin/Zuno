import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") || "Discover real plans";
  const city = searchParams.get("city") || "";
  const date = searchParams.get("date") || "";
  const spots = searchParams.get("spots") || "";
  const bgImageUrl = searchParams.get("image");

  const imageUrl =
    bgImageUrl ||
    "https://images.unsplash.com/photo-1616432119481-2876a5d92249" +
      "?w=1200&q=85&auto=format&fit=crop&crop=center";

  // Fetch and convert to base64 for edge compatibility
  const res = await fetch(imageUrl);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const bgSrc = `data:image/jpeg;base64,${base64}`;

  const words = title.split(" ");
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(" ");
  const line2 = words.slice(mid).join(" ");

  return new ImageResponse(
    <div
      style={{
        width: 1080,
        height: 1350,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        background: "#0a0a0a",
      }}
    >
      {/* === BACKGROUND PHOTO === */}
      <img
        src={bgSrc}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 40%",
          filter: "brightness(0.55) saturate(1.2) contrast(1.1)",
        }}
      />

      {/* === PREMIUM GRADIENT OVERLAY === */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(20,20,40,0.5) 35%, rgba(10,10,25,0.3) 60%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* === DYNAMIC GLOW EFFECT === */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(ellipse 800px 600px at 50% 30%, rgba(255, 213, 74, 0.08) 0%, transparent 70%)",
        }}
      />

      {/* === ENHANCED VIGNETTE === */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* === CONTENT WRAPPER === */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          height: "100%",
          padding: "60px 70px 72px",
          gap: 0,
        }}
      >
        {/* ─── TOP: BRAND ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            marginBottom: "-40px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Left line */}
          <div
            style={{
              display: "flex",
              height: 2,
              width: 100,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 100%)",
            }}
          />
          {/* Diamond ornament - Left */}
          <div
            style={{
              display: "flex",
              width: 12,
              height: 12,
              background: "linear-gradient(135deg, #FFD54A 0%, #FFC107 100%)",
              transform: "rotate(45deg)",
              boxShadow: "0 0 20px rgba(255, 213, 74, 0.4)",
            }}
          />
          {/* Brand name */}
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontWeight: 800,
              color: "white",
              letterSpacing: "8px",
              textTransform: "uppercase",
              fontFamily: "serif",
              textShadow:
                "0 4px 20px rgba(255, 213, 74, 0.3), 0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            zuno
          </div>
          {/* Diamond ornament - Right */}
          <div
            style={{
              display: "flex",
              width: 12,
              height: 12,
              background: "linear-gradient(135deg, #FFD54A 0%, #FFC107 100%)",
              transform: "rotate(45deg)",
              boxShadow: "0 0 20px rgba(255, 213, 74, 0.4)",
            }}
          />
          {/* Right line */}
          <div
            style={{
              display: "flex",
              height: 2,
              width: 100,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* ─── CENTER: TITLE ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 0,
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Line 1 — White italic with enhanced shadow */}
          <div
            style={{
              display: "flex",
              fontSize: 100,
              fontWeight: 800,
              fontStyle: "italic",
              color: "white",
              lineHeight: 0.95,
              letterSpacing: "-3px",
              textShadow:
                "0 8px 32px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            {line1}
          </div>

          {/* Line 2 — Vibrant Yellow italic with glow */}
          <div
            style={{
              display: "flex",
              fontSize: 100,
              fontWeight: 800,
              fontStyle: "italic",
              color: "#FFE54A",
              lineHeight: 0.95,
              textShadow:
                "0 8px 40px rgba(255, 213, 74, 0.5), 0 4px 20px rgba(255,180,0,0.4), 0 2px 8px rgba(0,0,0,0.6)",
              letterSpacing: "-3px",
            }}
          >
            {line2}
          </div>

          {/* ─── META ROW: Date + Location ─── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 50,
              gap: 0,
              background: "rgba(0,0,0,0.5)",
              borderRadius: 120,
              border: "2px solid rgba(255, 213, 74, 0.4)",
              overflow: "hidden",
              boxShadow:
                "0 8px 32px rgba(255, 213, 74, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Date pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "20px 38px",
                fontSize: 28,
                color: "white",
                fontWeight: 600,
                position: "relative",
              }}
            >
              {/* Calendar icon */}
              <div
                style={{
                  display: "flex",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "3px solid rgba(255, 213, 74, 0.7)",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: "rgba(255, 213, 74, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#FFD54A",
                  }}
                >
                  31
                </div>
              </div>
              {date}
            </div>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                width: 2,
                height: 50,
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(255, 213, 74, 0.3) 50%, transparent 100%)",
              }}
            />

            {/* Location pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "20px 38px",
                fontSize: 28,
                color: "white",
                fontWeight: 600,
              }}
            >
              {/* Pin icon */}
              <div style={{ fontSize: 32 }}>📍</div>
              <span>{city}</span>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
            marginTop: "-80px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* SPOTS BADGE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              border: "3px solid rgba(255, 213, 74, 0.8)",
              padding: "28px 56px",
              borderRadius: 30,
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(20,10,0,0.3) 100%)",
              boxShadow:
                "0 12px 48px rgba(255, 213, 74, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* People icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                position: "relative",
                width: 52,
                height: 42,
              }}
            >
              {/* Person 1 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "absolute",
                  left: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.7)",
                    background: "transparent",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    width: 24,
                    height: 18,
                    borderRadius: "12px 12px 0 0",
                    border: "2px solid rgba(255,255,255,0.7)",
                    borderBottom: "none",
                    marginTop: 3,
                    background: "transparent",
                  }}
                />
              </div>
              {/* Person 2 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "absolute",
                  left: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.7)",
                    background: "transparent",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    width: 24,
                    height: 18,
                    borderRadius: "12px 12px 0 0",
                    border: "2px solid rgba(255,255,255,0.7)",
                    borderBottom: "none",
                    marginTop: 3,
                    background: "transparent",
                  }}
                />
              </div>
              {/* Person 3 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "absolute",
                  left: 34,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.7)",
                    background: "transparent",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    width: 24,
                    height: 18,
                    borderRadius: "12px 12px 0 0",
                    border: "2px solid rgba(255,255,255,0.7)",
                    borderBottom: "none",
                    marginTop: 3,
                    background: "transparent",
                  }}
                />
              </div>
            </div>

            {/* Number */}
            <div
              style={{
                display: "flex",
                fontSize: 92,
                fontWeight: 900,
                color: "#FFD54A",
                lineHeight: 1,
                textShadow: "0 4px 16px rgba(255, 213, 74, 0.4)",
              }}
            >
              {spots}
            </div>

            {/* Label */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 800,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                }}
              >
                SPOTS
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "rgba(255,255,255,0.75)",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                LEFT
              </div>
            </div>
          </div>

          {/* CTA BUTTON */}
          <div
            style={{
              display: "flex",
              background: "linear-gradient(135deg, #FFE54A 0%, #FFD54A 100%)",
              color: "#0a0a0a",
              padding: "26px 92px",
              borderRadius: 120,
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: "2px",
              textTransform: "uppercase",
              boxShadow:
                "0 16px 48px rgba(255, 213, 74, 0.35), 0 8px 24px rgba(0,0,0,0.3)",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            Join This Plan
          </div>

          {/* FOOTER LINK */}
          {/* <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 20,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "1px",
              }}
            >
              zuno.app/p/{slug}
            </div> */}
        </div>
      </div>
    </div>,
    {
      width: 1080,
      height: 1350,
    },
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") || "Discover real plans";
  const city = searchParams.get("city") || "";
  const date = searchParams.get("date") || "";
  const spots = searchParams.get("spots") || "";

  const words = title.split(" ");
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(" ");
  const line2 = words.slice(mid).join(" ");

  const imageUrl =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80&auto=format&fit=crop";

  const res = await fetch(imageUrl);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const bg = `data:image/jpeg;base64,${base64}`;

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative"}}>
        
        {/* BG */}
        <img
          src={bg}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.55)",
          }}
        />

        {/* overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9))",
          }}
        />

        {/* CONTENT */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 60px",
            width: "100%",
          }}
        >
          {/* ───────── TOP ───────── */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            
            {/* BRAND + TAGLINE */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    width: 10,
                    height: 10,
                    background: "#FFD54A",
                    transform: "rotate(45deg)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#FFD54A",
                    letterSpacing: "4px",
                  }}
                >
                  ZUNO
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  marginTop: 6,
                  color:'white'
                }}
              >
                Discover plans with real people
              </div>
            </div>

            {/* DATE + LOCATION PILL */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 999,
                border: "2px solid rgba(255,213,74,0.5)",
                background: "rgba(0,0,0,0.5)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  color: "white",
                  fontSize: 16,
                }}
              >
                📅 <span className="ml-6">{date}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  width: 1,
                  height: 24,
                  background: "rgba(255,213,74,0.3)",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  color: "white",
                  fontSize: 16,
                }}
              >
                📍 {city}
              </div>
            </div>
          </div>

          {/* ───────── TITLE ───────── */}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: "70%" }}>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: "white" }}>
              {line1}
            </div>

            {line2 && (
              <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: "#FFD54A" }}>
                {line2}
              </div>
            )}
          </div>

          {/* ───────── BOTTOM ───────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            
            {/* SPOTS CARD */}
            {spots && spots !== "0" ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "16px 26px",
                  borderRadius: 20,
                  border: "2px solid rgba(255,213,74,0.7)",
                  background: "rgba(0,0,0,0.5)",
                }}
              >
                <div style={{ display: "flex", fontSize: 48, color: "#FFD54A", fontWeight: 900 }}>
                  {spots}
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 14, color: "white" }}>
                    SPOTS
                  </div>
                  <div style={{ display: "flex", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    LEFT
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex" }} />
            )}

            {/* CTA */}
            <div
              style={{
                display: "flex",
                background:
                  "linear-gradient(135deg, #FFE54A 0%, #FFD54A 100%)",
                color: "#0a0a0a",
                padding: "14px 28px",
                borderRadius: 999,
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              Join This Plan →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
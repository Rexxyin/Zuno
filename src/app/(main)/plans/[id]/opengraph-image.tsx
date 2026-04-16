import { headers } from "next/headers";
import { ImageResponse } from "next/og";

export const alt = "Plan preview";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type OGProps = {
  params: Promise<{ id: string }>;
};

function getBaseUrl(headerList: Headers): string {
  const forwardedProto = headerList.get("x-forwarded-proto");
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = headerList.get("host");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  if (host) {
    return `${forwardedProto ?? (host.includes("localhost") ? "http" : "https")}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export default async function OGImage({ params }: OGProps) {
  const { id } = await params;
  const headerList = await headers();
  const baseUrl = getBaseUrl(headerList);

  const res = await fetch(`${baseUrl}/api/plans/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(135deg, #1b1713 0%, #3e2a1f 100%)",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 58, fontWeight: 700 }}>Zuno Plans</div>
          <div style={{ marginTop: 16, fontSize: 28, opacity: 0.8 }}>
            Find people. Make plans. Go out.
          </div>
        </div>
      ),
      size,
    );
  }

  const plan = await res.json();
  const date = plan?.datetime ? new Date(plan.datetime) : null;
  const formattedDate = date
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Date to be announced";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(145deg, #120f0d 0%, #2f1c14 55%, #4f2f22 100%)",
          color: "#fff7ef",
          padding: "48px 56px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(14, 11, 9, 0.48)",
            padding: 44,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                padding: "10px 20px",
                fontSize: 22,
                letterSpacing: 1,
              }}
            >
              ZUNO PLAN
            </div>
            <div style={{ fontSize: 22, opacity: 0.85 }}>{plan?.city || "Local meetup"}</div>
          </div>

          <div style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 78, lineHeight: 1.04, fontWeight: 700 }}>
              {String(plan?.title || "Untitled plan").slice(0, 80)}
            </div>
            <div style={{ marginTop: 18, fontSize: 31, opacity: 0.88 }}>
              {String(plan?.description || "Join this plan on Zuno").slice(0, 140)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
            <div
              style={{
                borderRadius: 16,
                background: "rgba(255,255,255,0.12)",
                padding: "14px 20px",
                fontSize: 26,
              }}
            >
              📅 {formattedDate}
            </div>
            <div
              style={{
                borderRadius: 16,
                background: "rgba(255,255,255,0.12)",
                padding: "14px 20px",
                fontSize: 26,
              }}
            >
              📍 {plan?.location_name || "Location TBA"}
            </div>
            <div
              style={{
                borderRadius: 16,
                background: "#ff8f4d",
                color: "#2b1205",
                padding: "14px 20px",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {plan?.max_people || "∞"} spots
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

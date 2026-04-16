import { ImageResponse } from "next/og";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const alt = "Plan preview";
export const size = {
  width: 1200,
  height: 630,
};

export const runtime = "edge";

export default async function OG({ params }: any) {
  const { id } = await params;
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", id)
    .single();

  if (!plan) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
        Plan not found
      </div>,
      size
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#faf8f4",
        padding: 40,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Title */}
      <div style={{ fontSize: 64, fontWeight: 700 }}>{plan.title}</div>

      {/* Date */}
      <div style={{ fontSize: 32 }}>
        {new Date(plan.datetime).toDateString()}
      </div>

      {/* Location */}
      <div style={{ fontSize: 28 }}>📍 {plan.location_name}</div>

      {/* Footer */}
      <div style={{ fontSize: 24 }}>{plan.max_people} spots • Join now</div>
    </div>,
    size,
  );
}

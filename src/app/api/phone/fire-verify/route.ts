import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureNotBanned, logAudit } from "@/lib/server/safety";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { banned } = await ensureNotBanned(supabase, auth.user.id);
  if (banned)
    return NextResponse.json({ error: "Account restricted" }, { status: 403 });

  const body = await request.json();
  const phone = String(body.phone || "").trim();

  if (!phone)
    return NextResponse.json(
      { error: "Phone is required" },
      { status: 400 }
    );

  const { error } = await supabase
    .from("users")
    .update({
      phone_number: phone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      phone_verification_provider: "firebase_otp",
    })
    .eq("id", auth.user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(supabase, {
    actorId: auth.user.id,
    eventType: "phone_verified",
    entityType: "user",
    entityId: auth.user.id,
    metadata: { provider: "firebase" },
  });

  return NextResponse.json({ ok: true });
}
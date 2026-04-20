"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Camera, ChevronLeft, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { generateAvatarSeed, getUserAvatarUrl } from "@/lib/avatar";
import { toast } from "@/components/ui/toast";
import Link from "next/link";
import { generateUpiLink, normalizeUpiId } from "@/lib/upi";

type EditableProfile = {
  name: string;
  email: string;
  avatarUrl: string;
  instagramUrl: string;
  gpayLink: string;
  upiPayeeName: string;
  avatarSeed: string;
};

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);

  const [edit, setEdit] = useState<EditableProfile>({
    name: "",
    avatarUrl: "",
    instagramUrl: "",
    gpayLink: "",
    upiPayeeName: "",
    email: "",
    avatarSeed: "",
  });

  const isOwnProfile =
    !!authUserId && (id === "me" || !id || id === authUserId);

  const applyProfileToForm = (profile: User) => {
    setEdit({
      name: profile.name || "",
      avatarUrl: profile.avatar_url || "",
      instagramUrl: profile.instagram_url || "",
      gpayLink: profile.gpay_link || "",
      upiPayeeName: profile.upi_payee_name || "",
      email: (profile as any).email || "",
      avatarSeed: profile.avatar_seed || "",
    });
  };

  const loadProfile = async () => {
    setLoading(true);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push("/login");
      return;
    }

    setAuthUserId(authUser.id);

    const targetId = isOwnProfile ? authUser.id : id;
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", targetId)
      .single();
    if (data && isOwnProfile) (data as any).email = authUser.email || "";

    if (!data) {
      setUser(null);
      setLoading(false);
      return;
    }

    let profile = data as User;

    if (!profile.avatar_seed) {
      const nextSeed = generateAvatarSeed();
      profile = { ...profile, avatar_seed: nextSeed };

      if (isOwnProfile) {
        await supabase
          .from("users")
          .update({ avatar_seed: nextSeed })
          .eq("id", targetId);
      }
    }

    setUser(profile);
    setPhoneInput((profile as any).phone_number || "");
    applyProfileToForm(profile);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [id, isOwnProfile]);

  const displayedAvatar = useMemo(
    () =>
      getUserAvatarUrl({
        avatarUrl: edit.avatarUrl,
        avatarSeed: edit.avatarSeed,
        fallbackSeed: user?.id || user?.name,
      }),
    [edit.avatarSeed, edit.avatarUrl, user?.id, user?.name],
  );

  const handleAvatarRegenerate = () => {
    const nextSeed = generateAvatarSeed();
    setEdit((prev) => ({ ...prev, avatarSeed: nextSeed }));
    toast.success("Avatar refreshed");
  };

  const handleSave = async () => {
    if (!edit.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const updates = {
      name: edit.name.trim(),
      avatar_url: edit.avatarUrl.trim() || null,
      avatar_seed: edit.avatarSeed.trim() || generateAvatarSeed(),
      instagram_url: edit.instagramUrl.trim() || null,
      gpay_link: edit.gpayLink.trim() || null,
      upi_payee_name: edit.upiPayeeName.trim() || null,
    };

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", auth.user.id);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    toast.success("Profile saved");
    setUser({ ...user, ...updates } as User);
    setSaving(false);
  };

  const sendOtp = async () => {
    if (!phoneInput.trim()) return toast.error('Enter phone number first')
    setSendingOtp(true)
    const res = await fetch('/api/phone/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneInput.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) toast.error(data.error || 'Unable to send OTP')
    else toast.success('OTP sent')
    setSendingOtp(false)
  }

  const verifyOtp = async () => {
    if (!otpCode.trim()) return toast.error('Enter OTP code')
    setVerifyingOtp(true)
    const res = await fetch('/api/phone/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneInput.trim(), token: otpCode.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) toast.error(data.error || 'Unable to verify OTP')
    else {
      toast.success('Phone verified')
      setUser((prev) => (prev ? ({ ...prev, phone_verified: true, phone_number: phoneInput.trim() } as User) : prev))
      setOtpCode('')
    }
    setVerifyingOtp(false)
  }

  const handleBlockToggle = async () => {
    if (!user || !authUserId || isOwnProfile) return
    const shouldBlock = confirm("Block this user? You will no longer see each other's plans or interactions.")
    if (!shouldBlock) return
    setBlockBusy(true)
    const res = await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedId: user.id }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) toast.error(data.error || 'Unable to block user')
    else toast.success('User blocked')
    setBlockBusy(false)
  }

  const reportUser = async () => {
    if (!user || isOwnProfile) return
    const reason = prompt('Report reason: fake_profile | harassment | unsafe_plan | spam | other', 'fake_profile') || 'other'
    const details = prompt('Add details (optional)', '') || ''
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'profile', targetUserId: user.id, reason, details }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) toast.error(data.error || 'Unable to submit report')
    else toast.success(data.message || "Thanks, we'll review this.")
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen bg-[#faf8f4]" />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <p className="text-sm text-[#7a6a64]">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8f4] min-h-screen pb-24">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-[#faf8f4]/90 backdrop-blur border-b border-black/5 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-black/5"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-[14px] font-medium">Profile</p>
        <div className="w-8" />
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* PROFILE CARD */}
        <div className="rounded-2xl bg-[#EFE7DA] p-5 text-center">
          <div className="relative mx-auto h-24 w-24 mb-3">
            <img
              src={displayedAvatar}
              className="h-full w-full rounded-full object-cover"
            />

            {isOwnProfile && (
              <button
                onClick={handleAvatarRegenerate}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-black text-white flex items-center justify-center"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="text-[18px] font-medium text-[#2b2b2b]">{user.name}</p>

          {user.phone_verified && (
            <p className="text-xs text-emerald-600 mt-1">✅ Phone verified</p>
          )}
          {!user.avatar_url && (
            <p className="text-xs text-amber-700 mt-1">Profiles with photos are more trusted</p>
          )}
          <p className="text-xs mt-1 text-[#7a6a64]">{user.name && user.age ? "🟢 Complete profile" : "🟡 Incomplete profile"}</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Reliable", value: `${user.reliability_score}%` },
            { label: "Joined", value: user.total_joined },
            { label: "Completed", value: user.total_attended },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-[#EFE7DA] p-3 text-center"
            >
              <p className="text-[15px] font-medium">{item.value}</p>
              <p className="text-[11px] text-[#7a6a64]">{item.label}</p>
            </div>
          ))}
        </div>

        {/* EDIT SECTION */}
        {isOwnProfile && (
          <div className="rounded-2xl bg-white p-4 space-y-3 border border-black/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> Profile details
              </p>
            </div>

            <input
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              placeholder="Name"
              className="w-full bg-[#f6f2ec] rounded-xl px-3 py-2 text-sm"
            />

            <input
              value={edit.avatarUrl}
              placeholder="Avatar url"
              onChange={(e) => setEdit({ ...edit, avatarUrl: e.target.value })}
              className="w-full bg-[#f6f2ec] rounded-xl px-3 py-2 text-sm"
            />

            <input
              value={edit.instagramUrl}
              placeholder="Instagram Url"
              onChange={(e) =>
                setEdit({ ...edit, instagramUrl: e.target.value })
              }
              className="w-full bg-[#f6f2ec] rounded-xl px-3 py-2 text-sm"
            />

            <input
              value={edit.email}
              placeholder="Email Id"
              readOnly
              className="w-full bg-[#f6f2ec] rounded-xl px-3 py-2 text-sm text-gray-400"
            />

            <div className="rounded-xl bg-[#f6f2ec] p-3 space-y-2">
              <p className="text-xs text-[#6f6258]">Phone verification helps build trust with others.</p>
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Phone (+91...)"
                className="w-full bg-white rounded-lg px-3 py-2 text-sm"
              />
              {!user.phone_verified && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={sendOtp} className="rounded-lg bg-[#5A3825] text-white py-2 text-xs">{sendingOtp ? 'Sending...' : 'Send OTP'}</button>
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter OTP"
                    className="rounded-lg bg-white px-2 py-2 text-xs"
                  />
                </div>
              )}
              {!user.phone_verified && (
                <button onClick={verifyOtp} className="w-full rounded-lg border border-[#d7c6b5] py-2 text-xs">{verifyingOtp ? 'Verifying...' : 'Verify phone'}</button>
              )}
              {user.phone_verified && <p className="text-xs text-emerald-700">✅ Phone verified badge active</p>}
            </div>

            <input
              value={edit.gpayLink}
              placeholder="UPI ID"
              onChange={(e) => setEdit({ ...edit, gpayLink: e.target.value })}
              className="w-full bg-[#f6f2ec] rounded-xl px-3 py-2 text-sm"
            />

            <input
              placeholder="Payee Name"
              value={edit.upiPayeeName}
              onChange={(e) =>
                setEdit({ ...edit, upiPayeeName: e.target.value })
              }
              className="w-full bg-[#f6f2ec] rounded-xl px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              This name appears when someone pays you via UPI, make sure it
              matches exactly.
            </p>
            <button
              onClick={handleSave}
              className="w-full bg-black text-white py-2.5 rounded-full text-sm"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>

            <button
              onClick={handleSignOut}
              className="w-full text-red-600 text-sm py-2"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        )}

        {/* EXTERNAL ACTIONS */}
        {!isOwnProfile && (
          <div className="rounded-2xl bg-white p-4 border border-black/5 space-y-2">
            <button onClick={handleBlockToggle} className="w-full rounded-xl border border-[#dbcab7] py-2 text-sm">{blockBusy ? 'Please wait...' : 'Block user'}</button>
            <button onClick={reportUser} className="w-full rounded-xl border border-[#dbcab7] py-2 text-sm">Report user</button>
          </div>
        )}

        {!isOwnProfile && (user.instagram_url || user.gpay_link) && (
          <div className="flex gap-2">
            {user.instagram_url && (
              <a
                href={user.instagram_url}
                target="_blank"
                className="flex-1 text-center bg-pink-500 text-white py-2 rounded-xl text-xs"
              >
                Instagram
              </a>
            )}

            {user.gpay_link && (
              <a
                href={
                  generateUpiLink({ upiId: normalizeUpiId(user.gpay_link) }) ||
                  "#"
                }
                className="flex-1 text-center bg-green-600 text-white py-2 rounded-xl text-xs"
              >
                Pay via UPI
              </a>
            )}
          </div>
        )}
      </div>

      <p className="px-6 pb-3 text-center text-[11px] text-[#8a7a70]">Impersonating others or using misleading identity is prohibited. <Link className="underline" href="/terms">Terms</Link></p>
      <BottomNav />
    </div>
  );
}

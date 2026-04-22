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
import { ActionDialog } from "@/components/ui/ActionDialog";

type EditableProfile = {
  name: string;
  email: string;
  avatarUrl: string;
  instagramUrl: string;
  gpayLink: string;
  upiPayeeName: string;
  avatarSeed: string;
  gender?: string;
};

const REPORT_REASONS = [
  "fake_profile",
  "harassment",
  "unsafe_plan",
  "spam",
  "other",
];

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
  const [blockBusy, setBlockBusy] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("fake_profile");
  const [reportDetails, setReportDetails] = useState("");
  const [showAvatarActions, setShowAvatarActions] = useState(false);

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
      gender: profile.gender || "",
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
      if (isOwnProfile)
        await supabase
          .from("users")
          .update({ avatar_seed: nextSeed })
          .eq("id", targetId);
    }

    setUser(profile);
    applyProfileToForm(profile);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [id, isOwnProfile]);

  // Auto-save avatar URL when it changes
  useEffect(() => {
    if (!isOwnProfile || !authUserId) return;
    if (!edit.avatarUrl || edit.avatarUrl === user?.avatar_url) return;

    const saveAvatar = async () => {
      const { error } = await supabase
        .from("users")
        .update({ avatar_url: edit.avatarUrl })
        .eq("id", authUserId);

      if (error) {
        console.error("Avatar auto-save failed:", error);
      } else {
        setUser((prev) => prev ? { ...prev, avatar_url: edit.avatarUrl } : null);
      }
    };

    saveAvatar();
  }, [edit.avatarUrl]);

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
    if (!edit.name.trim()) return toast.error("Name is required");

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
      gender: edit.gender || null,
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

  const handleConfirmBlock = async () => {
    if (!user || !authUserId || isOwnProfile) return;
    setBlockBusy(true);
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId: user.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) toast.error(data.error || "Unable to block user");
    else {
      toast.success("User blocked");
      setShowBlockDialog(false);
    }
    setBlockBusy(false);
  };

  const submitReport = async () => {
    if (!user || isOwnProfile) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "profile",
        targetUserId: user.id,
        reason: reportReason,
        details: reportDetails.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) toast.error(data.error || "Unable to submit report");
    else {
      toast.success(data.message || "Thanks, we'll review this.");
      setShowReportDialog(false);
      setReportDetails("");
    }
  };

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

  const handleUploadAvatar = async (e?: any) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Validate file size (5MB limit)
      if (file.size > 5242880) {
        return toast.error("File must be smaller than 5MB");
      }

      // Validate MIME type
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        return toast.error("Only JPEG, PNG, and WebP images are allowed");
      }

      // Sanitize filename - remove special characters
      const ext = file.name.split(".").pop() || "png";
      const safeFileName = `avatar.${ext}`;
      const filePath = `${authUserId}/${safeFileName}`;

      const { error } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error("Upload error:", error);
        return toast.error(error.message || "Upload failed");
      }

      const { data } = supabase.storage.from("profile-images").getPublicUrl(filePath);

      setEdit((prev) => ({
        ...prev,
        avatarUrl: data.publicUrl,
      }));

      toast.success("Avatar uploaded");
    };

    input.click();
  };

  return (
    <div className="bg-[#faf8f4] min-h-screen pb-24">
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
        <div className="rounded-2xl bg-[#EFE7DA] p-5 text-center flex flex-col items-center">
          <div className="relative h-24 w-24 mb-2">
            <img
              src={displayedAvatar}
              className="h-full w-full rounded-full object-cover"
            />

            {isOwnProfile && (
              <button
                onClick={() => setShowAvatarActions((p) => !p)}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-black text-white flex items-center justify-center shadow"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          {isOwnProfile && showAvatarActions && (
            <div className="flex justify-center gap-2 mb-2">
              <button
                onClick={handleUploadAvatar}
                className="text-xs px-3 py-1.5 bg-black text-white rounded-full"
              >
                Upload
              </button>

              {edit.avatarUrl && (
                <button
                  onClick={() => setEdit((p) => ({ ...p, avatarUrl: "" }))}
                  className="text-xs px-3 py-1.5 border rounded-full"
                >
                  Remove
                </button>
              )}

              <button
                onClick={handleAvatarRegenerate}
                className="text-xs px-3 py-1.5 border rounded-full"
              >
                Generate
              </button>
            </div>
          )}

          {!user.avatar_url && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-amber-800">
                📸 Profiles with photos are more trusted
              </p>
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <p className="text-[18px] font-medium text-[#2b2b2b]">{user.name}</p>
            {user.gender && (
              <span className="px-2 py-1 bg-[#2b2b2b]/10 rounded-full text-xs font-medium text-[#2b2b2b] capitalize">
                {user.gender}
              </span>
            )}
          </div>
          {/* 
          {user.phone_verified && <p className="text-xs text-emerald-600 mt-1">✅ Phone verified</p>}
          {!user.avatar_url && <p className="text-xs text-amber-700 mt-1">Profiles with photos are more trusted</p>}
          <p className="text-xs mt-1 text-[#7a6a64]">{user.name && user.age ? "🟢 Complete profile" : "🟡 Incomplete profile"}</p> */}
        </div>

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

        {isOwnProfile && (
          <div className="rounded-2xl bg-white p-4 space-y-3 border border-black/5">
            <p className="text-sm font-medium flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> Profile details
            </p>
            <input
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              placeholder="Name"
              className="w-full bg-[#f6f2ec] rounded-xl px-3 py-2 text-sm"
            />
            {/* <input
              value={edit.avatarUrl}
              placeholder="Avatar url"
              onChange={(e) => setEdit({ ...edit, avatarUrl: e.target.value })}
              className="w-full bg-[#f6f2ec] rounded-xl px-3 py-2 text-sm"
            /> */}
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
            {/* <p className="rounded-xl bg-[#f6f2ec] p-3 text-xs text-[#6f6258]">Phone verification is now part of onboarding and cannot be edited here.</p> */}
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
              This name appears when someone pays you via UPI.
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

        {!isOwnProfile && (
          <div className="rounded-2xl bg-white p-4 border border-black/5 space-y-2">
            <button
              onClick={() => setShowBlockDialog(true)}
              className="w-full rounded-xl border border-[#dbcab7] py-2 text-sm"
            >
              {blockBusy ? "Please wait..." : "Block user"}
            </button>
            <button
              onClick={() => setShowReportDialog(true)}
              className="w-full rounded-xl border border-[#dbcab7] py-2 text-sm"
            >
              Report user
            </button>
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

      <p className="px-6 pb-3 text-center text-[11px] text-[#8a7a70]">
        Impersonating others or using misleading identity is prohibited.{" "}
        <Link className="underline" href="/terms">
          Terms
        </Link>
      </p>
      <BottomNav />

      <ActionDialog
        open={showBlockDialog}
        onClose={() => setShowBlockDialog(false)}
        onConfirm={handleConfirmBlock}
        busy={blockBusy}
        confirmTone="danger"
        title="Block this user?"
        description="You will no longer see each other's plans or interactions."
        confirmLabel="Block"
      />

      <ActionDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onConfirm={submitReport}
        title="Report profile"
        description="Tell us what happened."
        confirmLabel="Submit report"
      >
        <div className="space-y-2">
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-lg border border-[#d7c6b5] bg-white px-3 py-2 text-sm"
          >
            {REPORT_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
          <textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            rows={3}
            placeholder="Details (optional)"
            className="w-full rounded-lg border border-[#d7c6b5] bg-white px-3 py-2 text-sm"
          />
        </div>
      </ActionDialog>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Camera,
  ChevronLeft,
  Instagram,
  LogOut,
  Save,
  Sparkles,
} from "lucide-react";
import { TrustBadge } from "@/components/TrustBadge";
import { BottomNav } from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { generateAvatarSeed, getUserAvatarUrl } from "@/lib/avatar";
import { toast } from "@/components/ui/toast";
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
            <p className="text-xs text-emerald-600 mt-1">Verified profile</p>
          )}
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

      <BottomNav />
    </div>
  );
}

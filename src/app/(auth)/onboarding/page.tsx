"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast";
// import {
//   RecaptchaVerifier,
//   signInWithPhoneNumber,
//   ConfirmationResult,
// } from "firebase/auth";
// import { firebaseAuth } from "@/lib/firebase";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  // const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
  //   null,
  // );

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.replace("/login");

      const { data: profile } = await supabase
        .from("users")
        .select("name,gender,age,phone_number,phone_verified,instagram_url")
        .eq("id", data.user.id)
        .single();

      const { data: consent } = await supabase
        .from("user_safety_consents")
        .select("is_adult,agreed_terms,acknowledged_safety_responsibility")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (
        profile?.name &&
        profile?.gender &&
        profile?.age &&
        profile?.phone_verified &&
        consent?.is_adult &&
        consent?.agreed_terms &&
        consent?.acknowledged_safety_responsibility
      ) {
        router.replace("/feed");
        return;
      }

      setName(profile?.name || data.user?.user_metadata?.name || "");
      setGender(profile?.gender || "");
      setAge(profile?.age ? String(profile.age) : "");
      setPhone(profile?.phone_number || "");
      setPhoneVerified(!!profile?.phone_verified);
      setInstagram(profile?.instagram_url || "");
      if (
        consent?.is_adult &&
        consent?.agreed_terms &&
        consent?.acknowledged_safety_responsibility
      ) {
        setConsentChecked(true);
      }
    });
  }, [router, supabase]);

  // const setupRecaptcha = () => {
  //   if (!(window as any).recaptchaVerifier) {
  //     (window as any).recaptchaVerifier = new RecaptchaVerifier(
  //       firebaseAuth,
  //       "recaptcha-container",
  //       { size: "invisible" },
  //     );
  //   }
  // };

  // const sendOtp = async () => {
  //   if (!phone.trim()) return toast.error("Phone required");

  //   try {
  //     setSendingOtp(true);
  //     setupRecaptcha();

  //     const appVerifier = (window as any).recaptchaVerifier;

  //     const result = await signInWithPhoneNumber(
  //       firebaseAuth,
  //       phone.trim(),
  //       appVerifier,
  //     );

  //     setConfirmation(result);
  //     toast.success("OTP sent");
  //   } catch (err: any) {
  //     console.error(err);
  //     toast.error(err.message || "Failed to send OTP");
  //   } finally {
  //     setSendingOtp(false);
  //   }
  // };

  // const verifyOtp = async () => {
  //   if (!confirmation) return toast.error("Send OTP first");
  //   if (!otpCode.trim()) return toast.error("Enter OTP");

  //   try {
  //     setVerifyingOtp(true);

  //     await confirmation.confirm(otpCode.trim());

  //     // 🔥 IMPORTANT: call backend to save
  //     const res = await fetch("/api/phone/fire-verify", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ phone: phone.trim() }),
  //     });

  //     const data = await res.json();

  //     if (!res.ok) throw new Error(data.error);

  //     setPhoneVerified(true);
  //     setOtpCode("");

  //     toast.success("Phone verified");
  //   } catch (err: any) {
  //     console.error(err);
  //     toast.error(err.message || "Invalid OTP");
  //   } finally {
  //     setVerifyingOtp(false);
  //   }
  // };

  const submit = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    if (!name.trim() || !age || !gender) {
      toast.error("Missing required fields", {
        description: "Please fill name, gender, and age.",
      });
      return;
    }

    // if (!phone.trim() || !phoneVerified) {
    //   toast.error("Phone verification required", {
    //     description: "Please verify your phone to continue onboarding.",
    //   });
    //   return;
    // }
    if (!consentChecked) {
      toast.error("Please confirm before continuing");
      return;
    }

    if (Number(age) < 18) {
      toast.error("You must be 18+ to use Zuno");
      return;
    }
    const { error } = await supabase
      .from("users")
      .update({
        name: name.trim(),
        gender,
        age: Number(age),
        phone_number: phone.trim(),
        instagram_url: instagram || null,
        instagram_handle: instagram
          ? instagram.split("/").filter(Boolean).pop() || null
          : null,
      })
      .eq("id", data.user.id);

    if (error) {
      toast.error("Unable to complete onboarding", {
        description: error.message,
      });
      return;
    }

    const { error: consentError } = await supabase
      .from("user_safety_consents")
      .upsert({
        user_id: data.user.id,
        is_adult: true,
        agreed_terms: true,
        acknowledged_safety_responsibility: true,
        consented_at: new Date().toISOString(),
      });

    if (consentError) {
      toast.error("Unable to save consent", {
        description: consentError.message,
      });
      return;
    }

    toast.success("Profile saved", { description: "Welcome to Zuno!" });
    router.replace("/feed");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ fontFamily: "DM Sans, Inter, sans-serif" }}
    >
      <div id="recaptcha-container"></div>
      <div className="w-full max-w-[380px] rounded-[26px] bg-[#F4EFEA] shadow-[0_18px_40px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-[20px] font-semibold text-[#3A2E2A] leading-tight tracking-[-0.01em]">
            Before you continue
          </h1>
          <p className="mt-1.5 text-[13px] text-[#7A6A64] leading-[1.5]">
            Just a few details and you’re in.
          </p>
        </div>

        <div className="px-5 pb-6 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#9C8F88]"
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none text-[#3A2E2A]"
          >
            <option value="">Gender (required)</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>

          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age"
            type="number"
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#9C8F88]"
          />
          {/* 
At this moment avoiding phone verification
         <div className="rounded-xl bg-[#EFE7DA] p-3 space-y-2">
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneVerified(false);
              }}
              placeholder="Phone number (required)"
              className="w-full rounded-lg bg-white px-3 py-2.5 text-[13px] outline-none"
            />
            {!phoneVerified && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={sendOtp}
                  className="rounded-lg bg-[#5A3825] text-white py-2 text-xs"
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter OTP"
                  className="rounded-lg bg-white px-2 py-2 text-xs"
                />
              </div>
            )}
            {!phoneVerified ? (
              <button
                onClick={verifyOtp}
                className="w-full rounded-lg border border-[#d7c6b5] py-2 text-xs"
              >
                {verifyingOtp ? "Verifying..." : "Verify phone"}
              </button>
            ) : (
              <p className="text-xs text-emerald-700">✅ Phone verified</p>
            )}
          </div>  */}

          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="Instagram profile"
            className="w-full rounded-xl bg-[#EFE7DA] px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#9C8F88]"
          />

          <div className="rounded-xl bg-[#efe5d8] p-3 text-[12px] text-[#5f5249] space-y-2">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I confirm I’m 18+ and agree to{" "}
                <Link href="/terms" className="underline">
                  Terms
                </Link>{" "}
                &{" "}
                <Link href="/safety" className="underline">
                  Safety
                </Link>{" "}
                Guidelines
              </span>
            </label>
          </div>

          <button
            onClick={submit}
            className="w-full rounded-full bg-[#5A3825] py-3 text-[13.5px] font-medium text-white shadow-[0_2px_0_rgba(0,0,0,0.1)] active:scale-[0.98]"
          >
            Agree & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

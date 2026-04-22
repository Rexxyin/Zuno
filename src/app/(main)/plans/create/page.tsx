"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import {
  ChevronLeft,
  MapPin,
  Users,
  Calendar,
  IndianRupee,
  Info,
  XIcon,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { CATEGORY_META } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { PlanCategory } from "@/lib/types";
import { DEFAULT_LAUNCH_CITY, INDIA_HIGH_POTENTIAL_CITIES } from "@/lib/cities";
import { useCity } from "@/components/CityContext";
import { RichTextEditor, RichTextDisplay } from "@/components/RichTextEditor";
import { createClient } from "@/lib/supabase/client";

const steps = ["Details", "Meetup", "Settings", "Review"];

function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreatePlanPage() {
  const router = useRouter();
  const { selectedCity, setSelectedCity } = useCity();
  const [showInfo, setShowInfo] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentUserGender, setCurrentUserGender] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as PlanCategory,
    city: DEFAULT_LAUNCH_CITY,
    location_name: "",
    google_maps_link: "",
    datetime: toDatetimeLocalValue(new Date()),
    max_people: "1",
    whatsapp_link: "",
    requireApproval: false,
    female_only: false,
    visibility: "public",
    image_url: "",
    cost_mode: "per_person" as "per_person" | "total",
    cost_amount: "",
    host_included_in_spots_and_splits: true,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      city: selectedCity || DEFAULT_LAUNCH_CITY,
    }));
  }, [selectedCity]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: me } = await supabase
        .from("users")
        .select("gender")
        .eq("id", auth.user.id)
        .maybeSingle();
      setCurrentUserGender(String(me?.gender || "").toLowerCase());
    };
    loadCurrentUser();
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "city") setSelectedCity(value);
  };

  const handleDescriptionChange = (html: string) => {
    setFormData((prev) => ({ ...prev, description: html }));
  };

  const isDescriptionEmpty = (html: string) => {
    if (!html) return true;
    return html.replace(/<[^>]*>/g, "").trim().length === 0;
  };

  const canProceed = () =>
    currentStep === 0
      ? !!(formData.title.trim() && !isDescriptionEmpty(formData.description))
      : currentStep === 1
        ? !!(formData.location_name.trim() && formData.datetime)
        : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      setCurrentStep((p) => p + 1);
      return;
    }
    try {
      if (new Date(formData.datetime).getTime() < Date.now()) {
        toast.error("Please choose a future date & time");
        setCurrentStep(1);
        return;
      }
      if (formData.female_only && currentUserGender !== "female") {
        toast.error("Women-only plans can only be hosted by women");
        setCurrentStep(2);
        return;
      }
      setLoading(true);
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/plans/${data.id}`);
      } else {
        const err = await res.json();
        toast.error("Failed to create plan", { description: err.error });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFEA] pb-28 text-sm">
      <style>{`
        /* Remove blue focus outline from publish button */
        .cp-cta:focus { outline: none; }
        .cp-cta:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }
      `}</style>

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#F4EFEA]">
        <div className="mx-auto max-w-md px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() =>
                currentStep ? setCurrentStep((p) => p - 1) : router.back()
              }
              className="h-8 w-8 rounded-full bg-[#EFE7DA] flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4 text-[#5A3825]" />
            </button>
            <p className="font-medium text-[#3A2E2A]">Create Plan</p>
            <span className="text-xs text-[#7A6A64]">
              {currentStep + 1}/{steps.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[#E7DED3]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md px-4 py-6 space-y-5"
      >
        {/* Step label */}
        <div>
          {currentStep !== 2 ? (
            <h2 className="text-base font-semibold text-[#3A2E2A]">
              {currentStep === 0 && "Plan basics"}
              {currentStep === 1 && "Where & when"}
              {currentStep === 3 && "Review your plan"}
            </h2>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-[#3A2E2A]">Settings</p>
              <button
                type="button"
                onClick={() => setShowInfo(true)}
                className="text-[#7A6A64]"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-[#7A6A64]">
            {currentStep === 0 && "Give your plan a title and description"}
            {currentStep === 1 && "Where are you meeting and when?"}
            {currentStep === 2 && "Control who can join"}
            {currentStep === 3 && "Looks good? Publish it."}
          </p>
        </div>

        {/* ── STEP 0: Basics ── */}
        {currentStep === 0 && (
          <div className="space-y-3">
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Goa trip this weekend"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm outline-none placeholder:text-[#b0a090]"
            />
            <RichTextEditor
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="What's the plan? Add details, itinerary, what's included…"
            />
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm text-[#3A2E2A]"
            >
              {INDIA_HIGH_POTENTIAL_CITIES.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(CATEGORY_META) as PlanCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, category: cat }))}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${
                    formData.category === cat
                      ? "bg-[#5A3825] text-white"
                      : "bg-[#EFE7DA] text-[#5A3825]"
                  }`}
                >
                  <CategoryIcon
                    icon={CATEGORY_META[cat].icon}
                    className="h-3 w-3"
                  />
                  {CATEGORY_META[cat].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Location ── */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <input
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="Meetup place"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm outline-none placeholder:text-[#b0a090]"
            />
            <input
              name="google_maps_link"
              value={formData.google_maps_link}
              onChange={handleChange}
              placeholder="Google Maps link (optional)"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm outline-none placeholder:text-[#b0a090]"
            />
            <input
              type="datetime-local"
              name="datetime"
              value={formData.datetime}
              onChange={handleChange}
              min={toDatetimeLocalValue(new Date())}
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm text-[#3A2E2A]"
            />
          </div>
        )}

        {/* ── STEP 2: Settings ── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#7A6A64] mb-1.5">
                Max people
              </p>
              <input
                type="number"
                name="max_people"
                value={formData.max_people}
                min={1}
                step="1"
                inputMode="numeric"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || Number(v) >= 1) handleChange(e);
                }}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                placeholder="Max people"
                className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm outline-none"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-[#7A6A64] mb-1.5">
                Visibility
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "public", label: "Public" },
                  { val: "invite_only", label: "Private" },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        visibility: val,
                        requireApproval: false,
                      }))
                    }
                    className={`rounded-full py-2 text-xs font-medium transition-colors ${
                      formData.visibility === val
                        ? "bg-[#5A3825] text-white"
                        : "bg-[#EFE7DA] text-[#5A3825]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formData.visibility === "public" && (
              <div>
                <p className="text-xs font-medium text-[#7A6A64] mb-1.5">
                  Joining
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: true, label: "Approval required" },
                    { val: false, label: "Open to all" },
                  ].map(({ val, label }) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, requireApproval: val }))
                      }
                      className={`rounded-full py-2 text-xs font-medium transition-colors ${
                        formData.requireApproval === val
                          ? "bg-[#5A3825] text-white"
                          : "bg-[#EFE7DA] text-[#5A3825]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-[#7A6A64] mb-1.5">
                Cost (optional)
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  { val: "per_person", label: "Per person" },
                  { val: "total", label: "Total" },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, cost_mode: val as any }))
                    }
                    className={`rounded-full py-2 text-xs font-medium transition-colors ${
                      formData.cost_mode === val
                        ? "bg-[#5A3825] text-white"
                        : "bg-[#EFE7DA] text-[#5A3825]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="flex items-start justify-between rounded-xl bg-[#EFE7DA] px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-[#3A2E2A]">Include host in spots & split</p>
                  <p className="text-[11px] text-[#7A6A64]">If checked, max people includes host too.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.host_included_in_spots_and_splits}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      host_included_in_spots_and_splits: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-[#cbb9a6] text-[#5A3825] focus:ring-[#5A3825]"
                />
              </label>

              <input
                name="cost_amount"
                value={formData.cost_amount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || Number(v) >= 0) handleChange(e);
                }}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="₹ Estimated amount"
                className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm outline-none placeholder:text-[#b0a090]"
              />
            </div>

            <input
              name="whatsapp_link"
              value={formData.whatsapp_link}
              onChange={handleChange}
              placeholder="WhatsApp group link (optional)"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm outline-none placeholder:text-[#b0a090]"
            />

            <input
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="Banner image URL (optional)"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm outline-none placeholder:text-[#b0a090]"
            />

            <label className="flex items-center justify-between py-1">
              <span className="text-sm text-[#3A2E2A]">Women only</span>
              <input
                type="checkbox"
                name="female_only"
                checked={formData.female_only}
                onChange={handleChange}
                className="rounded"
              />
            </label>
          </div>
        )}

        {/* ── STEP 3: Review ── */}
        {currentStep === 3 && (
          <div className="overflow-hidden rounded-2xl border border-[#e2d9ce] bg-[#EFE7DA]">
            {formData.image_url && (
              <img
                src={formData.image_url}
                className="h-[140px] w-full object-cover"
                alt="Plan banner"
              />
            )}
            <div className="p-4 space-y-3">
              <p className="text-[15px] font-semibold text-[#1a1410] leading-snug">
                {formData.title}
              </p>

              {/* Description preview — force light variant so text is readable on cream bg */}
              {!isDescriptionEmpty(formData.description) && (
                <div className="border-b border-[#ddd3c5] pb-3">
                  <RichTextDisplay
                    html={formData.description}
                    variant="light"
                  />
                </div>
              )}

              <div className="space-y-1.5 text-[12px] text-[#6f625b]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 opacity-60" />
                  <span>{formatDateTime(formData.datetime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 opacity-60" />
                  <span>
                    {formData.location_name}
                    {formData.city ? `, ${formData.city}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 opacity-60" />
                  <span>Up to {formData.max_people} people</span>
                </div>
                {formData.cost_amount && (
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5 opacity-60" />
                    <span>
                      ₹{formData.cost_amount}{" "}
                      {formData.cost_mode === "per_person"
                        ? `per person${formData.host_included_in_spots_and_splits ? " (host included)" : " (host excluded)"}`
                        : `total${formData.host_included_in_spots_and_splits ? " (host included)" : " (host excluded)"}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#ddd3c5] text-[#5c4a38] font-medium">
                    {formData.visibility === "invite_only"
                      ? "Private"
                      : formData.requireApproval
                        ? "Approval needed"
                        : "Public · open"}
                  </span>
                  {formData.female_only && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fce7f3] text-[#9d174d] font-medium">
                      ♀ Women only
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          type="submit"
          disabled={!canProceed() || loading}
          className="cp-cta w-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
        >
          {loading
            ? "Publishing…"
            : currentStep === steps.length - 1
              ? "Publish plan"
              : "Next →"}
        </button>
      </form>

      {/* INFO MODAL */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-sm shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-[#2b2b2b]">How settings work</p>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="text-black/40 hover:text-black/70"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs leading-relaxed text-[#5f5f5f]">
              <div className="space-y-1">
                <p className="font-semibold text-[#2b2b2b]">Visibility</p>
                <p>
                  <span className="font-medium text-[#3a2e2a]">
                    Public · open
                  </span>{" "}
                  — visible on feed, anyone can join instantly
                </p>
                <p>
                  <span className="font-medium text-[#3a2e2a]">
                    Public · approval
                  </span>{" "}
                  — visible on feed, you review each request
                </p>
                <p>
                  <span className="font-medium text-[#3a2e2a]">Private</span> —
                  invite-only via link, not shown on feed
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-[#2b2b2b]">Cost</p>
                <p>
                  Shown as an estimate. Once the plan ends you can confirm the
                  final amount and participants get a UPI payment option.
                </p>
                <p className="text-[#a08b7a]">
                  Make sure your UPI ID is set in your profile.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-[#2b2b2b]">WhatsApp</p>
                <p>Only joined participants see the group link.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function formatDateTime(dateString: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("en-IN", { month: "long" });
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const time =
    minutes === 0
      ? `${hours} ${ampm}`
      : `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  return `${day} ${month}, ${time}`;
}

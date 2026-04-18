"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Calendar,
  IndianRupee,
  Info,
  XIcon,
  Image as ImageIcon,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { CATEGORY_META } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { PlanCategory } from "@/lib/types";
import { DEFAULT_LAUNCH_CITY, INDIA_HIGH_POTENTIAL_CITIES } from "@/lib/cities";
import { useCity } from "@/components/CityContext";

const steps = ["Details", "Meetup", "Settings", "Review"];

export default function CreatePlanPage() {
  const router = useRouter();
  const { selectedCity, setSelectedCity } = useCity();
  const [showInfo, setShowInfo] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as PlanCategory,
    city: DEFAULT_LAUNCH_CITY,
    location_name: "",
    google_maps_link: "",
    datetime: "",
    max_people: "1",
    whatsapp_link: "",
    requireApproval: false,
    female_only: false,
    visibility: "public",
    image_url: "",
    cost_mode: "per_person" as "per_person" | "total",
    cost_amount: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      city: selectedCity || DEFAULT_LAUNCH_CITY,
    }));
  }, [selectedCity]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "city") setSelectedCity(value);
  };

  const canProceedToNextStep = () =>
    currentStep === 0
      ? !!(formData.title.trim() && formData.description.trim())
      : currentStep === 1
        ? !!(formData.location_name.trim() && formData.datetime)
        : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    try {
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
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#F4EFEA]">
        <div className="mx-auto max-w-md px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <button
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

          {/* PROGRESS */}
          <div className="h-1.5 rounded-full bg-[#E7DED3]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* BODY */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md px-4 py-6 space-y-6"
      >
        {/* STEP TITLE */}
        <div>
          <h2 className="text-base font-semibold text-[#3A2E2A]">
            {currentStep === 0 && "Plan basics"}
            {currentStep === 1 && "Where & when"}
            {currentStep === 3 && "Review"}
          </h2>
          {currentStep === 2 && (
            <div className="flex items-center justify-between">
              <p className="font-medium">Settings</p>
              <button type="button" onClick={() => setShowInfo(true)}>
                <Info className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-[#7A6A64]">
            {currentStep === 0 && "Give your plan a title and details"}
            {currentStep === 1 && "Location and time"}
            {currentStep === 2 && "Control who can join"}
            {currentStep === 3 && "Looks good?"}
          </p>
        </div>

        {/* STEP 0 */}
        {currentStep === 0 && (
          <div className="space-y-3">
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Goa trip this weekend"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm outline-none placeholder:text-xs"
            />

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What’s the plan?"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm outline-none placeholder:text-xs"
              rows={3}
            />

            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm"
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
                  className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs ${
                    formData.category === cat
                      ? "bg-[#5A3825] text-white"
                      : "bg-[#EFE7DA]"
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

        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <input
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="Meetup place"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm placeholder:text-xs"
            />

            <input
              name="google_maps_link"
              value={formData.google_maps_link}
              onChange={handleChange}
              placeholder="Google Maps link"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm placeholder:text-xs"
            />

            <input
              type="datetime-local"
              name="datetime"
              value={formData.datetime}
              onChange={handleChange}
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm placeholder:text-xs"
            />
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <input
              type="number"
              name="max_people"
              value={formData.max_people}
              min={1}
              step="1"
              inputMode="numeric"
              onChange={(e) => {
                const value = e.target.value;

                // allow empty (so user can edit)
                if (value === "") {
                  handleChange(e);
                  return;
                }

                const num = Number(value);

                // enforce minimum = 1
                if (num >= 1) {
                  handleChange(e);
                }
              }}
              onKeyDown={(e) => {
                // block invalid typing
                if (e.key === "-" || e.key === "e") {
                  e.preventDefault();
                }
              }}
              placeholder="Max people"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm placeholder:text-xs"
            />

            {/* visibility */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    visibility: "public",
                    requireApproval: false,
                  }))
                }
                className={`rounded-full py-2 text-xs ${
                  formData.visibility === "public"
                    ? "bg-[#5A3825] text-white"
                    : "bg-[#EFE7DA]"
                }`}
              >
                Public
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    visibility: "invite_only",
                    requireApproval: false,
                  }))
                }
                className={`rounded-full py-2 text-xs ${
                  formData.visibility === "invite_only"
                    ? "bg-[#5A3825] text-white"
                    : "bg-[#EFE7DA]"
                }`}
              >
                Private (invite only)
              </button>
            </div>

            {/* approval */}
            {formData.visibility === "public" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, requireApproval: true }))
                  }
                  className={`rounded-full py-2 text-xs ${
                    formData.requireApproval
                      ? "bg-[#5A3825] text-white"
                      : "bg-[#EFE7DA]"
                  }`}
                >
                  Approval required
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, requireApproval: false }))
                  }
                  className={`rounded-full py-2 text-xs ${
                    !formData.requireApproval
                      ? "bg-[#5A3825] text-white"
                      : "bg-[#EFE7DA]"
                  }`}
                >
                  Open
                </button>
              </div>
            )}

            <input
              name="whatsapp_link"
              value={formData.whatsapp_link}
              onChange={handleChange}
              placeholder="WhatsApp group link"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm placeholder:text-xs placeholder:text-xs"
            />

            {/* cost */}
            <div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, cost_mode: "per_person" }))
                  }
                  className={`rounded-full py-2 text-xs ${
                    formData.cost_mode === "per_person"
                      ? "bg-[#5A3825] text-white"
                      : "bg-[#EFE7DA]"
                  }`}
                >
                  Per person
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, cost_mode: "total" }))
                  }
                  className={`rounded-full py-2 text-xs ${
                    formData.cost_mode === "total"
                      ? "bg-[#5A3825] text-white"
                      : "bg-[#EFE7DA]"
                  }`}
                >
                  Total
                </button>
              </div>
              <input
                name="cost_amount"
                value={formData.cost_amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    handleChange(e);
                    return;
                  }
                  const num = Number(value);
                  if (num >= 0) {
                    handleChange(e);
                  }
                }}
                onKeyDown={(e) => {
                  // block invalid typing
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="₹ Estimated expense"
                className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm placeholder:text-xs"
              />
            </div>

            {/* toggle */}
            <label className="flex items-center justify-between">
              <span>Women only</span>
              <input
                type="checkbox"
                name="female_only"
                checked={formData.female_only}
                onChange={handleChange}
              />
            </label>

            <input
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="Banner image URL"
              className="w-full rounded-xl bg-[#EFE7DA] px-3 py-2.5 text-sm placeholder:text-xs"
            />
          </div>
        )}

        {/* STEP 3 */}
        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="overflow-hidden rounded-2xl bg-[#EFE7DA]">
            {formData.image_url && (
              <img
                src={formData.image_url}
                className="h-[150px] w-full object-cover"
              />
            )}

            <div className="p-4 space-y-3">
              <p className="text-[15px] font-medium leading-[1.4] text-[#2f2723]">
                {formData.title}
              </p>

              <div className="space-y-1.5 text-[12.5px] text-[#6f625b]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 opacity-70" />
                  <span>{formatDateTime(formData.datetime)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 opacity-70" />
                  <span>
                    {formData.location_name}, {formData.city}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 opacity-70" />
                  <span>{formData.max_people} people</span>
                </div>

                {formData.cost_amount && (
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5 opacity-70" />
                    <span>
                      {formData.cost_amount} •{" "}
                      {formData.cost_mode === "per_person"
                        ? "per person"
                        : "total"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          disabled={!canProceedToNextStep() || loading}
          className="w-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 py-2.5 text-sm font-medium text-white"
        >
          {loading
            ? "Publishing..."
            : currentStep === steps.length - 1
              ? "Publish plan"
              : "Next"}
        </button>
      </form>
      {/* INFO MODAL */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 text-sm">
            {/* HEADER */}
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-[#2b2b2b]">How it works</p>
              <button onClick={() => setShowInfo(false)}>
                <XIcon className="h-4 w-4 text-black/60" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="space-y-3 text-xs leading-[1.5] text-[#5f5f5f]">
              {/* VISIBILITY */}
              <div className="space-y-1">
                <p className="font-medium text-[#2b2b2b]">Visibility</p>

                <p>• Public plans are visible on the feed</p>

                <p>
                  • Public (approval) → users send a request, host must approve
                  before they can join
                </p>

                <p>• Open → anyone can join instantly without approval</p>

                <p>
                  • Private → invite-only, not shown on feed, can only be joined
                  via link
                </p>
              </div>

              {/* COST */}
              <div className="space-y-1">
                <p className="font-medium text-[#2b2b2b]">Cost</p>

                <p>• Amount is an estimate and shown in plan details</p>

                <p>• Can be split per person or kept as total</p>

                <p>
                  • Once finalized, users get a UPI payment option to settle
                </p>

                <p>• Make sure your UPI ID and payee name are set in profile</p>
              </div>

              {/* WHATSAPP */}
              <div className="space-y-1">
                <p className="font-medium text-[#2b2b2b]">WhatsApp</p>

                <p>• Add a group link so participants can coordinate easily</p>
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

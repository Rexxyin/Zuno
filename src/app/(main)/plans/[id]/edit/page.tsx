"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { ChevronLeft, Info } from "lucide-react";
import { CATEGORY_META } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { PlanCategory } from "@/lib/types";
import { RichTextEditor } from "@/components/RichTextEditor";
import { INDIA_HIGH_POTENTIAL_CITIES } from "@/lib/cities";

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    cost_mode: "per_person",
    visibility: "public",
    host_included_in_spots_and_splits: true,
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const res = await fetch(`/api/plans/${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error("Unable to load plan");
        router.replace("/my-plans");
        return;
      }
      setForm({
        ...data,
        requireApproval: !!data.approval_mode,
        cost_mode: data.cost_mode || "per_person",
        cost_amount: data.cost_amount || "",
      });
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleDescriptionChange = (html: string) => {
    setForm((prev: any) => ({ ...prev, description: html }));
  };

  const update = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      visibility:
        form.visibility === "private" ? "invite_only" : form.visibility,
    };
    const res = await fetch(`/api/plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok)
      return toast.error("Failed to save plan", {
        description: data.error || "Please try again.",
      });
    toast.success("Plan updated");
    router.push(`/plans/${id}`);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F4EFEA] px-4 py-4 pb-24 text-sm">
      <div className="mx-auto max-w-md space-y-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-card"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold">Edit plan</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="space-y-3 rounded-2xl border border-[#e2d9ce] bg-[#EFE7DA] p-4 text-sm">
          <input
            value={form.title || ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Plan title"
            className="w-full rounded-xl border app-card px-3 py-2.5"
          />

          <RichTextEditor
            value={form.description || ""}
            onChange={handleDescriptionChange}
            placeholder="Plan details"
          />
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CATEGORY_META) as PlanCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => update("category", cat)}
                className={`rounded-xl border px-3 py-2 text-left text-xs ${form.category === cat ? "bg-orange-500 text-white border-orange-500" : "app-card"}`}
              >
                <span className="inline-flex items-center gap-1">
                  <CategoryIcon
                    icon={CATEGORY_META[cat].icon}
                    className="h-3 w-3"
                  />{" "}
                  {CATEGORY_META[cat].label}
                </span>
              </button>
            ))}
          </div>
          <select
            value={form.city || ""}
            onChange={(e) => update("city", e.target.value)}
            className="w-full rounded-xl bg-[#F7F1E8] px-3 py-2.5 text-sm text-[#3A2E2A] outline-none"
          >
            {INDIA_HIGH_POTENTIAL_CITIES.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
          <input
            value={form.location_name || ""}
            onChange={(e) => update("location_name", e.target.value)}
            placeholder="Meetup point name"
            className="w-full rounded-xl border app-card px-3 py-2.5"
          />
          <input
            value={form.google_maps_link || ""}
            onChange={(e) => update("google_maps_link", e.target.value)}
            placeholder="Google Maps link"
            className="w-full rounded-xl border app-card px-3 py-2.5"
          />
          <div className="rounded-xl border app-card px-3 py-2.5">
            <input
              type="datetime-local"
              value={
                form.datetime
                  ? new Date(form.datetime).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                update("datetime", new Date(e.target.value).toISOString())
              }
              className="w-full bg-transparent outline-none"
            />
          </div>
          <input
            type="number"
            min={1}
            step="1"
            inputMode="numeric"
            value={form.max_people ?? ""}
            onChange={(e) => {
              const v = e.target.value;

              if (v === "") {
                update("max_people", ""); // allow clearing
              } else {
                const num = Number(v);
                if (num >= 1) {
                  update("max_people", num);
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") e.preventDefault();
            }}
            className="w-full rounded-xl border app-card px-3 py-2.5"
            placeholder="Max spots"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update("visibility", "public")}
              className={`rounded-xl border px-3 py-2 text-xs ${form.visibility === "public" ? "bg-[#5A3825] text-white border-[#5A3825]" : "app-card"}`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => {
                update("visibility", "invite_only");
                update("requireApproval", false);
              }}
              className={`rounded-xl border px-3 py-2 text-xs ${form.visibility !== "public" ? "bg-[#5A3825] text-white border-[#5A3825]" : "app-card"}`}
            >
              Private
            </button>
          </div>
          {form.visibility === "public" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => update("requireApproval", true)}
                className={`rounded-xl border px-3 py-2 text-xs ${form.requireApproval ? "bg-[#5A3825] text-white border-[#5A3825]" : "app-card"}`}
              >
                Host manages requests
              </button>
              <button
                type="button"
                onClick={() => update("requireApproval", false)}
                className={`rounded-xl border px-3 py-2 text-xs ${!form.requireApproval ? "bg-[#5A3825] text-white border-[#5A3825]" : "app-card"}`}
              >
                Open to everyone
              </button>
            </div>
          )}
          <input
            value={form.whatsapp_link || ""}
            onChange={(e) => update("whatsapp_link", e.target.value)}
            placeholder="WhatsApp group link (optional)"
            className="w-full rounded-xl border app-card px-3 py-2.5"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update("cost_mode", "per_person")}
              className={`rounded-xl border px-3 py-2 text-xs ${form.cost_mode === "per_person" ? "bg-[#5A3825] text-white border-[#5A3825]" : "app-card"}`}
            >
              Per person
            </button>
            <button
              type="button"
              onClick={() => update("cost_mode", "total")}
              className={`rounded-xl border px-3 py-2 text-xs ${form.cost_mode === "total" ? "bg-[#5A3825] text-white border-[#5A3825]" : "app-card"}`}
            >
              Total
            </button>
          </div>
          <label className="flex items-start justify-between rounded-xl bg-[#F7F1E8] px-3 py-2.5">
            <div className="flex items-start gap-1">
              <Info className="mt-0.5 h-3.5 w-3.5 text-[#7A6A64]" />
              <div>
                <p className="text-xs font-medium text-[#3A2E2A]">Include host in spots & split</p>
                <p className="text-[11px] text-[#7A6A64]">If checked, max people includes host too.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!form.host_included_in_spots_and_splits}
              onChange={(e) => update("host_included_in_spots_and_splits", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#cbb9a6] text-[#5A3825] focus:ring-[#5A3825]"
            />
          </label>
          <input
            type="number"
            value={form.cost_amount || ""}
            onChange={(e) => update("cost_amount", e.target.value)}
            placeholder="Cost amount"
            className="w-full rounded-xl border app-card px-3 py-2.5"
          />
          <label className="flex items-center justify-between rounded-lg border app-card px-3 py-2">
            <span>Women only</span>
            <input
              type="checkbox"
              checked={!!form.female_only}
              onChange={(e) => update("female_only", e.target.checked)}
            />
          </label>
          <input
            value={form.image_url || ""}
            onChange={(e) => update("image_url", e.target.value)}
            placeholder="Banner image URL (optional)"
            className="w-full rounded-xl border app-card px-3 py-2.5"
          />
          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 py-2.5 font-semibold text-white"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

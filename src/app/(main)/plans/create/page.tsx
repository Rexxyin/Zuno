'use client'

export default function CreatePlanPage() {
  return (
    <form className="space-y-3">
      <h1 className="text-2xl font-bold">Create plan</h1>
      <input className="w-full rounded-xl border p-3" placeholder="Plan title" required />
      <input className="w-full rounded-xl border p-3" placeholder="e.g. Cafe Lalit, MG Road — near the red gate" required />
      <input className="w-full rounded-xl border p-3" placeholder="WhatsApp group link" required />
      <div className="flex gap-3 text-sm">
        <label><input type="checkbox" className="mr-1" />Require approval</label>
        <label><input type="checkbox" className="mr-1" />Women only</label>
      </div>
      <button className="rounded-full bg-black px-4 py-2 text-white">Publish</button>
    </form>
  )
}

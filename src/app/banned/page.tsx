export default function BannedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf8f4] p-6 text-center">
      <div className="max-w-md rounded-2xl border border-[#e7dbcc] bg-white p-6">
        <h1 className="text-xl font-semibold text-[#2f2721]">Account restricted</h1>
        <p className="mt-2 text-sm text-[#6f6258]">
          Your account has been restricted due to a safety or policy review. Contact support if you think this is a mistake.
        </p>
      </div>
    </main>
  )
}

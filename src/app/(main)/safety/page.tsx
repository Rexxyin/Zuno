export default function SafetyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 text-[#2f2721]">
      <h1 className="text-2xl font-bold">Safety Guidelines</h1>
      <p className="mt-2 text-sm text-[#6f6258]">Zuno provides the platform. Your safety choices are yours.</p>

      <div className="mt-6 space-y-4 text-sm leading-6">
        <div>
          <h2 className="font-semibold">Before joining</h2>
          <ul className="list-disc pl-5">
            <li>Check host profile and participant signals.</li>
            <li>Prefer public places.</li>
            <li>Avoid plans you&apos;re unsure about.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">While attending</h2>
          <ul className="list-disc pl-5">
            <li>Inform a trusted friend/family member.</li>
            <li>Trust your instincts and leave if uncomfortable.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">General</h2>
          <ul className="list-disc pl-5">
            <li>Do not share sensitive personal information.</li>
            <li>Do not send money to unknown users.</li>
            <li>Report suspicious behavior and block unwanted users.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

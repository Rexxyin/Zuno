export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-[#2f2721]">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-1 text-xs text-[#6f6258]">Last updated: 21 April 2026</p>

      <div className="mt-8 space-y-7 text-sm leading-6">
        <section>
          <h2 className="font-semibold text-base">What we collect</h2>
          <p className="mt-2">
            Zuno collects basic account information provided via Google sign-in
            (name, email, profile photo), content you create on the platform
            (plans, descriptions, messages), and usage data such as device type
            and app activity. If you add a phone number, that is stored as part
            of your profile.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base">How we use it</h2>
          <p className="mt-2">
            Your data is used solely to operate the platform — displaying your
            profile, showing your plans, and enabling discovery by other users.
            Zuno does not sell your data to third parties. Zuno does not use
            your data for advertising.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base">Data storage</h2>
          <p className="mt-2">
            Your data is stored on secure third-party infrastructure. Zuno
            takes reasonable steps to protect your data but cannot guarantee
            absolute security.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base">Your rights</h2>
          <p className="mt-2">
            You may request deletion of your account and associated data at any
            time by contacting us through the app. We will process deletion
            requests within a reasonable timeframe, subject to legal retention
            obligations.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base">Law enforcement</h2>
          <p className="mt-2">
            Zuno may retain and disclose data where required by Indian law or in
            response to valid legal process, including requests from law
            enforcement agencies.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base">Contact</h2>
          <p className="mt-2">
            For privacy-related requests, contact us at the support email listed
            in the app.
          </p>
        </section>
      </div>
    </main>
  )
}
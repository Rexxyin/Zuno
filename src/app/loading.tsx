export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0d0b]">

      {/* Background Image */}
      <img
        src="/zuno-hero.jpg" // 👉 put your best image here
        className="absolute inset-0 h-full w-full object-cover opacity-80"
        alt="Zuno"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-4 text-white">

        {/* Logo / Brand */}
        <div className="text-3xl font-semibold tracking-tight">
          Zuno
        </div>

        {/* Tagline */}
        <p className="text-sm text-white/80">
          Discover plans. Meet people.
        </p>

        {/* Loader */}
        <div className="mt-4 h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      </div>
    </div>
  );
}
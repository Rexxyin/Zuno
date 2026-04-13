# Zuno Production Action Plan (Design + Auth + End-to-End)

## 1) Priority UI upgrades delivered
- Mobile-first feed with rounded cards, soft gradients, and improved bottom nav.
- Dark + Light theme toggle (stored in localStorage).
- Category chips now show **full names + icons** (ex: `🥾 Hiking Trail`).
- Create Plan flow now asks for **Google Maps link** for meetup point.
- Feed and plan details surface location in tap-ready maps format.
- Host Instagram indicator is shown when profile includes Instagram handle.

## 2) Supabase setup (recommended)
1. Create project on Supabase.
2. Add environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Run migrations in order:
   - `supabase/migrations/20260413000000_zuno_mvp_schema.sql`
   - `supabase/migrations/20260413010000_add_google_maps_link.sql`
4. In Supabase Auth Providers:
   - Enable Google (add redirect `https://<project-ref>.supabase.co/auth/v1/callback`)
   - Enable Phone OTP (and configure SMS provider if required)
   - Enable Email provider

## 3) Auth routing you should configure
- App callback route is now: `/auth/callback`
- In Google OAuth settings, include app callback URL:
  - Local: `http://localhost:3000/auth/callback`
  - Prod: `https://your-domain.com/auth/callback`

## 4) End-to-end local verification
```bash
npm install
npm run dev
```
Then verify:
- `/login` Google + email + phone OTP starts auth.
- `/feed` shows category icon chips and sleek mobile layout.
- `/plans/create` includes meetup point + Google Maps link field.
- `/plans/[id]` shows direct location link and host Instagram icon.

## 5) Deploy checklist
- Add env vars in Vercel/host.
- Run DB migrations in production project.
- Set authentication redirect URLs for production domain.
- Test sign-in + create plan + join flow with two accounts.

## 6) Next recommended improvements
- Persist user profile editing for Instagram handle.
- Add OTP verification UI (code entry step) after sending phone OTP.
- Add map-preview thumbnail card (Google Static Maps or Mapbox).
- Add custom icon set for categories to match your handcrafted brand style.

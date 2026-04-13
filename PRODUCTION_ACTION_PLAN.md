# Zuno Supabase + Auth Setup (Fix Guide)

## 1) Environment variables
Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
```

## 2) Run database migrations
Run both migrations in Supabase SQL editor (in this order):
1. `supabase/migrations/20260413000000_zuno_mvp_schema.sql`
2. `supabase/migrations/20260413010000_add_google_maps_link.sql`

## 3) Supabase Auth provider setup (required)
In Supabase Dashboard → Authentication → Providers:

### Google provider
- Enable Google.
- In Google Cloud Console OAuth app, add authorized redirect URI:
  - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- Put Google Client ID/Secret into Supabase Google Provider.

### Email provider
- Keep enabled for email/password login.

### Phone provider (optional)
- Enable phone if OTP login is needed.
- Configure SMS provider (Twilio or supported provider).

## 4) URL configuration that must match
In Supabase Dashboard → Authentication → URL configuration:
- Site URL:
  - Local: `http://localhost:3000`
  - Prod: `https://YOUR_DOMAIN`
- Additional redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://YOUR_DOMAIN/auth/callback`

## 5) Why auth failed before + what is fixed now
- Middleware now redirects unauthenticated users to `/login`.
- `/auth/callback` now exchanges OAuth code for session.
- On successful auth callback, `public.users` row is upserted so profile loads.
- `/settings` page now contains working logout.

## 6) Verify end-to-end
1. Open `/login` and click Google sign in.
2. After callback, you should land on `/feed`.
3. Open `/profile/me` and verify your user data appears.
4. Open `/settings` and click logout.
5. You should return to `/login` and protected routes should redirect.

## 7) Design updates included
- Smaller font/buttons.
- No horizontal top scrollbar in feed categories (wrapped chips).
- Cleaner profile layout and settings access from settings page only.
- Meetup input includes Google Maps link for direct map opening in feed/cards.

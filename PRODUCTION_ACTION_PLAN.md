# Zuno Supabase + Auth Setup (Latest Fix Guide)

## 1) Environment variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
```

## 2) Run migrations in order
1. `supabase/migrations/20260413000000_zuno_mvp_schema.sql`
2. `supabase/migrations/20260413010000_add_google_maps_link.sql`
3. `supabase/migrations/20260413020000_hardening_auth_and_maps.sql`
4. `supabase/migrations/20260413030000_social_favorites_city.sql`

## 3) Critical Supabase auth config
- Authentication → Providers → Google: enabled.
- Google OAuth redirect URI:
  - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- Authentication → URL Configuration:
  - Site URL: `http://localhost:3000` (local) / your prod domain
  - Redirect URLs:
    - `http://localhost:3000/auth/callback`
    - `https://YOUR_DOMAIN/auth/callback`

## 4) What this migration set now covers
- `plans.google_maps_link` + schema cache reload support.
- `plans.city` and `plans.show_payment_options`.
- `users.instagram_url` and `users.gpay_link`.
- `plan_favorites` table + RLS policies for saved plans.
- `auth.users` trigger to auto-create/update `public.users` profile.

## 5) Fix for `google_maps_link` schema cache error
Run this once in SQL editor if needed:
```sql
NOTIFY pgrst, 'reload schema';
```
Validate columns:
```sql
select column_name from information_schema.columns where table_schema='public' and table_name='plans';
```

## 6) End-to-end verification checklist
1. Login with Google.
2. Create plan with city + meetup + map link.
3. Verify organizer cannot join their own plan.
4. Open plan as another user: join + leave anytime.
5. Save/unsave plan and verify under Saved tab.
6. Add Instagram + GPay links in Settings and verify profile + organizer card links.
7. Verify WhatsApp appears only in plan detail action.

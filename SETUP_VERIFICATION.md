# 🚀 Zuno MVP - Complete Setup & Verification Guide

This guide walks you through setting up and verifying the complete Zuno MVP application.

## ✅ Pre-Flight Checklist

Before you start, make sure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Supabase account created (free tier)
- [ ] Git installed
- [ ] Text editor / VS Code

## 📋 Step 1: Environment Setup

### 1.1 Clone & Install
```bash
cd /Users/prateekjain/Documents/repos/Zuno
npm install
```

### 1.2 Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Create a new project or use existing
3. Navigate to "Project Settings" → "API"
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public Key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 1.3 Create .env.local

```bash
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
EOF
```

## 🗄️ Step 2: Database Setup

### Option A: Manual Setup (Easiest for first time)

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query" → "New blank query"
3. Copy entire content from: `supabase/migrations/20260413000000_zuno_mvp_schema.sql`
4. Paste it into the query editor
5. Click "Run"
6. Wait for success message ✅

### Option B: Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

### Verify Database Setup

1. In Supabase Dashboard, go to "SQL Editor"
2. Run this query to verify tables exist:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

You should see:
- `users`
- `plans`
- `plan_participants`
- `expenses`
- `plan_photos`

✅ All tables created successfully!

## 🔐 Step 3: Setup Authentication

### 3.1 Enable Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Google" → Click it
3. In Google Cloud Console:
   - Create OAuth 2.0 credentials
   - Set Authorized redirect URIs:
     - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/v1/callback`
4. Copy Client ID & Client Secret back to Supabase
5. Click "Save"

### 3.2 Enable Email/Password Auth

1. Go to Authentication → Providers → Email
2. Make sure it's enabled ✓
3. Save

### 3.3 Test Auth Locally

Run the app:
```bash
npm run dev
```

Go to http://localhost:3000/login

Try to login (you can use test credentials for now)

## 🎨 Step 4: Verify UI/Features

### Demo the entire flow:

1. **Landing Page** → http://localhost:3000
   - Should redirect to `/feed`

2. **Feed Page** → http://localhost:3000/feed
   - ✓ See beautiful Zuno header with rotating flame emoji
   - ✓ Category filter pills
   - ✓ Empty state message
   - ✓ Smooth animations

3. **Create Plan** → http://localhost:3000/plans/create
   - ✓ Multi-step form with progress
   - ✓ Category selection
   - ✓ Date/time picker
   - ✓ Review step
   - ✓ Publish button

4. **My Plans** → http://localhost:3000/my-plans
   - ✓ Filter tabs (upcoming, past, hosting)
   - ✓ Empty state

5. **Profile** → http://localhost:3000/profile/me
   - ✓ Beautiful profile card
   - ✓ Stats display
   - ✓ About section
   - ✓ Interests

6. **Bottom Navigation**
   - ✓ All pages have bottom nav
   - ✓ Active state highlights
   - ✓ Floating create button with pulse animation

## 🧪 Step 5: Test API Endpoints

### Open VS Code Terminal or Postman

#### Test Plans GET
```bash
curl http://localhost:3000/api/plans
```

Expected response:
```json
[
  {
    "id": "plan-id",
    "title": "Sunset Trek",
    "category": "hiking",
    ...
  }
]
```

#### Test Plans POST (Create)
```bash
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sunset Trek",
    "description": "Beautiful trek in Mhow",
    "category": "hiking",
    "location_name": "Mhow Hills",
    "datetime": "2026-04-15T17:00:00Z",
    "max_people": 8,
    "whatsapp_link": "https://chat.whatsapp.com/...",
    "approval_mode": false,
    "female_only": false
  }'
```

## 📦 Step 6: Build for Production

```bash
# Create optimized build
npm run build

# Should see:
# ✓ Compiled successfully
# ✓ Generating static pages (10/10)
# ✓ Finalizing page optimization
```

## ✨ Step 7: Performance Check

Open Browser DevTools (F12) → Network tab

Visit http://localhost:3000/feed

Check:
- ✓ Initial page load < 2 seconds
- ✓ Smooth animations (60fps)
- ✓ No console errors

## 🔒 Step 8: Security Verification

### 1. Check RLS Policies

Supabase Dashboard → Authentication → Policies

Verify you see:
- ✓ Users table policies
- ✓ Plans table policies
- ✓ Participants policies
- ✓ Expenses policies

### 2. Test Row Level Security

1. Create a plan with demo account
2. Try to edit another user's plan
3. Should get permission denied ✅

### 3. Check Environment Variables

```bash
# These should NOT be in .env.local
# (only public ones should be there)
cat .env.local
```

Should only contain:
- `NEXT_PUBLIC_SUPABASE_URL` ✓
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ✓

## 🚀 Step 9: Ready for Deployment

### Pre-deployment checklist:
- [ ] All pages loading
- [ ] API endpoints working
- [ ] Database connected
- [ ] Auth working
- [ ] Build succeeds
- [ ] No console errors
- [ ] Environment variables set

### Deploy to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy!

It's live in ~1 minute 🎉

## 🐛 Troubleshooting

### "Supabase connection failed"
```bash
# Check credentials
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# Restart dev server
npm run dev
```

### "Build fails with webpack error"
```bash
# Clear cache
rm -rf .next
npm run build
```

### "Auth redirects infinitely"
```bash
# Check middleware.ts routes
# Verify callback URL in Supabase settings
# Restart dev server
```

### "API returns 401 Unauthorized"
```bash
# Check Supabase RLS policies
# Verify auth token in cookies
# Try logging out and back in
```

## 📊 Database Queries Cheat Sheet

### Get all plans with host info
```sql
SELECT p.*, u.name as host_name, u.reliability_score
FROM plans p
LEFT JOIN users u ON p.host_id = u.id
ORDER BY p.datetime DESC;
```

### Get user's joined plans
```sql
SELECT p.* FROM plans p
JOIN plan_participants pp ON p.id = pp.plan_id
WHERE pp.user_id = 'USER_ID' AND pp.status = 'joined';
```

### Count participants per plan
```sql
SELECT plan_id, COUNT(*) as participant_count
FROM plan_participants
WHERE status IN ('joined', 'attended')
GROUP BY plan_id;
```

## 💡 Key Features Implemented

### Design & UX
✅ Mobile-first responsive
✅ Smooth Framer Motion animations
✅ Beautiful gradient UI
✅ Loading skeletons
✅ Empty states
✅ Bottom navigation
✅ Multi-step forms

### Functionality
✅ Browse plans by category
✅ Create plans with multiple steps
✅ Join/leave plans
✅ View profile & stats
✅ Plan detail page
✅ My plans filtering
✅ Real-time participant count

### Technical
✅ Next.js 14 App Router
✅ TypeScript for type safety
✅ Supabase with RLS policies
✅ Server-side auth with middleware
✅ Optimized images
✅ API routes with validation
✅ Error handling
✅ Security practices

## 🎓 Next Steps

1. **Add Real Data**
   - Create sample plans in database
   - Test the full user journey

2. **Implement More Features**
   - Messaging/Chat
   - Notifications
   - Image uploads
   - Expense splitting

3. **Performance**
   - Add service worker
   - Implement caching
   - Optimize bundle size

4. **Analytics**
   - Track usage
   - Monitor errors
   - User insights

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

## ✅ Final Verification

Run this final checklist before considering the MVP complete:

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, check all pages load:
curl http://localhost:3000/feed  # ✓ 200
curl http://localhost:3000/login # ✓ 200

# 3. Check production build
npm run build                     # ✓ Builds successfully

# 4. Test API
curl http://localhost:3000/api/plans  # ✓ Returns JSON

# 5. Check database
# (In Supabase SQL Editor)
SELECT COUNT(*) FROM plans;      # ✓ Returns count
```

---

🎉 **Congratulations!** Your Zuno MVP is ready for deployment and production use!

For support or issues, check the README.md or raise an issue on GitHub.

### Common Errors: quick fixes

#### `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`
- Go to **Supabase Dashboard → Authentication → Providers**.
- Enable the provider you're using (Google for OAuth, Phone for OTP).
- Save and retry login.

#### `Database schema is not ready. Please run the latest Supabase migrations and refresh schema cache.`
- From repo root run:
  ```bash
  ./scripts/setup-supabase.sh
  ```
- This applies every file in `supabase/migrations` (including the latest schema/cache sync migration).
- If you still see stale schema, open SQL editor and run:
  ```sql
  notify pgrst, 'reload schema';
  ```

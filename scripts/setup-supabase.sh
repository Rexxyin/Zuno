#!/bin/bash

# Zuno Supabase Setup Script
# This script applies all migrations and refreshes PostgREST schema cache.

set -euo pipefail

echo "🚀 Starting Zuno Supabase Setup..."

if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}" ]; then
    echo "❌ Missing Supabase environment variables"
    echo "Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local"
    exit 1
fi

PROJECT_ID=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's/https:\/\///g' | sed 's/\.supabase\.co//g')

echo "📝 Project ID: $PROJECT_ID"
echo ""

echo "📦 Applying latest database migrations..."
supabase db push --project-ref="$PROJECT_ID"

echo "🔄 Refreshing PostgREST schema cache via migration NOTIFY..."

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "📋 Setup Summary:"
echo "  - ✓ All migration files applied"
echo "  - ✓ Database schema synced"
echo "  - ✓ PostgREST schema cache refreshed (via migration NOTIFY)"
echo ""
echo "🎯 Important checks in Supabase Dashboard:"
echo "  1. Authentication -> Providers -> enable Google if you use Google login"
echo "  2. Authentication -> Providers -> enable Phone if you use OTP"
echo "  3. Database -> verify tables/columns from latest migration are visible"
echo "  4. Storage -> profile-images and plan-banners buckets exist"

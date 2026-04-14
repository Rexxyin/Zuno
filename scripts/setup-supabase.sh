#!/bin/bash

# Zuno Supabase Setup Script
# This script sets up all necessary Supabase resources for the Zuno MVP

set -e

echo "🚀 Starting Zuno Supabase Setup..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo "❌ Missing Supabase environment variables"
    echo "Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local"
    exit 1
fi

PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\///g' | sed 's/\.supabase\.co//g')

echo "📝 Project ID: $PROJECT_ID"
echo ""

# Run migrations
echo "📦 Running database migrations..."
supabase db push --project-ref=$PROJECT_ID

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "📋 Setup Summary:"
echo "  - ✓ Database schema created"
echo "  - ✓ Tables and enums configured"
echo "  - ✓ Indexes created for performance"
echo "  - ✓ RLS policies ready to be configured"
echo ""
echo "🎯 Next steps:"
echo "  1. Configure RLS (Row Level Security) policies in Supabase Dashboard"
echo "  2. Set up authentication providers (Google, Phone OTP)"
echo "  3. Create storage buckets for images"
echo "  4. Run the app: npm run dev"
echo ""

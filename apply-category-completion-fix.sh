#!/bin/bash

# ============================================================================
# Apply Category Completion Fix Migration
# ============================================================================
# This script applies the fix for category completion status to the Supabase database
# Run this script to fix the issue where categories never show as "completed"

echo "🔧 Applying Category Completion Status Fix..."
echo "📁 Project: nslexnbxdqhhhfovfqnl"
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed or not in PATH"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Apply the migration
echo "📤 Applying migration: fix-category-completion-status.sql"

supabase db push --project-ref nslexnbxdqhhhfovfqnl --include-seed=false

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🎯 What was fixed:"
    echo "   • Categories now show 'completed' when all words have been practiced"
    echo "   • SuperMemo 2 spaced repetition continues to work for individual words"
    echo "   • Completed categories move to bottom of list but remain accessible"
    echo "   • Added missing update_category_progress_easy_based function"
    echo ""
    echo "🔄 Next steps:"
    echo "   1. Deploy the updated frontend with: vercel --prod"
    echo "   2. Test a flashcard session to verify completion status updates"
    echo "   3. Check that completed categories appear at bottom of student dashboard"
else
    echo ""
    echo "❌ Migration failed. Please check the error above and try again."
    echo ""
    echo "💡 Alternative method:"
    echo "   1. Copy the contents of fix-category-completion-status.sql"
    echo "   2. Go to Supabase Dashboard → SQL Editor"
    echo "   3. Paste and run the migration manually"
    exit 1
fi 
# Fix Statistics Dashboard - Complete Guide

## Current Issue ❌
All statistics cards on the student dashboard are showing **0** because the `user_activity` table doesn't exist in your Supabase database yet.

## ✅ Statistics Are Already Properly Connected

The statistics cards are **correctly connected** to the `user_activity` table:

- **"Слов изучено"** (Words Studied) → `user_activity.total_questions_viewed`
- **"Сегодня изучено"** (Studied Today) → `user_activity.questions_viewed_today` 
- **"Время изучения"** (Study Time) → `user_activity.total_minutes`
- **"Всего сессий"** (Total Sessions) → `user_activity.total_sessions`
- **"Дней подряд"** (Days Active) → `user_activity.total_days_active`
- **"Стрик дней"** (Streak Days) → `user_activity.streak_days`

## 🔧 Solution: Create the user_activity Table

### Step 1: Execute SQL Schema
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `create-user-activity-table.sql`
3. Click **Run** to execute the SQL

This will create the `user_activity` table with all required fields and proper relationships.

### Step 2: Verify Table Creation
After running the SQL, check that the table exists:
- Go to **Supabase Dashboard** → **Table Editor**
- You should see a new `user_activity` table with these columns:
  - `id` (Primary Key)
  - `user_id` (Foreign Key to users.id)
  - `total_questions_viewed`
  - `questions_viewed_today`
  - `total_minutes`
  - `total_sessions`
  - `total_days_active`
  - `streak_days`
  - `last_activity_date`
  - `created_at`
  - `updated_at`

### Step 3: Test the Dashboard
1. Register or login to your app
2. Visit the student dashboard
3. Initially, all stats will show 0 (new user)
4. Study some flashcards to see the stats increment automatically

## 🎯 How Statistics Will Work After Fix

### Automatic Tracking:
- **Question Views**: Increments when viewing flashcards
- **Study Time**: Tracks session duration
- **Sessions**: Counts completed study sessions
- **Daily Activity**: Resets daily counter at midnight
- **Streak**: Tracks consecutive active days
- **Total Days**: Counts unique days of activity

### Real-time Updates:
- Statistics update immediately during study sessions
- Dashboard shows current values on page load
- Daily counters reset automatically at midnight

## 🔍 Troubleshooting

**If statistics still show 0 after creating the table:**
1. Check browser console for errors
2. Verify user is properly authenticated
3. Ensure RLS policies allow user access
4. Try refreshing the page

**If table creation fails:**
1. Check if you have proper Supabase permissions
2. Verify the SQL syntax in the editor
3. Check for existing conflicting table names

## 📊 Expected Results

Once the table is created and you start using the app:
- **Words Studied**: Will increment as you view flashcards
- **Studied Today**: Shows daily progress (resets at midnight)
- **Study Time**: Accumulates minutes spent studying
- **Total Sessions**: Counts each study session completed
- **Days Active**: Total unique days you've used the app
- **Streak Days**: Consecutive days of activity

The statistics will persist across sessions and provide meaningful insights into your Chinese learning progress. 
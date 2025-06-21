# Testing Advanced Learning API

## Quick API Test Guide

### 1. Test Basic API Functions

Open your browser console on the student dashboard and run these tests:

```javascript
// Test 1: Get user dashboard data
import { getUserDashboard } from '@/lib/api/advancedLearning'
getUserDashboard().then(console.log).catch(console.error)

// Test 2: Get categories with progress
import { getCategoriesWithProgress } from '@/lib/api/advancedLearning'
getCategoriesWithProgress().then(console.log).catch(console.error)

// Test 3: Get words for study
import { getWordsForStudy } from '@/lib/api/advancedLearning'
getWordsForStudy(1).then(console.log).catch(console.error) // Replace 1 with actual category ID

// Test 4: Get user statistics
import { getUserStatistics } from '@/lib/api/advancedLearning'
getUserStatistics().then(console.log).catch(console.error)
```

### 2. Test Study Session Flow

```javascript
// Test full study session flow
async function testStudySession() {
  try {
    // 1. Start session
    const sessionId = await startStudySession(1, 'study') // Replace 1 with category ID
    console.log('Session started:', sessionId)
    
    // 2. Get words for study
    const words = await getWordsForStudy(1)
    console.log('Words for study:', words)
    
    // 3. Submit a word response
    if (words.length > 0) {
      const response = await submitWordResponse({
        word_id: words[0].id,
        difficulty_rating: 'easy',
        session_id: sessionId
      })
      console.log('Word response:', response)
    }
    
    // 4. End session
    const completedSession = await endStudySession(sessionId)
    console.log('Session completed:', completedSession)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testStudySession()
```

### 3. Expected Results

**getUserDashboard()** should return:
```json
{
  "user_statistics": { "total_words_learned": 0, "current_streak_days": 0, ... },
  "categories_progress": [...],
  "words_due_today": 0,
  "categories_in_progress": 0,
  "learning_streak_active": false
}
```

**getCategoriesWithProgress()** should return:
```json
[
  {
    "id": 1,
    "name": "Basic Phrases",
    "name_russian": "Базовые фразы",
    "total_words": 2,
    "progress": { "completion_percentage": 0, "status": "not_started", ... }
  },
  ...
]
```

### 4. Troubleshooting

If any tests fail:

1. **Check Supabase Logs**: Go to Supabase → Logs → API
2. **Verify Functions Exist**: Go to Supabase → Database → Functions
3. **Check RLS Policies**: Ensure user has access to tables
4. **Verify User Authentication**: Make sure user is logged in

### 5. Database Function Status Check

Run this in Supabase SQL Editor:
```sql
-- Check if all functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_words_for_study',
  'submit_word_response', 
  'start_study_session',
  'end_study_session',
  'get_user_dashboard',
  'update_user_streak',
  'reset_user_progress'
);
```

Should return 7 functions. 
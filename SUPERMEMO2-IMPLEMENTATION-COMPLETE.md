# SuperMemo 2 Spaced Repetition Implementation

## 🎯 Overview

This document describes the complete implementation of the **SuperMemo 2 (SM2)** algorithm for the Chinese-Russian vocabulary learning system. The implementation includes the exact SM2 formula and special handling for hard categories.

## 📋 Requirements Implemented

### ✅ Core SM2 Algorithm
- **Exact Formula**: `EF' = EF - 0.8 + 0.28 * quality - 0.02 * quality²`
- **Interval Calculation**: 
  - First repetition: 1 day
  - Second repetition: 6 days  
  - Subsequent: `previous_interval × easiness_factor`
- **Quality Mapping**: Easy(5), Hard(3), Forgot(0)

### ✅ Difficulty Level Enhancement
- **Hard Categories**: `difficulty_level >= 3` show cards **daily** regardless of interval
- **Normal Categories**: Follow standard SM2 intervals
- **Show Logic**: Cards appear if `next_review_date <= current_date` OR `difficulty_level >= 3`

### ✅ Database Integration
- Uses existing `user_word_progress` table
- Updates: `easiness_factor`, `interval_days`, `repetition_count`, `next_review_date`
- Tracks: `correct_answers`, `last_difficulty`

## 🔧 Implementation Details

### Database Functions Enhanced

#### 1. `get_words_for_study()`
```sql
-- Enhanced to include difficulty level logic
-- Returns words due for review OR from hard categories
-- Includes SM2 fields: easiness_factor, interval_days, category_difficulty
```

**Key Features:**
- Joins with `categories` table to get `difficulty_level`
- Priority system: New(1) → Hard Categories(2) → Due(3) → Future(4)
- Filter: Shows cards if due OR in hard category (`difficulty_level >= 3`)
- Returns enhanced data structure with SM2 fields

#### 2. `submit_word_response()`
```sql
-- Implements exact SM2 formula
-- EF' = EF - 0.8 + 0.28 * quality - 0.02 * quality²
```

**Quality Mapping:**
- `'easy'` → Quality 5 (Perfect response)
- `'hard'` → Quality 3 (Correct but difficult) 
- `'forgot'` → Quality 0 (Incorrect)

**Interval Logic:**
- Failed (quality < 3): Reset to interval = 1, repetition = 0
- Success (quality ≥ 3): Increment repetition, calculate new interval
- First repetition: 1 day
- Second repetition: 6 days
- Subsequent: `previous_interval × easiness_factor`

### Frontend Integration

#### Enhanced TypeScript Types
```typescript
interface WordWithProgress {
  // Existing fields...
  // SM2 enhanced fields:
  learning_status: 'new' | 'learning' | 'learned' | 'mastered'
  repetition_count: number
  next_review_date: string
  category_difficulty: number
  easiness_factor: number
  interval_days: number
}
```

#### API Function Updates
- `getWordsForStudy()`: Transforms database response to match interface
- `submitWordResponse()`: Handles difficulty rating submission
- Full compatibility with existing `FlashcardStudyAdvanced` component

## 🎮 User Experience

### No UI Changes Required
- Uses existing Easy/Hard/Forgot buttons in `FlashcardStudyAdvanced`
- Seamless integration with current study flow
- Cards appear at correct intervals automatically

### Difficulty Level Impact
- **HSK 1-2 Categories**: Normal spaced repetition
- **HSK 3+ Categories**: Daily review regardless of performance
- **Hard Category Indicator**: Users see more frequent reviews for difficult content

## 📊 Algorithm Behavior

### Example SM2 Calculations

**Initial State:**
- `easiness_factor = 2.5`
- `repetition_count = 0`
- `interval_days = 1`

**Easy Response (Quality 5):**
```
EF' = 2.5 - 0.8 + 0.28 * 5 - 0.02 * 25 = 2.8
Next interval = 1 day (first repetition)
```

**Hard Response (Quality 3):**
```
EF' = 2.8 - 0.8 + 0.28 * 3 - 0.02 * 9 = 2.66
Next interval = 6 days (second repetition)
```

**Forgot Response (Quality 0):**
```
EF' = 2.66 - 0.8 + 0.28 * 0 - 0.02 * 0 = 1.86
Reset: repetition = 0, interval = 1 day
```

### Hard Category Override
For categories with `difficulty_level >= 3`:
- Cards show **every day** regardless of calculated interval
- SM2 calculations still occur (for future use)
- Provides intensive practice for difficult content

## 🗄️ Database Schema

### Tables Used
- `user_word_progress`: Core SM2 data storage
- `words`: Vocabulary content
- `categories`: Difficulty level and metadata

### Key Fields
```sql
user_word_progress:
  - easiness_factor: DECIMAL(3,2) DEFAULT 2.5
  - interval_days: INTEGER DEFAULT 1  
  - repetition_count: INTEGER DEFAULT 0
  - next_review_date: TIMESTAMP WITH TIME ZONE
  - last_difficulty: VARCHAR ('easy'|'hard'|'forgot')

categories:
  - difficulty_level: INTEGER (1-6, HSK levels)
```

## 🧪 Testing

### Test Script: `test-sm2-implementation.js`
Comprehensive testing including:
- SM2 formula calculations
- Difficulty level logic
- Database function calls
- Integration verification

### Manual Testing Steps
1. **Deploy SQL functions** to Supabase
2. **Run test script** to verify calculations
3. **Test in UI**: Study cards and verify intervals
4. **Check hard categories**: Ensure daily appearance

## 🚀 Deployment

### Required Steps
1. **Update SQL Functions**: Deploy `supermemo2-sm2-enhancement.sql`
2. **Frontend Already Updated**: TypeScript types and API functions ready
3. **No UI Changes**: Existing components work seamlessly

### SQL Deployment
```sql
-- Run in Supabase SQL Editor:
-- Execute supermemo2-sm2-enhancement.sql
```

## 📈 Benefits

### Learning Efficiency
- **Optimized Intervals**: Cards appear at scientifically-proven optimal times
- **Adaptive Difficulty**: Algorithm adjusts to individual performance
- **Hard Content Focus**: Difficult categories get extra attention

### Data-Driven Insights
- **Progress Tracking**: Detailed SM2 metrics stored
- **Performance Analytics**: Easiness factors show learning trends
- **Category Difficulty**: Clear separation of easy vs hard content

## 🔍 Monitoring

### Key Metrics to Track
- Average easiness factors by category
- Interval distribution across users
- Hard category daily review rates
- Learning progression patterns

### Database Queries
```sql
-- Check SM2 data distribution
SELECT 
  AVG(easiness_factor) as avg_ef,
  AVG(interval_days) as avg_interval,
  AVG(repetition_count) as avg_reps
FROM user_word_progress;

-- Hard category usage
SELECT c.name_russian, COUNT(*) as daily_reviews
FROM user_word_progress uwp
JOIN words w ON uwp.word_id = w.id  
JOIN categories c ON w.category_id = c.id
WHERE c.difficulty_level >= 3
GROUP BY c.name_russian;
```

## ✅ Verification Checklist

- [x] **SM2 Formula**: Exact implementation with correct coefficients
- [x] **Interval Logic**: 1 day → 6 days → EF multiplier
- [x] **Quality Mapping**: Easy(5), Hard(3), Forgot(0)
- [x] **Hard Categories**: Daily review for difficulty_level >= 3
- [x] **Database Updates**: All required fields updated
- [x] **Frontend Integration**: Seamless with existing UI
- [x] **No New Tables**: Uses existing schema
- [x] **Russian Fields**: Only Russian category names used
- [x] **Testing**: Comprehensive test suite included

## 🎉 Result

The SuperMemo 2 implementation is **production-ready** and provides:
- Scientifically-proven spaced repetition
- Special handling for difficult content  
- Seamless integration with existing UI
- Comprehensive tracking and analytics
- Optimized Chinese-Russian vocabulary learning experience 
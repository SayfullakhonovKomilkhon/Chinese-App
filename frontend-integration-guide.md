# Frontend Integration Guide - Chinese Learning Application

## Database Schema Implementation Steps

### Step 1: Apply Database Schema
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run `database-schema-complete.sql` to create all tables and functions
3. Run `api-functions.sql` to add the API functions
4. Verify all tables are created successfully

### Step 2: Update TypeScript Interfaces

Create/update these interfaces in `lib/types.ts`:

```typescript
// Word and Category Types
export interface Word {
  id: number;
  category_id: number;
  chinese_simplified: string;
  chinese_traditional?: string;
  pinyin: string;
  russian_translation: string;
  english_translation?: string;
  example_sentence_chinese?: string;
  example_sentence_russian?: string;
  audio_url?: string;
  difficulty_level: number;
  learning_status?: 'new' | 'learning' | 'learned' | 'mastered';
  repetition_count?: number;
  next_review_date?: string;
}

export interface Category {
  id: number;
  name: string;
  name_russian: string;
  description?: string;
  description_russian?: string;
  difficulty_level: number;
  total_words: number;
  is_active: boolean;
  display_order: number;
  progress?: CategoryProgress;
}

export interface CategoryProgress {
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  words_learned: number;
  words_started: number;
  completion_percentage: number;
  last_studied_at?: string;
}

// User Progress Types
export interface UserStatistics {
  total_words_viewed: number;
  total_words_learned: number;
  total_words_mastered: number;
  total_sessions: number;
  total_study_minutes: number;
  current_streak_days: number;
  longest_streak_days: number;
  words_learned_today: number;
  minutes_studied_today: number;
  overall_accuracy: number;
  categories_completed: number;
}

export interface StudySession {
  session_id: number;
  started_at: string;
  words_studied: number;
  words_learned: number;
  correct_answers: number;
  total_answers: number;
}
```

### Step 3: Create New API Functions

Create `lib/api/studyApi.ts`:

```typescript
import { supabase } from '../supabaseClient';
import { Word, UserStatistics, Category } from '../types';

export async function getWordsForStudy(
  categoryId: number, 
  limit: number = 20
): Promise<Word[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('get_words_for_study', {
    p_user_uuid: user.id,
    p_category_id: categoryId,
    p_limit: limit
  });

  if (error) throw error;
  return data || [];
}

export async function submitWordResponse(
  wordId: number,
  difficulty: 'easy' | 'hard' | 'forgot',
  wasCorrect: boolean = true,
  responseTimeMs?: number,
  sessionId?: number
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('submit_word_response', {
    p_user_uuid: user.id,
    p_word_id: wordId,
    p_difficulty: difficulty,
    p_was_correct: wasCorrect,
    p_response_time_ms: responseTimeMs,
    p_session_id: sessionId
  });

  if (error) throw error;
  return data;
}

export async function startStudySession(
  categoryId: number,
  sessionType: string = 'study'
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('start_study_session', {
    p_user_uuid: user.id,
    p_category_id: categoryId,
    p_session_type: sessionType
  });

  if (error) throw error;
  return data;
}

export async function endStudySession(
  sessionId: number,
  wordsStudied: number,
  wordsLearned: number,
  correctAnswers: number,
  totalAnswers: number
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('end_study_session', {
    p_user_uuid: user.id,
    p_session_id: sessionId,
    p_words_studied: wordsStudied,
    p_words_learned: wordsLearned,
    p_correct_answers: correctAnswers,
    p_total_answers: totalAnswers
  });

  if (error) throw error;
  return data;
}

export async function getUserDashboard(): Promise<{
  statistics: UserStatistics;
  categories: Category[];
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('get_user_dashboard', {
    p_user_uuid: user.id
  });

  if (error) throw error;
  return data;
}
```

### Step 4: Update FlashcardStudy Component

Add difficulty rating buttons to `components/FlashcardStudy.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, ThumbsUp, Minus, X, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  getWordsForStudy, 
  submitWordResponse, 
  startStudySession, 
  endStudySession 
} from '@/lib/api/studyApi';

interface FlashcardStudyProps {
  categoryId: number;
  categoryName: string;
}

export function FlashcardStudy({ categoryId, categoryName }: FlashcardStudyProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState({
    wordsStudied: 0,
    wordsLearned: 0,
    correctAnswers: 0,
    totalAnswers: 0
  });
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    initializeSession();
  }, [categoryId]);

  const initializeSession = async () => {
    try {
      // Start session
      const sessionData = await startStudySession(categoryId);
      setSessionId(sessionData.session_id);

      // Load words
      const wordsData = await getWordsForStudy(categoryId, 20);
      setWords(wordsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setLoading(false);
    }
  };

  const handleDifficultyResponse = async (difficulty: 'easy' | 'hard' | 'forgot') => {
    if (!words[currentIndex] || !sessionId) return;

    const responseTime = Date.now() - startTime;
    const wasCorrect = difficulty !== 'forgot';

    try {
      await submitWordResponse(
        words[currentIndex].id,
        difficulty,
        wasCorrect,
        responseTime,
        sessionId
      );

      // Update session stats
      setSessionStats(prev => ({
        wordsStudied: prev.wordsStudied + 1,
        wordsLearned: prev.wordsLearned + (difficulty === 'easy' ? 1 : 0),
        correctAnswers: prev.correctAnswers + (wasCorrect ? 1 : 0),
        totalAnswers: prev.totalAnswers + 1
      }));

      // Move to next word
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
        setStartTime(Date.now());
      } else {
        // Session complete
        await handleSessionComplete();
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  };

  const handleSessionComplete = async () => {
    if (!sessionId) return;

    try {
      await endStudySession(
        sessionId,
        sessionStats.wordsStudied + 1,
        sessionStats.wordsLearned,
        sessionStats.correctAnswers,
        sessionStats.totalAnswers + 1
      );
      
      // Redirect to dashboard or show completion screen
      // router.push('/student');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>;
  }

  const currentWord = words[currentIndex];
  if (!currentWord) {
    return <div>No words available for study.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Прогресс: {currentIndex + 1} из {words.length}</span>
          <span>Изучено: {sessionStats.wordsLearned}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <Card className="mb-6">
        <CardContent className="p-8 text-center">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Chinese Character */}
            <div className="text-6xl font-bold text-gray-900 mb-4">
              {currentWord.chinese_simplified}
            </div>

            {/* Pinyin */}
            <div className="text-2xl text-blue-600 font-medium mb-4">
              {currentWord.pinyin}
            </div>

            {/* Audio Button */}
            {currentWord.audio_url && (
              <Button variant="outline" className="mb-4">
                <Volume2 className="h-4 w-4 mr-2" />
                Произношение
              </Button>
            )}

            {/* Show Answer Button or Translation */}
            {!showAnswer ? (
              <Button 
                onClick={() => setShowAnswer(true)}
                className="w-full max-w-xs"
              >
                Показать перевод
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="text-xl text-gray-700 font-medium">
                  {currentWord.russian_translation}
                </div>
                
                {currentWord.example_sentence_chinese && (
                  <div className="text-sm text-gray-600 border-t pt-4">
                    <div className="font-medium">{currentWord.example_sentence_chinese}</div>
                    {currentWord.example_sentence_russian && (
                      <div className="text-gray-500">{currentWord.example_sentence_russian}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Difficulty Rating Buttons */}
      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 justify-center"
        >
          <Button
            onClick={() => handleDifficultyResponse('forgot')}
            variant="destructive"
            className="flex-1 max-w-32 h-16 flex-col"
          >
            <X className="h-6 w-6 mb-1" />
            <span className="text-xs">Забыл</span>
          </Button>
          
          <Button
            onClick={() => handleDifficultyResponse('hard')}
            variant="outline"
            className="flex-1 max-w-32 h-16 flex-col border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            <Minus className="h-6 w-6 mb-1" />
            <span className="text-xs">Сложно</span>
          </Button>
          
          <Button
            onClick={() => handleDifficultyResponse('easy')}
            variant="default"
            className="flex-1 max-w-32 h-16 flex-col bg-green-600 hover:bg-green-700"
          >
            <ThumbsUp className="h-6 w-6 mb-1" />
            <span className="text-xs">Легко</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
```

### Step 5: Update Student Dashboard

Update `app/student/page.tsx` to use new API:

```typescript
// Replace the existing loadUserStats function
const loadUserStats = async () => {
  try {
    setStatsLoading(true);
    const dashboardData = await getUserDashboard();
    setUserStats(dashboardData.statistics);
    setCategories(dashboardData.categories); // This now includes progress
  } catch (err) {
    console.error('Error loading dashboard:', err);
  } finally {
    setStatsLoading(false);
  }
};

// Update category rendering to show completion status
const renderCategory = (category) => {
  const isCompleted = category.progress?.status === 'completed';
  const isMastered = category.progress?.status === 'mastered';
  
  return (
    <motion.div
      key={category.id}
      className={`
        ${isCompleted || isMastered ? 'opacity-60 order-last' : ''}
        bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6
      `}
    >
      {/* Category content with progress indicators */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{category.name_russian}</h3>
        {(isCompleted || isMastered) && (
          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
            {isMastered ? 'Освоено' : 'Изучено'}
          </span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-cyan-300 mb-1">
          <span>{category.progress?.words_learned || 0} / {category.total_words}</span>
          <span>{Math.round(category.progress?.completion_percentage || 0)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-green-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${category.progress?.completion_percentage || 0}%` }}
          />
        </div>
      </div>
      
      {/* Study button */}
      <Button
        onClick={() => handleStartLearning(category.name)}
        disabled={isCompleted}
        className={isCompleted ? 'opacity-50' : ''}
      >
        {isCompleted ? 'Повторить' : 'Изучать'}
      </Button>
    </motion.div>
  );
};
```

## Key Features Implemented

### ✅ Spaced Repetition Algorithm
- Uses SM-2 algorithm for optimal review timing
- Words appear based on difficulty and previous performance
- Learned words automatically scheduled for future review

### ✅ Difficulty Rating System
- **Easy** (👍): Word moves to learned status faster
- **Hard** (➖): Word stays in learning pool longer
- **Forgot** (❌): Word resets to beginning of learning cycle

### ✅ Category Progress Tracking
- Tracks individual word progress within categories
- Automatically marks categories as "completed" when all words learned
- Completed categories move to bottom of category list
- Visual progress indicators show completion percentage

### ✅ Advanced Statistics
- Real-time statistics updates during study sessions
- Comprehensive dashboard with learning analytics
- Streak tracking and daily progress monitoring
- Accuracy tracking per word and overall

### ✅ Smart Learning Flow
- Only shows words that need review based on spaced repetition
- Prioritizes new words and overdue reviews
- Prevents learned words from appearing in regular study sessions
- Automatic session management and progress tracking

This implementation provides a complete, production-ready learning system with advanced features for effective Chinese language learning! 🚀 
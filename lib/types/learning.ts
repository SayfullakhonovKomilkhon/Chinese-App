// =====================================================
// ADVANCED LEARNING SYSTEM - TYPE DEFINITIONS
// =====================================================
// Comprehensive TypeScript interfaces for the new learning system
// Matches the database schema and provides type safety
// =====================================================

// Core Word Interface
export interface Word {
  id: number
  category_id: number
  chinese_simplified: string
  chinese_traditional?: string
  pinyin: string
  russian_translation: string
  english_translation?: string
  example_sentence_chinese?: string
  example_sentence_russian?: string
  audio_url?: string
  difficulty_level: number
  frequency_rank?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Enhanced Category Interface
export interface Category {
  id: number
  name: string
  name_russian: string
  description?: string
  description_russian?: string
  difficulty_level: number
  total_words: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// User Word Progress (Individual word tracking)
export interface UserWordProgress {
  id: number
  user_uuid: string
  word_id: number
  learning_status: 'new' | 'learning' | 'learned' | 'mastered'
  last_difficulty?: 'easy' | 'hard' | 'forgot'
  repetition_count: number
  easiness_factor: number
  interval_days: number
  next_review_date: string
  correct_answers: number
  total_attempts: number
  accuracy_percentage: number
  first_seen_at: string
  last_seen_at: string
  learned_at?: string
  mastered_at?: string
  created_at: string
  updated_at: string
}

// Category Progress (Category completion tracking)
export interface UserCategoryProgress {
  id: number
  user_uuid: string
  category_id: number
  total_words: number
  words_started: number
  words_learned: number
  words_mastered: number
  completion_percentage: number
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered'
  started_at?: string
  completed_at?: string
  mastered_at?: string
  last_studied_at?: string
  created_at: string
  updated_at: string
}

// Comprehensive User Statistics
export interface UserStatistics {
  user_uuid: string
  total_words_viewed: number
  total_words_learned: number
  total_words_mastered: number
  total_sessions: number
  total_study_minutes: number
  average_session_minutes: number
  current_streak_days: number
  longest_streak_days: number
  total_active_days: number
  words_learned_today: number
  minutes_studied_today: number
  overall_accuracy: number
  categories_completed: number
  categories_mastered: number
  last_activity_date: string
  created_at: string
  updated_at: string
}

// Study Session Tracking
export interface UserSession {
  id: number
  user_uuid: string
  category_id?: number
  words_studied: number
  words_learned: number
  correct_answers: number
  total_answers: number
  session_accuracy: number
  duration_minutes: number
  started_at: string
  ended_at?: string
  session_type: 'study' | 'review' | 'test'
  created_at: string
}

// Detailed Activity Logging
export interface UserActivity {
  id: number
  user_uuid: string
  word_id?: number
  session_id?: number
  activity_type: string
  difficulty_rating?: 'easy' | 'hard' | 'forgot'
  was_correct?: boolean
  response_time_ms?: number
  study_mode: string
  created_at: string
}

// =====================================================
// FRONTEND-SPECIFIC INTERFACES
// =====================================================

// Enhanced Category Summary (for dashboard)
export interface CategorySummary extends Category {
  progress?: UserCategoryProgress
  words_due_for_review?: number
  last_studied?: string
  next_review_date?: string
}

// Word with Progress (for study sessions)
export interface WordWithProgress extends Word {
  progress?: UserWordProgress
  is_due_for_review: boolean
  days_until_review?: number
}

// Dashboard Statistics (aggregated data)
export interface DashboardStats {
  user_statistics: UserStatistics
  categories_progress: UserCategoryProgress[]
  recent_sessions: UserSession[]
  words_due_today: number
  categories_in_progress: number
  learning_streak_active: boolean
  daily_goal_progress: {
    words_target: number
    words_completed: number
    minutes_target: number
    minutes_completed: number
  }
}

// Study Session Data (for active learning)
export interface StudySessionData {
  session_id: number
  category?: Category
  words: WordWithProgress[]
  session_stats: {
    words_studied: number
    words_learned: number
    correct_answers: number
    total_answers: number
    accuracy: number
    duration_minutes: number
  }
}

// Session Summary (post-study results)
export interface SessionSummary {
  session: UserSession
  words_learned: Word[]
  accuracy_improvement: number
  category_progress: UserCategoryProgress
  achievements: Achievement[]
  next_review_date?: string
}

// Achievement System
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  type: 'streak' | 'words' | 'category' | 'accuracy' | 'time'
  unlocked_at: string
  progress?: {
    current: number
    target: number
  }
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

// Spaced Repetition Calculation Input
export interface SpacedRepetitionInput {
  word_id: number
  current_easiness_factor: number
  current_interval_days: number
  current_repetition_count: number
  difficulty_rating: 'easy' | 'hard' | 'forgot'
  was_correct: boolean
}

// Spaced Repetition Calculation Output
export interface SpacedRepetitionOutput {
  new_easiness_factor: number
  new_interval_days: number
  new_repetition_count: number
  next_review_date: string
  learning_status: 'new' | 'learning' | 'learned' | 'mastered'
}

// Progress Update Input
export interface ProgressUpdateInput {
  word_id: number
  difficulty_rating: 'easy' | 'hard' | 'forgot'
  response_time_ms?: number
  session_id?: number
}

// Category Filter Options
export interface CategoryFilterOptions {
  status?: 'not_started' | 'in_progress' | 'completed' | 'mastered'
  difficulty_level?: number[]
  has_due_words?: boolean
  sort_by?: 'display_order' | 'progress' | 'last_studied' | 'difficulty'
  sort_direction?: 'asc' | 'desc'
}

// Study Options
export interface StudyOptions {
  category_id?: number
  max_words?: number
  include_review?: boolean
  include_new?: boolean
  difficulty_levels?: number[]
  session_type?: 'study' | 'review' | 'test'
}

// All types are exported individually above 
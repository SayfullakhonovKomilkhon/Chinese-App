// =====================================================
// ADVANCED LEARNING API
// =====================================================
// Core API functions for the advanced learning system
// Interfaces with Supabase database functions and provides
// spaced repetition, difficulty rating, and progress tracking
// =====================================================

import { supabase } from '@/lib/supabaseClient'
import {
  Word,
  Category,
  UserWordProgress,
  UserCategoryProgress,
  UserStatistics,
  UserSession,
  CategorySummary,
  WordWithProgress,
  DashboardStats,
  StudySessionData,
  SessionSummary,
  ProgressUpdateInput,
  CategoryFilterOptions,
  StudyOptions,
  ApiResponse
} from '@/lib/types/learning'

// =====================================================
// CORE STUDY FUNCTIONS
// =====================================================

/**
 * Get words for study using spaced repetition algorithm
 * Calls the database function get_words_for_study()
 */
export async function getWordsForStudy(
  categoryId?: number,
  options: StudyOptions = {}
): Promise<WordWithProgress[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('get_words_for_study', {
      p_user_uuid: user.id,
      p_category_id: categoryId || null,
      p_limit: options.max_words || 20
    })

    if (error) throw error

    // Transform the data to match WordWithProgress interface
    const words: WordWithProgress[] = (data || []).map((row: any) => ({
      id: row.word_id,
      category_id: categoryId || 0,
      chinese_simplified: row.chinese_simplified,
      chinese_traditional: row.chinese_traditional,
      pinyin: row.pinyin,
      russian_translation: row.russian_translation,
      english_translation: row.english_translation,
      example_sentence_chinese: row.example_sentence_chinese,
      example_sentence_russian: row.example_sentence_russian,
      audio_url: row.audio_url,
      difficulty_level: row.category_difficulty || 1,
      frequency_rank: null,
      is_active: true,
      created_at: '',
      updated_at: '',
      // SM2 enhanced fields
      learning_status: row.learning_status,
      repetition_count: row.repetition_count,
      next_review_date: row.next_review_date,
      category_difficulty: row.category_difficulty,
      easiness_factor: row.easiness_factor,
      interval_days: row.interval_days,
      // Legacy compatibility
      is_due_for_review: true, // Already filtered by the function
      days_until_review: 0
    }))

    return words
  } catch (error) {
    console.error('Error getting words for study:', error)
    throw error
  }
}

/**
 * Submit word response with difficulty rating
 * Calls the database function submit_word_response()
 */
export async function submitWordResponse(
  input: ProgressUpdateInput
): Promise<UserWordProgress> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('submit_word_response', {
      p_user_uuid: user.id,
      p_word_id: input.word_id,
      p_difficulty: input.difficulty_rating,
      p_was_correct: true,
      p_response_time_ms: input.response_time_ms || null,
      p_session_id: input.session_id || null
    })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error submitting word response:', error)
    throw error
  }
}

/**
 * Manually mark a word as learned (immediate feedback)
 * This provides instant gratification for users
 */
export async function markWordAsLearned(wordId: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Update word progress directly to 'learned' status
    const { error } = await supabase
      .from('user_word_progress')
      .upsert({
        user_uuid: user.id,
        word_id: wordId,
        learning_status: 'learned',
        repetition_count: 2, // Ensure minimum for learned status
        learned_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_uuid,word_id'
      })

    if (error) throw error

    // Update statistics triggers will handle the rest
  } catch (error) {
    console.error('Error marking word as learned:', error)
    throw error
  }
}

/**
 * Check if a word is already learned by the user
 */
export async function isWordLearned(wordId: number): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('user_word_progress')
      .select('learning_status')
      .eq('user_uuid', user.id)
      .eq('word_id', wordId)
      .single()

    if (error) {
      // No progress record means not learned
      return false
    }

    return data.learning_status === 'learned' || data.learning_status === 'mastered'
  } catch (error) {
    console.error('Error checking if word is learned:', error)
    return false
  }
}

/**
 * Start a new study session
 * Calls the database function start_study_session()
 */
export async function startStudySession(
  categoryId?: number,
  sessionType: 'study' | 'review' | 'test' = 'study'
): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('start_study_session', {
      p_user_uuid: user.id,
      p_category_id: categoryId || null,
      p_session_type: sessionType
    })

    if (error) throw error

    return data.session_id // Returns session_id from JSON response
  } catch (error) {
    console.error('Error starting study session:', error)
    throw error
  }
}

/**
 * End a study session
 * Calls the database function end_study_session()
 */
export async function endStudySession(
  sessionId: number,
  sessionStats?: {
    wordsStudied: number
    wordsLearned: number
    correctAnswers: number
    totalAnswers: number
  }
): Promise<UserSession> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Use provided stats or default to 0
    const stats = sessionStats || {
      wordsStudied: 0,
      wordsLearned: 0,
      correctAnswers: 0,
      totalAnswers: 0
    }

    const { data, error } = await supabase.rpc('end_study_session', {
      p_user_uuid: user.id,
      p_session_id: sessionId,
      p_words_studied: stats.wordsStudied,
      p_words_learned: stats.wordsLearned,
      p_correct_answers: stats.correctAnswers,
      p_total_answers: stats.totalAnswers
    })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error ending study session:', error)
    throw error
  }
}

// =====================================================
// DASHBOARD AND STATISTICS
// =====================================================

/**
 * Get comprehensive dashboard data
 * Calls the database function get_user_dashboard()
 */
export async function getUserDashboard(): Promise<DashboardStats> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('get_user_dashboard', {
      p_user_uuid: user.id
    })

    if (error) throw error

    // Transform database response to match DashboardStats interface
    const dbResponse = data
    
    // Count categories in progress
    const categoriesInProgress = dbResponse.categories.filter(
      (cat: any) => cat.progress?.status === 'in_progress'
    ).length

    // Count categories completed  
    const categoriesCompleted = dbResponse.categories.filter(
      (cat: any) => cat.progress?.status === 'completed' || cat.progress?.status === 'mastered'
    ).length

    // Transform to expected interface
    const dashboardStats: DashboardStats = {
      user_statistics: {
        ...dbResponse.statistics,
        categories_completed: categoriesCompleted,
        // Add missing fields with defaults
        total_active_days: dbResponse.statistics.total_active_days || 0,
        categories_mastered: dbResponse.categories.filter((cat: any) => cat.progress?.status === 'mastered').length,
        average_session_minutes: dbResponse.statistics.total_sessions > 0 
          ? dbResponse.statistics.total_study_minutes / dbResponse.statistics.total_sessions 
          : 0,
        last_activity_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_uuid: user.id
      },
      categories_progress: dbResponse.categories.map((cat: any) => cat.progress).filter(Boolean),
      recent_sessions: [], // TODO: Add recent sessions if needed
      words_due_today: 0, // TODO: Calculate words due today
      categories_in_progress: categoriesInProgress,
      learning_streak_active: (dbResponse.statistics.current_streak_days || 0) > 0,
      daily_goal_progress: {
        words_target: 10, // Default daily goal
        words_completed: dbResponse.statistics.words_learned_today || 0,
        minutes_target: 30, // Default daily goal
        minutes_completed: dbResponse.statistics.minutes_studied_today || 0
      }
    }

    return dashboardStats
  } catch (error) {
    console.error('Error getting user dashboard:', error)
    throw error
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics(): Promise<UserStatistics> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_uuid', user.id)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting user statistics:', error)
    throw error
  }
}

/**
 * Update user streak
 * Calls the database function update_user_streak()
 */
export async function updateUserStreak(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase.rpc('update_user_streak', {
      p_user_uuid: user.id
    })

    if (error) throw error
  } catch (error) {
    console.error('Error updating user streak:', error)
    throw error
  }
}

// =====================================================
// CATEGORY AND PROGRESS MANAGEMENT
// =====================================================

/**
 * Get categories with progress information
 */
export async function getCategoriesWithProgress(
  filters: CategoryFilterOptions = {}
): Promise<CategorySummary[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get categories
    let categoriesQuery = supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)

    if (filters.difficulty_level) {
      categoriesQuery = categoriesQuery.in('difficulty_level', filters.difficulty_level)
    }

    const { data: categories, error: categoriesError } = await categoriesQuery
      .order(filters.sort_by || 'display_order', { 
        ascending: filters.sort_direction !== 'desc' 
      })

    if (categoriesError) throw categoriesError

    // Get progress for each category
    const { data: progress, error: progressError } = await supabase
      .from('user_category_progress')
      .select('*')
      .eq('user_uuid', user.id)

    if (progressError) throw progressError

    // Combine categories with progress
    const categoriesWithProgress: CategorySummary[] = categories.map(category => {
      const categoryProgress = progress.find(p => p.category_id === category.id)
      
      return {
        ...category,
        progress: categoryProgress,
        last_studied: categoryProgress?.last_studied_at,
        // TODO: Calculate words_due_for_review and next_review_date
        words_due_for_review: 0,
        next_review_date: undefined
      }
    })

    // Apply status filter if specified
    if (filters.status) {
      return categoriesWithProgress.filter(cat => 
        cat.progress?.status === filters.status || 
        (!cat.progress && filters.status === 'not_started')
      )
    }

    return categoriesWithProgress
  } catch (error) {
    console.error('Error getting categories with progress:', error)
    throw error
  }
}

/**
 * Get category progress for a specific category
 */
export async function getCategoryProgress(categoryId: number): Promise<UserCategoryProgress | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('user_category_progress')
      .select('*')
      .eq('user_uuid', user.id)
      .eq('category_id', categoryId)
      .maybeSingle()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting category progress:', error)
    throw error
  }
}

// =====================================================
// WORD AND PROGRESS QUERIES
// =====================================================

/**
 * Get word progress for a specific word
 */
export async function getWordProgress(wordId: number): Promise<UserWordProgress | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_uuid', user.id)
      .eq('word_id', wordId)
      .maybeSingle()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting word progress:', error)
    throw error
  }
}

/**
 * Get words due for review today
 */
export async function getWordsDueToday(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('user_word_progress')
      .select('id', { count: 'exact' })
      .eq('user_uuid', user.id)
      .lte('next_review_date', new Date().toISOString())

    if (error) throw error

    return data?.length || 0
  } catch (error) {
    console.error('Error getting words due today:', error)
    return 0
  }
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Get recent study sessions
 */
export async function getRecentSessions(limit: number = 10): Promise<UserSession[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_uuid', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error getting recent sessions:', error)
    return []
  }
}

/**
 * Get session details with words studied
 */
export async function getSessionDetails(sessionId: number): Promise<SessionSummary | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_uuid', user.id)
      .single()

    if (sessionError) throw sessionError

    // Get words studied in this session
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity')
      .select(`
        *,
        words (*)
      `)
      .eq('session_id', sessionId)
      .eq('user_uuid', user.id)

    if (activitiesError) throw activitiesError

    // Get category progress if session was for a specific category
    let categoryProgress = null
    if (session.category_id) {
      categoryProgress = await getCategoryProgress(session.category_id)
    }

    return {
      session,
      words_learned: activities?.map(a => a.words).filter(Boolean) || [],
      accuracy_improvement: 0, // TODO: Calculate based on previous sessions
      category_progress: categoryProgress!,
      achievements: [], // TODO: Implement achievement system
      next_review_date: undefined // TODO: Calculate next review date
    }
  } catch (error) {
    console.error('Error getting session details:', error)
    return null
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Reset user progress (admin function)
 * Calls the database function reset_user_progress()
 */
export async function resetUserProgress(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase.rpc('reset_user_progress', {
      p_user_uuid: user.id
    })

    if (error) throw error
  } catch (error) {
    console.error('Error resetting user progress:', error)
    throw error
  }
}

/**
 * Get learning analytics for a specific time period
 */
export async function getLearningAnalytics(
  startDate: string,
  endDate: string
): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_uuid', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Process and aggregate the data
    // TODO: Implement analytics calculations
    
    return data || []
  } catch (error) {
    console.error('Error getting learning analytics:', error)
    throw error
  }
}

// All functions are exported individually above 
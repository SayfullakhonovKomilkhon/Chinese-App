// =====================================================
// TEACHER MANAGEMENT API
// =====================================================
// Comprehensive API for teacher panel functionality
// Provides content management, student oversight, and analytics
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
  DashboardStats
} from '@/lib/types/learning'

// =====================================================
// TEACHER-SPECIFIC TYPES
// =====================================================

export interface StudentOverview {
  user_uuid: string
  email: string
  full_name: string
  role: string
}

export interface StudentDetailedProgress {
  user: StudentOverview
  category_progress: UserCategoryProgress[]
  recent_sessions: UserSession[]
  word_progress_sample: UserWordProgress[]
}

export interface TeacherAnalytics {
  platform_stats: {
    total_students: number
    active_students_today: number
    total_words_in_system: number
    total_categories: number
    total_sessions_today: number
    average_session_duration: number
    platform_accuracy: number
  }
  student_engagement: {
    students_with_streak: number
    average_streak_length: number
    students_studied_today: number
    total_study_minutes_today: number
  }
  content_usage: {
    most_studied_categories: Array<{
      category_name: string
      total_sessions: number
      avg_completion: number
    }>
    words_learned_today: number
    categories_completed_today: number
  }
  recent_activity: Array<{
    student_name: string
    activity: string
    timestamp: string
    details: string
  }>
}

export interface ContentManagementItem extends Word {
  category_name: string
  category_difficulty: number
  usage_stats: {
    total_learners: number
    average_accuracy: number
    times_studied: number
  }
}

// =====================================================
// STUDENT MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Get all students with their progress overview
 */
export async function getAllStudentsProgress(): Promise<StudentOverview[]> {
  try {
    console.log('getAllStudentsProgress: Starting simple student fetch...')

    // Simple query - just get students from users table
    const { data: studentsData, error } = await supabase
      .from('users')
      .select('uuid_id, email, full_name, role')
      .eq('role', 'student')
      .order('full_name', { ascending: true })

    if (error) {
      console.error('getAllStudentsProgress: Database error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return []
    }

    console.log('getAllStudentsProgress: Raw data received:', studentsData)

    // Simple transformation - just map the basic fields
    const students = (studentsData || []).map((student: any) => ({
      user_uuid: student.uuid_id,
      email: student.email,
      full_name: student.full_name || student.email,
      role: student.role
    }))

    console.log(`getAllStudentsProgress: Successfully returned ${students.length} students`)
    return students

  } catch (error) {
    console.error('getAllStudentsProgress: Unexpected error:', error)
    return []
  }
}

/**
 * Get detailed progress for a specific student
 */
export async function getStudentDetailedProgress(studentUuid: string): Promise<StudentDetailedProgress> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    // Use SQL function to get detailed student progress
    const { data, error } = await supabase
      .rpc('get_student_detailed_progress', { p_student_uuid: studentUuid })

    if (error) throw error

    if (!data) throw new Error('Student not found')

    return data as StudentDetailedProgress
  } catch (error) {
    console.error('Error getting student detailed progress:', error)
    throw error
  }
}

// =====================================================
// CONTENT MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Get all content with usage statistics
 */
export async function getAllContent(categoryFilter?: number): Promise<ContentManagementItem[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    // Try to use SQL function first, fallback to direct queries
    try {
      const { data, error } = await supabase
        .rpc('get_content_with_stats', { p_category_filter: categoryFilter || null })

      if (error) throw error

      // Transform the data to match our interface
      const wordsWithStats = (data || []).map((word: any) => ({
        ...word,
        usage_stats: {
          total_learners: word.total_learners || 0,
          average_accuracy: Math.round(word.average_accuracy || 0),
          times_studied: word.times_studied || 0
        }
      }))

      return wordsWithStats
    } catch (rpcError) {
      console.log('SQL function not available, using fallback query...')
      
      // Fallback: Use direct table queries
      let query = supabase
        .from('words')
        .select(`
          *,
          categories!inner(
            name,
            name_russian,
            difficulty_level
          )
        `)
        .eq('is_active', true)

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter)
      }

      const { data: wordsData, error: wordsError } = await query
        .order('category_id')
        .order('chinese_simplified')

      if (wordsError) throw wordsError

      // Transform to match ContentManagementItem interface
      const wordsWithStats = (wordsData || []).map((word: any) => ({
        ...word,
        category_name: word.categories?.name_russian || 'Неизвестная категория',
        category_difficulty: word.categories?.difficulty_level || 1,
        usage_stats: {
          total_learners: 0, // Will be calculated later or via separate query
          average_accuracy: 0,
          times_studied: 0
        }
      }))

      return wordsWithStats
    }
  } catch (error) {
    console.error('Error getting all content:', error)
    throw error
  }
}

/**
 * Create a new word
 */
export async function createWord(wordData: Partial<Word>): Promise<Word> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    const { data, error } = await supabase
      .from('words')
      .insert({
        category_id: wordData.category_id,
        chinese_simplified: wordData.chinese_simplified,
        chinese_traditional: wordData.chinese_traditional,
        pinyin: wordData.pinyin,
        russian_translation: wordData.russian_translation,
        english_translation: wordData.english_translation,
        example_sentence_chinese: wordData.example_sentence_chinese,
        example_sentence_russian: wordData.example_sentence_russian,
        audio_url: wordData.audio_url,
        difficulty_level: wordData.difficulty_level || 1,
        frequency_rank: wordData.frequency_rank,
        is_active: wordData.is_active !== false
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating word:', error)
    throw error
  }
}

/**
 * Update an existing word
 */
export async function updateWord(wordId: number, wordData: Partial<Word>): Promise<Word> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    const { data, error } = await supabase
      .from('words')
      .update({
        ...wordData,
        updated_at: new Date().toISOString()
      })
      .eq('id', wordId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating word:', error)
    throw error
  }
}

/**
 * Delete a word
 */
export async function deleteWord(wordId: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', wordId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting word:', error)
    throw error
  }
}

// =====================================================
// CATEGORY MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Get all categories with statistics
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error getting all categories:', error)
    throw error
  }
}

/**
 * Create a new category
 */
export async function createCategory(categoryData: Partial<Category>): Promise<Category> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: categoryData.name,
        name_russian: categoryData.name_russian,
        description: categoryData.description,
        description_russian: categoryData.description_russian,
        difficulty_level: categoryData.difficulty_level || 1,
        is_active: categoryData.is_active !== false,
        display_order: categoryData.display_order || 0
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating category:', error)
    throw error
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(categoryId: number, categoryData: Partial<Category>): Promise<Category> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        ...categoryData,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating category:', error)
    throw error
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    // Check if category has words before deleting
    const { data: wordsInCategory } = await supabase
      .from('words')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1)

    if (wordsInCategory && wordsInCategory.length > 0) {
      throw new Error('Невозможно удалить категорию: в ней есть слова. Сначала переместите или удалите все слова.')
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

// =====================================================
// ANALYTICS FUNCTIONS
// =====================================================

/**
 * Get comprehensive teacher analytics
 */
export async function getTeacherAnalytics(): Promise<TeacherAnalytics> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify teacher/admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('uuid_id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    const today = new Date().toISOString().split('T')[0]

    // Platform statistics
    const [
      { count: totalStudents },
      { count: totalWords },
      { count: totalCategories }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('words').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ])

    // Active students today
    const { data: activeStudentsData } = await supabase
      .from('user_statistics')
      .select('user_uuid')
      .gte('last_activity_date', today)

    const activeStudentsToday = activeStudentsData?.length || 0

    // Sessions today
    const { data: sessionsToday } = await supabase
      .from('user_sessions')
      .select('duration_minutes')
      .gte('started_at', today)

    const totalSessionsToday = sessionsToday?.length || 0
    const avgSessionDuration = sessionsToday && sessionsToday.length > 0
      ? sessionsToday.reduce((sum, s) => sum + s.duration_minutes, 0) / sessionsToday.length
      : 0

    // Platform accuracy
    const { data: accuracyData } = await supabase
      .from('user_statistics')
      .select('overall_accuracy')
      .gt('overall_accuracy', 0)

    const platformAccuracy = accuracyData && accuracyData.length > 0
      ? accuracyData.reduce((sum, u) => sum + u.overall_accuracy, 0) / accuracyData.length
      : 0

    // Student engagement metrics
    const { data: streakData } = await supabase
      .from('user_statistics')
      .select('current_streak_days, words_learned_today, minutes_studied_today, last_activity_date')

    const studentsWithStreak = streakData?.filter(s => s.current_streak_days > 0).length || 0
    const avgStreakLength = streakData && streakData.length > 0
      ? streakData.reduce((sum, s) => sum + s.current_streak_days, 0) / streakData.length
      : 0
    const studentsStudiedToday = streakData?.filter(s => s.last_activity_date === today).length || 0
    const totalStudyMinutesToday = streakData?.reduce((sum, s) => sum + (s.minutes_studied_today || 0), 0) || 0

    // Content usage metrics
    const wordsLearnedToday = streakData?.reduce((sum, s) => sum + (s.words_learned_today || 0), 0) || 0

    const { data: categoriesCompletedToday } = await supabase
      .from('user_category_progress')
      .select('*')
      .gte('completed_at', today)
      .eq('status', 'completed')

    // Most studied categories
    const { data: categorySessionsData } = await supabase
      .from('user_sessions')
      .select(`
        category_id,
        categories (
          name
        )
      `)
      .not('category_id', 'is', null)
      .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

    const categoryStats = categorySessionsData?.reduce((acc, session) => {
      const categoryName = session.category_id ? `Category ${session.category_id}` : 'Unknown'
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostStudiedCategories = Object.entries(categoryStats || {})
      .map(([name, sessions]) => ({
        category_name: name,
        total_sessions: sessions,
        avg_completion: 75 // Placeholder - would need more complex calculation
      }))
      .sort((a, b) => b.total_sessions - a.total_sessions)
      .slice(0, 5)

    // Recent activity (placeholder - would need activity table)
    const recentActivity = [
      {
        student_name: 'Недавняя активность',
        activity: 'будет добавлена',
        timestamp: new Date().toISOString(),
        details: 'в следующей версии'
      }
    ]

    return {
      platform_stats: {
        total_students: totalStudents || 0,
        active_students_today: activeStudentsToday,
        total_words_in_system: totalWords || 0,
        total_categories: totalCategories || 0,
        total_sessions_today: totalSessionsToday,
        average_session_duration: Math.round(avgSessionDuration),
        platform_accuracy: Math.round(platformAccuracy)
      },
      student_engagement: {
        students_with_streak: studentsWithStreak,
        average_streak_length: Math.round(avgStreakLength),
        students_studied_today: studentsStudiedToday,
        total_study_minutes_today: totalStudyMinutesToday
      },
      content_usage: {
        most_studied_categories: mostStudiedCategories,
        words_learned_today: wordsLearnedToday,
        categories_completed_today: categoriesCompletedToday?.length || 0
      },
      recent_activity: recentActivity
    }
  } catch (error) {
    console.error('Error getting teacher analytics:', error)
    throw error
  }
} 
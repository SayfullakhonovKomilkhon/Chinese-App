import { supabase } from './supabaseClient'

export interface UserStatistics {
  user_id: string
  total_questions_viewed: number
  total_sessions: number
  total_minutes: number
  total_days_active: number
  streak_days: number
  questions_viewed_today: number
  last_active_date: string
  created_at: string
  updated_at: string
}

// Get current authenticated user ID and ensure it matches users.uuid_id
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      console.error('Error getting current user:', error)
      return null
    }
    
    // The user.id from Supabase Auth should match users.uuid_id
    const authUUID = user.id
    console.log('Authenticated user UUID:', authUUID)
    
    // Verify this UUID exists in users.uuid_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('uuid_id, email')
      .eq('uuid_id', authUUID)
      .single()
    
    if (userError) {
      console.error('User not found in users table with uuid_id:', authUUID)
      // Still return the UUID as it might be used for initialization
      return authUUID
    }
    
    console.log('Found user in users table:', userData.email, 'with UUID:', userData.uuid_id)
    return userData.uuid_id
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get user statistics for the current authenticated user
export async function getUserStatistics(): Promise<UserStatistics | null> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      console.error('No authenticated user found')
      return null
    }

    console.log('Fetching user statistics for UUID:', userId)

    const { data, error } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId) // Using UUID from Supabase Auth
      .single()

    if (error) {
      console.error('Error fetching user statistics:', error)
      console.error('Error details:', error)
      return null
    }

    console.log('User statistics fetched:', data)
    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// Initialize user statistics for a new user
export async function initializeUserStatistics(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'No authenticated user found' }
    }

    console.log('Initializing user statistics for UUID:', userId)

    const now = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId, // This should be the UUID from Supabase Auth
        total_questions_viewed: 0,
        total_sessions: 0,
        total_minutes: 0,
        total_days_active: 0,
        streak_days: 0,
        questions_viewed_today: 0,
        last_active_date: today,
        created_at: now,
        updated_at: now
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error initializing user statistics:', error)
      return { success: false, error: error.message }
    }

    console.log('User statistics initialized successfully')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Update statistics when user views a question
export async function incrementQuestionViewed(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'No authenticated user found' }
    }

    const today = new Date().toISOString().split('T')[0]
    
    // First get current stats
    const currentStats = await getUserStatistics()
    if (!currentStats) {
      // Initialize if doesn't exist
      await initializeUserStatistics()
      return await incrementQuestionViewed()
    }

    const isNewDay = currentStats.last_active_date !== today
    const newQuestionsViewedToday = isNewDay ? 1 : currentStats.questions_viewed_today + 1
    const newTotalDaysActive = isNewDay ? currentStats.total_days_active + 1 : currentStats.total_days_active

    // Calculate streak
    let newStreakDays = currentStats.streak_days
    if (isNewDay) {
      const lastActiveDate = new Date(currentStats.last_active_date)
      const todayDate = new Date(today)
      const daysDiff = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        // Consecutive day
        newStreakDays = currentStats.streak_days + 1
      } else if (daysDiff > 1) {
        // Streak broken
        newStreakDays = 1
      }
      // If daysDiff === 0, it's the same day, keep current streak
    }

    const { data, error } = await supabase
      .from('user_statistics')
      .update({
        total_questions_viewed: currentStats.total_questions_viewed + 1,
        questions_viewed_today: newQuestionsViewedToday,
        total_days_active: newTotalDaysActive,
        streak_days: newStreakDays,
        last_active_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId) // Using UUID from Supabase Auth

    if (error) {
      console.error('Error updating question viewed statistics:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Update statistics when user completes a study session
export async function updateSessionStatistics(sessionDurationMinutes: number): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'No authenticated user found' }
    }

    const currentStats = await getUserStatistics()
    if (!currentStats) {
      await initializeUserStatistics()
      return await updateSessionStatistics(sessionDurationMinutes)
    }

    const { data, error } = await supabase
      .from('user_statistics')
      .update({
        total_sessions: currentStats.total_sessions + 1,
        total_minutes: currentStats.total_minutes + sessionDurationMinutes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId) // Using UUID from Supabase Auth

    if (error) {
      console.error('Error updating session statistics:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Get statistics with fallback values for display
export async function getUserStatisticsForDashboard(): Promise<UserStatistics> {
  try {
    console.log('📊 Getting user statistics for dashboard...')
    const stats = await getUserStatistics()
    
    if (!stats) {
      console.log('📋 No existing statistics found, returning default values')
      // Return default stats if none exist
      const userId = await getCurrentUserId()
      const defaultStats = {
        user_id: userId || '',
        total_questions_viewed: 0,
        total_sessions: 0,
        total_minutes: 0,
        total_days_active: 0,
        streak_days: 0,
        questions_viewed_today: 0,
        last_active_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Try to initialize statistics automatically
      if (userId) {
        console.log('🔄 Attempting to initialize statistics for new user...')
        const initResult = await initializeUserStatistics()
        if (initResult.success) {
          console.log('✅ Statistics initialized successfully')
          // Try to fetch the newly created stats
          const newStats = await getUserStatistics()
          if (newStats) {
            return newStats
          }
        }
      }
      
      return defaultStats
    }

    console.log('✅ Retrieved existing user statistics:', {
      questions: stats.total_questions_viewed,
      sessions: stats.total_sessions,
      minutes: stats.total_minutes
    })
    return stats
  } catch (error) {
    console.error('Error getting user statistics for dashboard:', error)
    const userId = await getCurrentUserId()
    return {
      user_id: userId || '',
      total_questions_viewed: 0,
      total_sessions: 0,
      total_minutes: 0,
      total_days_active: 0,
      streak_days: 0,
      questions_viewed_today: 0,
      last_active_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
} 
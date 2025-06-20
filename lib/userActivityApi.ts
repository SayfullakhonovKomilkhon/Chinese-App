import { supabase } from './supabaseClient'

export interface UserActivity {
  user_id: number // int8 type matching users.id
  total_questions_viewed: number
  questions_viewed_today: number
  total_minutes: number
  total_sessions: number
  total_days_active: number
  streak_days: number
  last_activity_date: string
  created_at: string
  updated_at: string
}

// Get current authenticated user's ID from users table (int8 type)
async function getCurrentUserIdFromUsersTable(): Promise<number | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      console.error('Error getting authenticated user:', error)
      return null
    }

    // Get the user's email from Supabase Auth
    const userEmail = user.email
    console.log('Authenticated user email:', userEmail)

    // Find the corresponding user in users table by email to get the int8 id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail)
      .single()

    if (userError) {
      console.error('Error finding user in users table:', userError)
      return null
    }

    console.log('Found user in users table:', userData.email, 'with ID:', userData.id)
    return userData.id // This is the int8 ID we need
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return null
  }
}

// Get user activity data for the current authenticated user
export async function getUserActivity(): Promise<UserActivity | null> {
  try {
    const userId = await getCurrentUserIdFromUsersTable()
    if (!userId) {
      console.error('No authenticated user found')
      return null
    }

    console.log('Fetching user activity for user ID:', userId)

    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user activity:', error)
      console.error('Error details:', error)
      return null
    }

    console.log('User activity fetched:', data)
    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// Get today's questions viewed count
export async function getTodayQuestionsViewed(): Promise<number> {
  try {
    const userId = await getCurrentUserIdFromUsersTable()
    if (!userId) {
      return 0
    }

    const today = new Date().toISOString().split('T')[0]
    console.log('Getting today\'s questions viewed for date:', today)

    const userActivity = await getUserActivity()
    if (!userActivity) {
      return 0
    }

    // Check if last activity was today
    const lastActivityDate = userActivity.last_activity_date
    if (lastActivityDate === today) {
      // Simple approach: if user was active today, we'll show their current session progress
      // This will be reset when the day changes and increment during the current session
      return userActivity.questions_viewed_today || 0
    }

    return 0
  } catch (error) {
    console.error('Error getting today\'s questions viewed:', error)
    return 0
  }
}

// Initialize user activity for a new user
export async function initializeUserActivity(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserIdFromUsersTable()
    if (!userId) {
      return { success: false, error: 'No authenticated user found' }
    }

    console.log('Initializing user activity for user ID:', userId)

    const now = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('user_activity')
      .upsert({
        user_id: userId,
        total_questions_viewed: 0,
        questions_viewed_today: 0,
        total_minutes: 0,
        total_sessions: 0,
        total_days_active: 0,
        streak_days: 0,
        last_activity_date: today,
        created_at: now,
        updated_at: now
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error initializing user activity:', error)
      return { success: false, error: error.message }
    }

    console.log('User activity initialized successfully')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Update user activity when user views a question
export async function incrementQuestionViewed(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserIdFromUsersTable()
    if (!userId) {
      return { success: false, error: 'No authenticated user found' }
    }

    const today = new Date().toISOString().split('T')[0]
    
    // First get current activity
    const currentActivity = await getUserActivity()
    if (!currentActivity) {
      // Initialize if doesn't exist
      await initializeUserActivity()
      return await incrementQuestionViewed()
    }

    const isNewDay = currentActivity.last_activity_date !== today
    const newTotalDaysActive = isNewDay ? currentActivity.total_days_active + 1 : currentActivity.total_days_active
    
    // Reset daily count if it's a new day
    const newQuestionsViewedToday = isNewDay ? 1 : (currentActivity.questions_viewed_today + 1)

    // Calculate streak
    let newStreakDays = currentActivity.streak_days
    if (isNewDay) {
      const lastActivityDate = new Date(currentActivity.last_activity_date)
      const todayDate = new Date(today)
      const daysDiff = Math.floor((todayDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        // Consecutive day
        newStreakDays = currentActivity.streak_days + 1
      } else if (daysDiff > 1) {
        // Streak broken
        newStreakDays = 1
      }
    }

    const { data, error } = await supabase
      .from('user_activity')
      .update({
        total_questions_viewed: currentActivity.total_questions_viewed + 1,
        questions_viewed_today: newQuestionsViewedToday,
        total_days_active: newTotalDaysActive,
        streak_days: newStreakDays,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating question viewed:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Update user activity when user completes a study session
export async function updateSessionActivity(sessionDurationMinutes: number): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserIdFromUsersTable()
    if (!userId) {
      return { success: false, error: 'No authenticated user found' }
    }

    const currentActivity = await getUserActivity()
    if (!currentActivity) {
      await initializeUserActivity()
      return await updateSessionActivity(sessionDurationMinutes)
    }

    const { data, error } = await supabase
      .from('user_activity')
      .update({
        total_sessions: currentActivity.total_sessions + 1,
        total_minutes: currentActivity.total_minutes + sessionDurationMinutes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating session activity:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Get user activity with fallback values for dashboard display
export async function getUserActivityForDashboard(): Promise<{
  totalQuestionsViewed: number;
  totalSessions: number;
}> {
  try {
    console.log('📊 Getting user activity for dashboard...')
    const activity = await getUserActivity()
    
    if (!activity) {
      console.log('📋 No existing activity found, returning default values')
      
      // Try to initialize activity automatically
      const userId = await getCurrentUserIdFromUsersTable()
      if (userId) {
        console.log('🔄 Attempting to initialize activity for new user...')
        const initResult = await initializeUserActivity()
        if (initResult.success) {
          console.log('✅ Activity initialized successfully')
          // Try to fetch the newly created activity
          const newActivity = await getUserActivity()
          if (newActivity) {
            return {
              totalQuestionsViewed: newActivity.total_questions_viewed,
              totalSessions: newActivity.total_sessions
            }
          }
        }
      }
      
      // Return default values
      return {
        totalQuestionsViewed: 0,
        totalSessions: 0
      }
    }

    console.log('✅ Retrieved existing user activity:', {
      questions: activity.total_questions_viewed,
      sessions: activity.total_sessions,
      minutes: activity.total_minutes
    })

    const questionsViewedToday = await getTodayQuestionsViewed()

    return {
      totalQuestionsViewed: activity.total_questions_viewed,
      totalSessions: activity.total_sessions
    }
  } catch (error) {
    console.error('Error getting user activity for dashboard:', error)
    return {
      totalQuestionsViewed: 0,
      totalSessions: 0
    }
  }
} 
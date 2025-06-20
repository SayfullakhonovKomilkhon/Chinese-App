import { supabase } from '@/lib/supabaseClient'

export interface UserProgress {
  id: string
  user_id: string
  question_id: number
  status: 'new' | 'learning' | 'studied' | 'mastered' | 'viewed' | 'learned'
  attempts: number
  correct_attempts: number
  last_studied_at: string | null
  next_review_at: string | null
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  category: string
  cards_studied: number
  cards_correct: number
  duration_minutes: number
  session_date: string
  created_at: string
  updated_at: string
}

export interface DailyGoals {
  id: string
  user_id: string
  new_cards_target: number
  review_cards_target: number
  study_time_target: number
  created_at: string
  updated_at: string
}

export interface UserStats {
  user_id: string
  total_studied: number
  categories_studied: number
  total_available: number
  overall_progress_percent: number
  sessions_today: number
  total_sessions: number
}

export interface UserStatistics {
  user_id: string
  studied_words: number
  mastered_words: number
  total_study_time_minutes: number
  streak_days: number
  total_sessions: number
  last_study_date?: string
  created_at: string
  updated_at: string
}

export interface CategoryProgress {
  category: string
  total_cards: number
  studied_cards: number
  progress_percent: number
}

// Mark a card as studied
export async function markCardStudied(cardId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        question_id: cardId,
        status: 'studied',
        last_studied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,question_id'
      })

    if (error) {
      console.error('Error marking card as studied:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Check if a card has been studied by the current user
export async function isCardStudied(cardId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('id')
      .eq('question_id', cardId)
      .maybeSingle()

    if (error) {
      console.error('Error checking if card is studied:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

// Get user's overall statistics
export async function getUserStats(): Promise<UserStats | null> {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('Error fetching user stats:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// Get progress for all categories
export async function getCategoryProgressList(): Promise<CategoryProgress[]> {
  try {
    const { data, error } = await supabase
      .from('category_progress')
      .select('*')
      .order('category')

    if (error) {
      console.error('Error fetching category progress:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

// Get progress for a specific category
export async function getCategoryProgress(category: string): Promise<CategoryProgress | null> {
  try {
    const { data, error } = await supabase
      .from('category_progress')
      .select('*')
      .eq('category', category)
      .maybeSingle()

    if (error) {
      console.error('Error fetching category progress:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// Start a study session
export async function startStudySession(category: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('start_study_session', {
      p_category: category
    })

    if (error) {
      console.error('Error starting study session:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// End a study session
export async function endStudySession(
  sessionId: string,
  cardsViewed: number,
  cardsStudied: number,
  durationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('end_study_session', {
      p_session_id: sessionId,
      p_cards_viewed: cardsViewed,
      p_cards_studied: cardsStudied,
      p_duration_minutes: durationMinutes
    })

    if (error) {
      console.error('Error ending study session:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Get user's study sessions
export async function getStudySessions(limit: number = 10): Promise<StudySession[]> {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching study sessions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

// Get or create daily goals
export async function getDailyGoals(): Promise<DailyGoals | null> {
  try {
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('Error fetching daily goals:', error)
      return null
    }

    // Create default goals if none exist
    if (!data) {
      const { data: newGoals, error: insertError } = await supabase
        .from('daily_goals')
        .insert({
          new_cards_target: 10,
          review_cards_target: 20,
          study_time_target: 30
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating daily goals:', insertError)
        return null
      }

      return newGoals
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// Update daily goals
export async function updateDailyGoals(
  newTarget: number,
  reviewTarget: number,
  studyTimeTarget: number = 30
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('daily_goals')
      .upsert({
        new_cards_target: newTarget,
        review_cards_target: reviewTarget,
        study_time_target: studyTimeTarget,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error updating daily goals:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Get cards studied by category for the current user
export async function getStudiedCardsByCategory(category: string): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('question_id, questions!inner(category)')
      .eq('questions.category', category)

    if (error) {
      console.error('Error fetching studied cards:', error)
      return []
    }

    return data?.map(item => item.question_id) || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

// Get user statistics from user_statistics table
export async function getUserStatistics(): Promise<UserStatistics | null> {
  try {
    const { data, error } = await supabase
      .from('user_statistics')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching user statistics:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// Get recent study sessions for the current user
export async function getRecentStudySessions(limit: number = 10): Promise<StudySession[]> {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching study sessions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

// Get today's study sessions
export async function getTodayStudySessions(): Promise<StudySession[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('session_date', today)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching today\'s study sessions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

// Get user progress with detailed status information
export async function getUserProgressDetailed(): Promise<UserProgress[]> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        questions:question_id (
          id,
          hanzi,
          pinyin,
          translation,
          category
        )
      `)
      .order('last_studied_at', { ascending: false })

    if (error) {
      console.error('Error fetching detailed user progress:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

// Increment studied words counter for a specific card (called when user reveals translation)
export async function incrementStudiedWordsForCard(cardId: number): Promise<{ success: boolean; error?: string; studiedWords?: number }> {
  try {
    const { data, error } = await supabase.rpc('increment_studied_words_for_card', { p_card_id: cardId })

    if (error) {
      console.error('Error incrementing studied words:', error)
      return { success: false, error: error.message }
    }

    return { success: true, studiedWords: data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Mark a card as viewed when user shows translation
export async function markCardViewed(cardId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        question_id: cardId,
        status: 'viewed',
        last_studied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,question_id'
      })

    if (error) {
      console.error('Error marking card as viewed:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Get all viewed card IDs for the current user
export async function getViewedCardIds(): Promise<number[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('User not authenticated')
      return []
    }

    const { data, error } = await supabase
      .from('user_progress')
      .select('question_id')
      .eq('user_id', user.id)
      .eq('status', 'viewed')

    if (error) {
      console.error('Error fetching viewed cards:', error)
      return []
    }

    return data?.map(item => item.question_id) || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

// Mark a card as learned when user clicks the "Finish" button
export async function markCardLearned(cardId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        question_id: cardId,
        status: 'learned',
        last_studied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,question_id'
      })

    if (error) {
      console.error('Error marking card as learned:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Get all learned card IDs for the current user
export async function getLearnedCardIds(): Promise<number[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('User not authenticated')
      return []
    }

    const { data, error } = await supabase
      .from('user_progress')
      .select('question_id')
      .eq('user_id', user.id)
      .eq('status', 'learned')

    if (error) {
      console.error('Error fetching learned cards:', error)
      return []
    }

    return data?.map(item => item.question_id) || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
} 
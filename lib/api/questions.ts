import { supabase } from '@/lib/supabaseClient'

// Define Question type locally for now
export interface Question {
  id: number
  hanzi: string
  pinyin: string
  translation: string
  category: string
  created_at?: string
}

// Get all questions by category
export async function getQuestionsByCategory(category: string): Promise<Question[]> {
  try {
    console.log(`Fetching questions for category: "${category}"`)
    
    const { data, error } = await supabase
      .from('questions')
      .select('id, hanzi, pinyin, translation, category')
      .eq('category', category)
      .order('id')

    console.log('Questions data received:', data)
    console.log('Questions error:', error)

    if (error) {
      console.error('Error fetching questions:', error)
      throw error
    }

    const result = data || []
    console.log(`Found ${result.length} questions for category "${category}"`)
    return result
  } catch (error) {
    console.error('Failed to fetch questions:', error)
    throw error
  }
}

// Get all available categories with question counts using efficient SQL query
export async function getCategoriesWithCounts(): Promise<Array<{ category: string; count: number }>> {
  try {
    console.log('Fetching categories with counts from Supabase...')
    
    // Use Supabase to execute a direct SQL query that groups by category and counts
    const { data, error } = await supabase
      .rpc('get_categories_with_counts')

    console.log('Categories data from RPC:', data)
    console.log('Categories error:', error)

    if (error) {
      console.error('Error fetching categories via RPC:', error)
      // Fallback to manual counting if RPC function doesn't exist
      return await getCategoriesWithCountsFallback()
    }

    if (!data || data.length === 0) {
      console.warn('No category data returned from Supabase RPC')
      return []
    }

    const result = data.map((item: any) => ({
      category: item.category,
      count: item.count
    }))

    console.log('Final categories result:', result)
    return result
  } catch (error) {
    console.error('Failed to fetch categories via RPC, using fallback:', error)
    return await getCategoriesWithCountsFallback()
  }
}

// Fallback method using client-side counting
async function getCategoriesWithCountsFallback(): Promise<Array<{ category: string; count: number }>> {
  try {
    console.log('Using fallback method to fetch categories...')
    
    const { data, error } = await supabase
      .from('questions')
      .select('category')
      .not('category', 'is', null)
      .neq('category', '')

    if (error) {
      console.error('Error fetching categories:', error)
      throw error
    }

    if (!data || data.length === 0) {
      console.warn('No category data returned from Supabase')
      return []
    }

    // Count questions per category
    const categoryMap = new Map<string, number>()
    data.forEach(item => {
      if (item.category && item.category.trim() !== '') {
        const current = categoryMap.get(item.category) || 0
        categoryMap.set(item.category, current + 1)
      }
    })

    const result = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }))

    console.log('Final categories result (fallback):', result)
    return result
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    throw error
  }
}

// Get a random question from a category (for quick practice)
export async function getRandomQuestion(category: string): Promise<Question | null> {
  try {
    const questions = await getQuestionsByCategory(category)
    if (questions.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * questions.length)
    return questions[randomIndex]
  } catch (error) {
    console.error('Failed to get random question:', error)
    return null
  }
}

// Create a new question (for teachers)
export async function createQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<Question | null> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .insert([question])
      .select()
      .single()

    if (error) {
      console.error('Error creating question:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create question:', error)
    throw error
  }
}

// Get categories with their question counts and user progress
export async function getCategoriesWithProgress(): Promise<Array<{
  category: string
  count: number
  studied_cards: number
  progress_percent: number
}>> {
  try {
    const { data, error } = await supabase
      .from('category_progress')
      .select('*')
      .order('category')

    if (error) {
      console.error('Error fetching categories with progress:', error)
      return []
    }

    return data?.map(item => ({
      category: item.category,
      count: item.total_cards,
      studied_cards: item.studied_cards,
      progress_percent: item.progress_percent
    })) || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
} 
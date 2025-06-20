import { supabase } from './supabaseClient'
import { getViewedCardIds } from './api/userProgress'

export interface Question {
  id: number
  hanzi: string
  pinyin: string
  translation: string
  category: string
  created_at?: string
  is_learned?: boolean
}

export interface CategorySummary {
  category: string
  count: number
}

// Get all categories with question counts
export async function getCategories(): Promise<CategorySummary[]> {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('category')

    if (error) {
      console.error('Error fetching categories:', error)
      throw error
    }

    // Group by category and count
    const categoryMap = new Map<string, number>()
    
    questions?.forEach(question => {
      if (question.category) {
        const current = categoryMap.get(question.category) || 0
        categoryMap.set(question.category, current + 1)
      }
    })

    // Convert to array and sort by name
    const categories: CategorySummary[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.category.localeCompare(b.category))

    return categories
  } catch (error) {
    console.error('Error in getCategories:', error)
    throw error
  }
}

// Get all questions for a specific category
export async function getQuestionsByCategory(category: string): Promise<Question[]> {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', category)
      .order('id')

    if (error) {
      console.error('Error fetching questions by category:', error)
      throw error
    }

    return questions || []
  } catch (error) {
    console.error('Error in getQuestionsByCategory:', error)
    throw error
  }
}

// Get all questions
export async function getAllQuestions(): Promise<Question[]> {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .order('category', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching all questions:', error)
      throw error
    }

    return questions || []
  } catch (error) {
    console.error('Error in getAllQuestions:', error)
    throw error
  }
}

// Get questions for a category ordered by viewed status (unviewed first, viewed last)
export async function getQuestionsOrderedByProgress(category: string): Promise<Question[]> {
  try {
    // Get all questions for the category
    const questions = await getQuestionsByCategory(category)
    
    // Get viewed card IDs for current user
    const viewedCardIds = await getViewedCardIds()
    
    // Separate unviewed and viewed questions
    const unviewedQuestions = questions.filter(q => !viewedCardIds.includes(q.id))
    const viewedQuestions = questions.filter(q => viewedCardIds.includes(q.id))
    
    // Return unviewed first, then viewed
    return [...unviewedQuestions, ...viewedQuestions]
  } catch (error) {
    console.error('Error in getQuestionsOrderedByProgress:', error)
    throw error
  }
}

// Get questions for a category with learned status (unlearned first, learned last)
export async function getQuestionsWithLearnedStatus(category: string): Promise<Question[]> {
  try {
    // Get all questions for the category
    const questions = await getQuestionsByCategory(category)
    
    // Get learned card IDs for current user
    const { getLearnedCardIds } = await import('./api/userProgress')
    const learnedCardIds = await getLearnedCardIds()
    
    // Add is_learned property to questions
    const questionsWithStatus = questions.map(q => ({
      ...q,
      is_learned: learnedCardIds.includes(q.id)
    }))
    
    // Separate unlearned and learned questions
    const unlearnedQuestions = questionsWithStatus.filter(q => !q.is_learned)
    const learnedQuestions = questionsWithStatus.filter(q => q.is_learned)
    
    // Return unlearned first, then learned
    return [...unlearnedQuestions, ...learnedQuestions]
  } catch (error) {
    console.error('Error in getQuestionsWithLearnedStatus:', error)
    throw error
  }
} 
import { supabase } from './supabaseClient'

export interface UserProfile {
  id: number
  email: string
  full_name?: string
  status: 'student' | 'teacher'
  password?: string
  created_at: string
}

// Check user's role from the users table
export async function getUserRole(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('status')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }

    return data?.status || null
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return null
  }
}

// Create a new user in the users table
export async function createUserProfile(email: string, fullName?: string, status?: string, password?: string): Promise<boolean> {
  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      console.log('User already exists in users table')
      return true
    }

    // Create new user with provided data
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          full_name: fullName || email.split('@')[0],
          status: status || 'student',
          password: password || ''
        }
      ])
      .select()

    if (error) {
      console.error('Error creating user profile:', error)
      return false
    }

    console.log('User profile created successfully:', data)
    return true
  } catch (error) {
    console.error('Error in createUserProfile:', error)
    return false
  }
}

// Get full user profile
export async function getUserProfile(email: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
} 
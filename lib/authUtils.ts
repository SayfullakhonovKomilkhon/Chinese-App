// =====================================================
// AUTHENTICATION UTILITIES
// =====================================================
// Utilities for role-based access control, user management,
// and authentication state handling
// =====================================================

import { supabase } from './supabaseClient'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: number
  uuid_id: string
  email: string
  full_name: string
  role: 'student' | 'admin'
  created_at: string
  updated_at: string
  email_verified: boolean
  email_confirmed_at: string | null
}

export type UserRole = 'student' | 'admin'

/**
 * Get current authenticated user with profile information
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    console.log('getCurrentUser: Starting auth check...')
    
    // Add timeout to prevent hanging
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth check timeout')), 8000)
    })
    
    const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]) as any
    
    if (error) {
      console.log('getCurrentUser: Auth error:', error.message)
      // If it's just a session missing error, that's normal for non-authenticated users
      if (error.message === 'Auth session missing!' || error.message.includes('session')) {
        console.log('getCurrentUser: No active session - user not logged in')
        return null
      }
      return null
    }
    
    if (!user) {
      console.log('getCurrentUser: No authenticated user found')
      return null
    }

    console.log('getCurrentUser: Auth user found, ID:', user.id, 'Email:', user.email)

    // Get user profile directly from users table with detailed error handling
    console.log('getCurrentUser: Fetching profile from users table...')
    
    // Add timeout to database query
    const dbPromise = supabase
      .from('users')
      .select('*')
      .eq('uuid_id', user.id)
      .single()
    
    const dbTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    })
    
    const { data: profileData, error: profileError } = await Promise.race([dbPromise, dbTimeoutPromise]) as any

    if (profileError) {
      console.error('getCurrentUser: Profile fetch error:', profileError)
      console.error('Error code:', profileError.code)
      console.error('Error message:', profileError.message)
      console.error('Error hint:', profileError.hint)
      
      // Handle specific RLS error
      if (profileError.code === '42501' || profileError.message?.includes('RLS') || profileError.message?.includes('permission')) {
        console.error('getCurrentUser: RLS permission error - user cannot read their own profile!')
        console.error('This indicates RLS policies are blocking user profile access')
        
        // Try bypass function as fallback
        try {
          console.log('getCurrentUser: Attempting bypass function for role fetch...')
          const { data: roleData, error: roleError } = await supabase.rpc('get_user_role_bypass', {
            user_uuid: user.id
          })
          
          if (!roleError && roleData) {
            console.log('getCurrentUser: Role fetched via bypass:', roleData)
            // Create minimal profile with role from bypass
            const fallbackProfile: UserProfile = {
              id: 0, // We don't have the ID
              uuid_id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              role: roleData as UserRole,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              email_verified: user.email_confirmed_at !== null,
              email_confirmed_at: user.email_confirmed_at
            }
            console.log('getCurrentUser: Using fallback profile with role:', roleData)
            return fallbackProfile
          }
        } catch (bypassError) {
          console.error('getCurrentUser: Bypass function also failed:', bypassError)
        }
      }

      if (profileError.code !== 'PGRST116') {
        console.error('getCurrentUser: Unhandled profile error, returning null')
      return null
      }
    }

    if (!profileData) {
      console.log('getCurrentUser: No profile data found, user needs to be created in users table')
      
      // Try to create user record in users table if it doesn't exist
      console.log('getCurrentUser: Attempting to create user record...')
      const newUserData = {
        uuid_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        role: (user.user_metadata?.role || 'student') as UserRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUserData)
        .select('*')
        .single()

      if (createError) {
        console.error('getCurrentUser: Error creating user profile:', createError)
        console.error('Create error code:', createError.code)
        console.error('Create error message:', createError.message)
        
        if (createError.code === '42501' || createError.message?.includes('RLS')) {
          console.error('getCurrentUser: RLS blocking user creation - this is a critical auth configuration issue!')
        }
        return null
      }

      console.log('getCurrentUser: User profile created successfully:', createdUser.email, 'Role:', createdUser.role)
      
      // Return the newly created profile
      const userProfile: UserProfile = {
        ...createdUser,
        email_verified: user.email_confirmed_at !== null,
        email_confirmed_at: user.email_confirmed_at
      }

      console.log('getCurrentUser: Success, returning newly created user profile')
      return userProfile
    }

    console.log('getCurrentUser: Profile data found:', profileData.email, 'Role:', profileData.role)

    // Add email verification status from auth user
    const userProfile: UserProfile = {
      ...profileData,
      email_verified: user.email_confirmed_at !== null,
      email_confirmed_at: user.email_confirmed_at
    }

    console.log('getCurrentUser: Success, returning user profile with role:', userProfile.role)
    return userProfile
  } catch (error) {
    console.error('getCurrentUser: Unexpected error:', error)
    return null
  }
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    return user?.role === role && user.email_verified
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return await hasRole('admin')
}

/**
 * Check if current user is student
 */
export async function isStudent(): Promise<boolean> {
  return await hasRole('student')
}

/**
 * Check if user email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    return user?.email_verified || false
  } catch (error) {
    console.error('Error checking email verification:', error)
    return false
  }
}

/**
 * Require authentication and specific role
 */
export async function requireAuth(requiredRole?: UserRole): Promise<UserProfile> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.email_verified) {
    throw new Error('Email verification required')
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new Error(`${requiredRole} role required`)
  }

  return user
}

/**
 * Require admin access
 */
export async function requireAdmin(): Promise<UserProfile> {
  return await requireAuth('admin')
}

/**
 * Require student access
 */
export async function requireStudent(): Promise<UserProfile> {
  return await requireAuth('student')
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    console.log('refreshSession: Attempting to refresh session...')
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.log('refreshSession: Error refreshing session:', error.message)
      return false
    }
    
    if (data.session) {
      console.log('refreshSession: Session refreshed successfully')
      return true
    }
    
    console.log('refreshSession: No session to refresh')
    return false
  } catch (error) {
    console.error('refreshSession: Unexpected error:', error)
    return false
  }
}

/**
 * Check if current session is valid and refresh if needed
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    console.log('ensureValidSession: Checking session validity...')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('ensureValidSession: Session check error:', error.message)
      return false
    }
    
    if (!session) {
      console.log('ensureValidSession: No session found')
      return false
    }
    
    // Check if token is close to expiry (within 5 minutes)
    const expiresAt = session.expires_at || 0
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt - now
    
    if (timeUntilExpiry < 300) { // Less than 5 minutes
      console.log('ensureValidSession: Token expires soon, refreshing...')
      return await refreshSession()
    }
    
    console.log('ensureValidSession: Session is valid')
    return true
  } catch (error) {
    console.error('ensureValidSession: Unexpected error:', error)
    return false
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<Pick<UserProfile, 'full_name'>>): Promise<void> {
  try {
    const user = await requireAuth()
    
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('uuid_id', user.uuid_id)

    if (error) throw error
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

/**
 * Get user dashboard redirect path based on role
 */
export function getUserDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/teacher'
    case 'student':
      return '/student'
    default:
      return '/student'
  }
}

/**
 * Check if user can access a specific path
 */
export async function canAccessPath(path: string): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.email_verified) {
      return false
    }

    // Public paths (accessible to all authenticated users)
    const publicPaths = ['/auth/callback', '/']
    if (publicPaths.includes(path)) {
      return true
    }

    // Admin paths
    const adminPaths = ['/teacher', '/admin']
    if (adminPaths.some(adminPath => path.startsWith(adminPath))) {
      return user.role === 'admin'
    }

    // Student paths
    const studentPaths = ['/student', '/study']
    if (studentPaths.some(studentPath => path.startsWith(studentPath))) {
      return user.role === 'student' || user.role === 'admin' // Admins can access student areas
    }

    return false
  } catch (error) {
    console.error('Error checking path access:', error)
    return false
  }
}

/**
 * Redirect user to appropriate dashboard based on role
 */
export async function redirectToDashboard(): Promise<string> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return '/'
    }

    if (!user.email_verified) {
      return '/?verify=true'
    }

    return getUserDashboardPath(user.role)
  } catch (error) {
    console.error('Error determining redirect path:', error)
    return '/'
  }
}

/**
 * Format user display name
 */
export function getDisplayName(user: UserProfile): string {
  if (user.full_name && user.full_name.trim()) {
    return user.full_name
  }
  
  // Fallback to email username
  return user.email.split('@')[0]
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Администратор'
    case 'student':
      return 'Студент'
    default:
      return 'Пользователь'
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Пароль должен содержать минимум 6 символов')
  }
  
  if (password.length > 128) {
    errors.push('Пароль слишком длинный (максимум 128 символов)')
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну букву')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Authentication event handlers
 */
export class AuthEventHandler {
  private static instance: AuthEventHandler
  private listeners: Array<(user: UserProfile | null) => void> = []

  static getInstance(): AuthEventHandler {
    if (!AuthEventHandler.instance) {
      AuthEventHandler.instance = new AuthEventHandler()
    }
    return AuthEventHandler.instance
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners(user: UserProfile | null): void {
    this.listeners.forEach(listener => listener(user))
  }

  /**
   * Initialize auth state monitoring
   */
  initialize(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const userProfile = await getCurrentUser()
          this.notifyListeners(userProfile)
        } catch (error) {
          console.error('Error getting user profile on sign in:', error)
          this.notifyListeners(null)
        }
      } else if (event === 'SIGNED_OUT') {
        this.notifyListeners(null)
      }
    })
  }
} 
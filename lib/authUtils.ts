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
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user profile directly from users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('uuid_id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return null
    }

    // Add email verification status from auth user
    const userProfile: UserProfile = {
      ...profileData,
      email_verified: user.email_confirmed_at !== null,
      email_confirmed_at: user.email_confirmed_at
    }

    return userProfile
  } catch (error) {
    console.error('Error getting current user:', error)
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
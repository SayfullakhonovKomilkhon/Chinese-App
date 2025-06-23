'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserProfile, getCurrentUser } from '@/lib/authUtils'
import { supabase } from '@/lib/supabaseClient'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetchUser: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refetchUser = async () => {
    try {
      console.log('AuthProvider: refetchUser called')
      setLoading(true)
      const currentUser = await getCurrentUser()
      console.log('AuthProvider: refetchUser result:', currentUser ? 'User found' : 'No user')
      setUser(currentUser)
    } catch (error) {
      console.error('Error refetching user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('AuthProvider: Initializing...')
    let timeoutId: NodeJS.Timeout
    
    // Set a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.log('AuthProvider: Safety timeout reached - forcing loading to false')
      setLoading(false)
    }, 10000) // 10 second timeout
    
    // Initial user check with timeout
    const checkInitialUser = async () => {
      try {
        console.log('AuthProvider: Checking initial user...')
        
        // Create a promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('getCurrentUser timeout'))
          }, 5000)
        })
        
        // Race between getCurrentUser and timeout
        const currentUser = await Promise.race([
          getCurrentUser(),
          timeoutPromise
        ]) as UserProfile | null
        
        clearTimeout(timeoutId)
        console.log('AuthProvider: Initial user result:', currentUser ? `User found: ${currentUser.email} (${currentUser.role})` : 'No user - this is normal for non-authenticated users')
        setUser(currentUser)
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('AuthProvider: Error getting initial user:', error)
        setUser(null)
      } finally {
        clearTimeout(safetyTimeout)
        console.log('AuthProvider: Initial check complete, setting loading to false')
        setLoading(false)
      }
    }

    // Check for existing session first
    const checkExistingSession = async () => {
      try {
        console.log('AuthProvider: Checking for existing session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.log('AuthProvider: Session check error:', error.message)
          return false
        }
        
        if (session?.user) {
          console.log('AuthProvider: Found existing session for user:', session.user.id)
          return true
        }
        
        console.log('AuthProvider: No existing session found')
        return false
      } catch (error) {
        console.error('AuthProvider: Error checking existing session:', error)
        return false
      }
    }

    // Check for existing session, then check initial user
    checkExistingSession().then(hasSession => {
      if (hasSession) {
        console.log('AuthProvider: Session exists, auth state change should handle it')
      }
      checkInitialUser()
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          console.log('AuthProvider: Processing sign in...')
          const userProfile = await getCurrentUser()
          console.log('AuthProvider: User signed in:', userProfile ? `Profile loaded: ${userProfile.email} (${userProfile.role})` : 'No profile')
          setUser(userProfile)
          setLoading(false)
        } catch (error) {
          console.error('AuthProvider: Error getting user profile on sign in:', error)
          setUser(null)
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthProvider: User signed out')
        setUser(null)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Don't change loading state for token refresh, just update user data
        console.log('AuthProvider: Token refreshed, updating user profile')
        try {
          const userProfile = await getCurrentUser()
          console.log('AuthProvider: User profile updated after token refresh')
          setUser(userProfile)
        } catch (error) {
          console.error('AuthProvider: Error getting user profile on token refresh:', error)
          // Don't sign out on token refresh error, just log it
        }
      } else if (event === 'USER_UPDATED' && session?.user) {
        // Handle user metadata updates
        console.log('AuthProvider: User updated, refreshing profile')
        try {
          const userProfile = await getCurrentUser()
          setUser(userProfile)
        } catch (error) {
          console.error('AuthProvider: Error getting user profile on user update:', error)
        }
      }
    })

    // Set up periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      try {
        console.log('AuthProvider: Periodic session check...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.log('AuthProvider: No valid session in periodic check, user will be signed out')
          return
        }
        
        // Check if token is close to expiry
        const expiresAt = session.expires_at || 0
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = expiresAt - now
        
        if (timeUntilExpiry < 300) { // Less than 5 minutes
          console.log('AuthProvider: Token expires soon, triggering refresh...')
          await supabase.auth.refreshSession()
        }
      } catch (error) {
        console.error('AuthProvider: Error in periodic session check:', error)
      }
    }, 5 * 60 * 1000) // Every 5 minutes

    // Cleanup function
    return () => {
      clearTimeout(safetyTimeout)
      if (timeoutId) clearTimeout(timeoutId)
      clearInterval(sessionCheckInterval)
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    loading,
    refetchUser
  }

  console.log('AuthProvider: Rendering with loading =', loading, 'user =', user ? `${user.email} (${user.role})` : 'null')

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 
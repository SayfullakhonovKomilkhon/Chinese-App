'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserProfile, getCurrentUser, AuthEventHandler } from '@/lib/authUtils'

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
      setLoading(true)
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error refetching user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initialize auth event handler
    const authHandler = AuthEventHandler.getInstance()
    authHandler.initialize()

    // Subscribe to auth state changes
    const unsubscribe = authHandler.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    // Initial user fetch
    refetchUser()

    return unsubscribe
  }, [])

  const value = {
    user,
    loading,
    refetchUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 
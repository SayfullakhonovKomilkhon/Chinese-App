import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { ensureValidSession } from '@/lib/authUtils'

interface UseAuthGuardOptions {
  requireRole?: 'student' | 'admin'
  requireEmailVerification?: boolean
  redirectPath?: string
}

/**
 * Custom hook to protect pages and ensure session persistence
 * This hook will:
 * - Check if user is authenticated
 * - Verify session validity and refresh if needed
 * - Redirect if authentication requirements are not met
 * - Handle role-based access control
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const {
    requireRole,
    requireEmailVerification = true,
    redirectPath = '/'
  } = options

  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) {
      console.log('useAuthGuard: Still loading, waiting...')
      return
    }

    const checkAuthAndSession = async () => {
      try {
        console.log('useAuthGuard: Starting auth and session check...')
        
        // First check if we have a valid session
        const sessionValid = await ensureValidSession()
        
        if (!sessionValid) {
          console.log('useAuthGuard: Invalid session, redirecting to:', redirectPath)
          router.push(redirectPath)
          return
        }

        // Check user authentication
        if (!user) {
          console.log('useAuthGuard: No user found after session validation, redirecting to:', redirectPath)
          router.push(redirectPath)
          return
        }

        console.log('useAuthGuard: User found:', user.email, 'Role:', user.role)

        // Check email verification if required
        if (requireEmailVerification && !user.email_verified) {
          console.log('useAuthGuard: Email not verified, redirecting to verification')
          router.push('/?verify=true')
          return
        }

        // Check role requirement
        if (requireRole) {
          console.log('useAuthGuard: Checking role requirement. Required:', requireRole, 'User has:', user.role)
          
          if (user.role !== requireRole) {
            console.log('useAuthGuard: Role mismatch! Required:', requireRole, 'User has:', user.role)
            console.log('useAuthGuard: Redirecting user based on their actual role...')
            
            if (user.role === 'student') {
              console.log('useAuthGuard: Redirecting student to /student')
              router.push('/student')
            } else if (user.role === 'admin') {
              console.log('useAuthGuard: Redirecting admin to /teacher')
              router.push('/teacher')
            } else {
              console.log('useAuthGuard: Unknown role, redirecting to:', redirectPath)
              router.push(redirectPath)
            }
            return
          }
          
          console.log('useAuthGuard: Role requirement satisfied!')
        }

        console.log('useAuthGuard: All checks passed for user:', user.email, 'with role:', user.role)
      } catch (error) {
        console.error('useAuthGuard: Error checking auth state:', error)
        console.error('useAuthGuard: This might indicate RLS or database access issues')
        
        // Don't redirect immediately on error - might be temporary
        console.log('useAuthGuard: Giving user benefit of doubt on auth error, not redirecting yet')
        
        // Only redirect after multiple failures
        setTimeout(() => {
          console.log('useAuthGuard: Auth error timeout reached, redirecting to:', redirectPath)
          router.push(redirectPath)
        }, 3000) // 3 second delay
      }
    }

    checkAuthAndSession()
  }, [user, loading, requireRole, requireEmailVerification, redirectPath, router])

  // Set up periodic session validation for authenticated pages
  useEffect(() => {
    if (!user || loading) return

    // Check session validity every 2 minutes for active pages
    const sessionCheckInterval = setInterval(async () => {
      try {
        const sessionValid = await ensureValidSession()
        if (!sessionValid) {
          console.log('useAuthGuard: Session became invalid, redirecting')
          router.push(redirectPath)
        }
      } catch (error) {
        console.error('useAuthGuard: Error in session check:', error)
      }
    }, 2 * 60 * 1000) // Every 2 minutes

    return () => clearInterval(sessionCheckInterval)
  }, [user, loading, redirectPath, router])

  return {
    user,
    loading,
    isAuthenticated: !!user && (!requireEmailVerification || user.email_verified),
    hasRequiredRole: !requireRole || (user?.role === requireRole)
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { isValidEmail, validatePassword } from '@/lib/authUtils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, fullName, role, confirmPassword } = body

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    if (action === 'signup') {
      // Validate signup data
      if (!email || !password || !confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'Email, password, and confirm password are required' },
          { status: 400 }
        )
      }

      if (!isValidEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid email address' },
          { status: 400 }
        )
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'Passwords do not match' },
          { status: 400 }
        )
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          { success: false, error: passwordValidation.errors[0] },
          { status: 400 }
        )
      }

      // All new users are automatically registered as students
      const userRole = 'student'

      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
            role: userRole
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        }
      })

      if (error) {
        console.error('Signup error:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }

      if (!data.user) {
        return NextResponse.json(
          { success: false, error: 'Failed to create user account' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        user: {
          id: data.user.id,
          email: data.user.email,
          role: userRole,
          email_confirmed: false
        }
      })
    }

    if (action === 'signin') {
      // Validate signin data
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required' },
          { status: 400 }
        )
      }

      if (!isValidEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid email address' },
          { status: 400 }
        )
      }

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Signin error:', error)
        
        // Provide user-friendly error messages
        let errorMessage = 'Login failed. Please try again.'
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address before signing in.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later.'
        }

        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: 400 }
        )
      }

      if (!data.user) {
        return NextResponse.json(
          { success: false, error: 'Login failed. Please try again.' },
          { status: 500 }
        )
      }

      // Check if email is confirmed
      if (!data.user.email_confirmed_at) {
        return NextResponse.json(
          { success: false, error: 'Please verify your email address before signing in. Check your inbox for the verification link.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Signed in successfully!',
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed: !!data.user.email_confirmed_at
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
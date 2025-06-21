import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Test email verification by attempting signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test User',
          role: 'student'
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Check if confirmation email was sent
    const emailSent = !data.session && data.user && !data.user.email_confirmed_at

    return NextResponse.json({
      success: true,
      emailVerificationRequired: emailSent,
      userCreated: !!data.user,
      sessionCreated: !!data.session,
      message: emailSent 
        ? 'Email verification required - check your inbox'
        : 'User created without email verification (check Supabase settings)',
      userId: data.user?.id,
      emailConfirmed: !!data.user?.email_confirmed_at
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
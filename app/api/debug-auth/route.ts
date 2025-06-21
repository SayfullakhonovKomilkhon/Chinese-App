import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // Test current auth configuration
    const { data: { session } } = await supabase.auth.getSession()
    
    return NextResponse.json({
      success: true,
      currentSession: !!session,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Debug failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      )
    }

    console.log('🔍 Testing signup with email:', email)
    
    // Test signup with detailed logging
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Debug Test User',
          role: 'student'
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    })

    console.log('📧 Signup result:', {
      user: !!data.user,
      session: !!data.session,
      userId: data.user?.id,
      emailConfirmed: data.user?.email_confirmed_at,
      error: error?.message
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.name
      }, { status: 400 })
    }

    // Check if email confirmation was sent
    const needsConfirmation = !data.session && data.user && !data.user.email_confirmed_at

    return NextResponse.json({
      success: true,
      userCreated: !!data.user,
      sessionCreated: !!data.session,
      emailConfirmationRequired: needsConfirmation,
      emailConfirmed: !!data.user?.email_confirmed_at,
      userId: data.user?.id,
      message: needsConfirmation 
        ? '📧 Email confirmation required - check inbox'
        : '⚠️ User created without email confirmation (check settings)',
      debugInfo: {
        hasUser: !!data.user,
        hasSession: !!data.session,
        confirmationSent: needsConfirmation,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      }
    })

  } catch (error) {
    console.error('❌ Debug signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
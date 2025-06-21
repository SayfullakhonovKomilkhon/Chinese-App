import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { isValidEmail } from '@/lib/authUtils'

export async function GET(request: NextRequest) {
  try {
    // Get all users with roles (admin only)
    const { data, error } = await supabase.rpc('get_users_with_roles')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: data.error },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      users: data.users
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userEmail } = body

    // Validate required fields
    if (!action || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Action and user email are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    if (action === 'promote') {
      // Promote user to admin
      const { data, error } = await supabase.rpc('promote_user_to_admin', {
        target_user_email: userEmail
      })

      if (error) {
        console.error('Error promoting user:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to promote user' },
          { status: 500 }
        )
      }

      if (!data.success) {
        return NextResponse.json(
          { success: false, error: data.error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: data.message,
        userEmail: data.user_email,
        newRole: data.new_role
      })
    }

    if (action === 'demote') {
      // Demote user to student
      const { data, error } = await supabase.rpc('demote_user_to_student', {
        target_user_email: userEmail
      })

      if (error) {
        console.error('Error demoting user:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to demote user' },
          { status: 500 }
        )
      }

      if (!data.success) {
        return NextResponse.json(
          { success: false, error: data.error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: data.message,
        userEmail: data.user_email,
        newRole: data.new_role
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "promote" or "demote"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
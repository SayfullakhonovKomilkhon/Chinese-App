import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection...')
    console.log('Environment variables:', {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? 'SET' : 'NOT SET'
    })

    // Test basic connection
    const { data, error } = await supabase
      .from('categories')
      .select('id, name_russian')
      .limit(1)

    if (error) {
      console.error('❌ Supabase connection error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }

    console.log('✅ Supabase connection successful')
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection working',
      data: data,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL
      }
    })

  } catch (error) {
    console.error('❌ Test connection error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 
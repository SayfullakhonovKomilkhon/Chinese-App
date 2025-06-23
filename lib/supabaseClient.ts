import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://krebizyheqykuwgfwqeo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZWJpenloZXF5a3V3Z2Z3cWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzM2NzksImV4cCI6MjA2NTY0OTY3OX0.RXHetJXVUNKnVViaNq9OVYqmeEpv8yk56ugFzk-YGqg'
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enables session persistence in localStorage
    autoRefreshToken: true, // Automatically refreshes the token when it expires
    detectSessionInUrl: true, // Detects session from URL (for email confirmation)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
}) 